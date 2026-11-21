import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { json, people, record, removePeople, request, sql, createPeople } from './fixtures';

vi.mock('@/lib/server/session', () => ({ currentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
const { currentUser } = await import('@/lib/server/session');
const users = await import('@/lib/server/users');
const { DbError } = await import('@/lib/server/db');
const register = await import('@/app/api/register/route');
const mentor = await import('@/app/api/mentor/route');
const { config } = await import('@/auth');

const signIn = (user: (typeof people)[keyof typeof people] | null) => vi.mocked(currentUser).mockResolvedValue(user);

beforeAll(createPeople);
afterAll(async () => {
  await removePeople();
  await sql.end();
});

describe('email and password', () => {
  it('stores only a bcrypt hash, never the password', async () => {
    const created = await users.createPasswordUser('Hasher@test.invalid', 'a long password 1', 'Hasher');
    expect(created.email).toBe('hasher@test.invalid');
    const [row] = await sql<{ password_hash: string }[]>`select password_hash from public.users where id = ${created.id}`;
    expect(row?.password_hash).toMatch(/^\$2[aby]\$10\$/); // bcrypt, cost 10
    expect(row?.password_hash).not.toContain('a long password 1');
  });

  it('verifyCredentials: the right password signs in, any failure is a plain null', async () => {
    expect(await users.verifyCredentials('HASHER@test.invalid', 'a long password 1')).toMatchObject({ email: 'hasher@test.invalid', role: 'intern' });
    expect(await users.verifyCredentials('hasher@test.invalid', 'a long password 2')).toBeNull();
    expect(await users.verifyCredentials('nobody@test.invalid', 'a long password 1')).toBeNull();
    expect(await users.verifyCredentials(people.one.email, 'anything at all')).toBeNull(); // a user with no password
  });

  it('the returned user never carries the hash', async () => {
    expect(await users.verifyCredentials('hasher@test.invalid', 'a long password 1')).not.toHaveProperty('password_hash');
  });

  it('the seeded demo account works with the documented password (hashed by Postgres, checked by bcryptjs)', async () => {
    expect(await users.verifyCredentials('ronit@example.com', 'demo-password-123')).toMatchObject({ name: 'Ronit Ahuja' });
  });
});

describe('POST /api/register', () => {
  const post = async (body: unknown) => json(await register.POST(request('POST', '/api/register', body)));
  it('201 for a new account (and no hash in the answer)', async () => {
    const { status, body } = await post({ email: 'newcomer@test.invalid', password: 'ten chars!!', name: 'Newcomer' });
    expect(status).toBe(201);
    expect(record(record(body).user)).toEqual({ id: expect.any(String), email: 'newcomer@test.invalid', name: 'Newcomer', role: 'intern' });
  });
  it('409 for an email already registered, in any letter case', async () => {
    expect((await post({ email: 'NEWCOMER@test.invalid', password: 'ten chars!!', name: 'Again' })).status).toBe(409);
  });
  it('400 with field messages', async () => {
    const { status, body } = await post({ email: 'x', password: 'short', name: '' });
    expect(status).toBe(400);
    expect(Object.keys(record(record(body).fields)).sort()).toEqual(['email', 'name', 'password']);
  });
});

describe('GitHub accounts', () => {
  const identity = { providerAccountId: '9000001', email: 'octo@test.invalid', name: 'Octo Cat', image: 'https://avatars.example/octo.png', login: 'octocat' };

  it('the first sign-in creates a user (no password) and links the GitHub account; the next one finds it', async () => {
    const first = await users.linkGithubAccount(identity);
    expect(first).toMatchObject({ email: 'octo@test.invalid', name: 'Octo Cat', role: 'intern' });
    const again = await users.linkGithubAccount({ ...identity, name: 'Renamed on GitHub' });
    expect(again.id).toBe(first.id);
    const [link] = await sql`select provider, provider_account_id from public.accounts where user_id = ${first.id}`;
    expect(link).toEqual({ provider: 'github', provider_account_id: '9000001' });
  });

  it('refuses a GitHub account whose email belongs to a password account (no takeover by email)', async () => {
    await expect(users.linkGithubAccount({ ...identity, providerAccountId: '9000002', email: 'hasher@test.invalid' })).rejects.toBeInstanceOf(DbError);
  });

  it('uses the GitHub no-reply address when GitHub hides the email', async () => {
    const user = await users.linkGithubAccount({ ...identity, providerAccountId: '9000003', email: null, login: 'shy' });
    expect(user.email).toBe('9000003+shy@users.noreply.github.com');
    await sql`delete from public.users where id = ${user.id}`;
  });
});

describe('the session token (NextAuth callbacks)', () => {
  const jwt = config.callbacks.jwt;

  it('on sign-in, the token gets our user id and role', async () => {
    const token = await jwt({ token: {}, user: { id: people.mentor.id, role: 'mentor', name: 'Test Mentor' }, account: null, trigger: 'signIn' });
    expect(token).toMatchObject({ uid: people.mentor.id, role: 'mentor', name: 'Test Mentor' });
  });

  it("on update, the role is re-read from the database (after redeeming a mentor code)", async () => {
    await sql`update public.users set role = 'mentor' where id = ${people.two.id}`;
    const token = await jwt({ token: { uid: people.two.id, role: 'intern' }, user: { id: people.two.id }, account: null, trigger: 'update' });
    expect(token.role).toBe('mentor');
    await sql`update public.users set role = 'intern' where id = ${people.two.id}`;
  });
  // the session callback itself is checked end to end: e2e/auth.spec.ts reads the real /api/auth/session
});

describe('POST /api/mentor (the invite code)', () => {
  const post = async (body: unknown) => json(await mentor.POST(request('POST', '/api/mentor', body)));
  const original = process.env.MENTOR_INVITE_CODE;
  beforeAll(() => {
    process.env.MENTOR_INVITE_CODE = 'guild-secret-42';
  });
  afterAll(() => {
    process.env.MENTOR_INVITE_CODE = original;
  });

  it('401 signed out, 400 with no code, 403 with a wrong one', async () => {
    signIn(null);
    expect((await post({ code: 'guild-secret-42' })).status).toBe(401);
    signIn(people.one);
    expect((await post({})).status).toBe(400);
    expect((await post({ code: 'guild-secret-41' })).status).toBe(403);
    expect((await post({ code: 'guild-secret-42-and-more' })).status).toBe(403);
  });

  it('200 with the right code, and the role changes in the database', async () => {
    signIn(people.one);
    expect(await post({ code: 'guild-secret-42' })).toEqual({ status: 200, body: { role: 'mentor' } });
    const [row] = await sql<{ role: string }[]>`select role::text from public.users where id = ${people.one.id}`;
    expect(row?.role).toBe('mentor');
  });

  it('no code configured means nobody can become a mentor', async () => {
    process.env.MENTOR_INVITE_CODE = '';
    signIn(people.two);
    expect((await post({ code: '' })).status).toBe(400);
    expect(users.inviteCodeMatches('', '')).toBe(false);
    expect(users.inviteCodeMatches('anything', undefined)).toBe(false);
    process.env.MENTOR_INVITE_CODE = 'guild-secret-42';
  });
});
