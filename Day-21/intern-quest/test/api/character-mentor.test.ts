import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createPeople, json, params, people, quest, record, removePeople, request, sql } from './fixtures';

vi.mock('@/lib/server/session', () => ({ currentUser: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
const { currentUser } = await import('@/lib/server/session');
const character = await import('@/app/api/character/route');
const quests = await import('@/app/api/quests/route');
const notes = await import('@/app/api/quests/[id]/notes/route');
const badges = await import('@/app/api/badges/route');
const badge = await import('@/app/api/badges/[id]/route');

const signIn = (user: (typeof people)[keyof typeof people] | null) => vi.mocked(currentUser).mockResolvedValue(user);

beforeAll(createPeople);
afterAll(async () => {
  await removePeople();
  await sql.end();
});

describe('/api/character', () => {
  const put = async (body: unknown) => json(await character.PUT(request('PUT', '/api/character', body)));
  const good = { handle: 'newbie-hero', displayName: 'Newbie', class: 'design_bard', bio: 'Just arrived.' };

  it('401 signed out; 404 before a character exists', async () => {
    signIn(null);
    expect((await json(await character.GET())).status).toBe(401);
    signIn(people.newbie);
    expect((await json(await character.GET())).status).toBe(404);
  });

  it('PUT creates (201), then updates (200); GET returns it without the internal user id', async () => {
    signIn(people.newbie);
    expect((await put(good)).status).toBe(201);
    const { status, body } = await put({ ...good, bio: 'Settling in.', avatar: { hair: 3 } });
    expect(status).toBe(200);
    expect(record(body).character).toMatchObject({ handle: 'newbie-hero', bio: 'Settling in.', avatar: { skin: 0, hair: 3, colour: 0, accessory: 0 } });
    const read = record((await json(await character.GET())).body).character;
    expect(read).toMatchObject({ handle: 'newbie-hero', class: 'design_bard' });
    expect(read).not.toHaveProperty('userId');
  });

  it('409 for a handle someone else has; 400 for a bad one', async () => {
    signIn(people.newbie);
    expect(record((await put({ ...good, handle: 'ronit' })).body).error).toMatch(/taken/);
    expect((await put({ ...good, handle: 'ronit' })).status).toBe(409);
    expect((await put({ ...good, handle: 'No Spaces' })).status).toBe(400);
  });
});

describe('mentor notes', () => {
  let questId = '';
  let privateId = '';
  beforeAll(async () => {
    signIn(people.one);
    const make = async (body: unknown) => {
      const id = record(record((await json(await quests.POST(request('POST', '/api/quests', body)))).body).quest).id;
      return typeof id === 'string' ? id : '';
    };
    questId = await make(quest(1));
    privateId = await make(quest(2, { isPublic: false }));
  });
  const post = async (id: string, body: unknown) => json(await notes.POST(request('POST', `/api/quests/${id}/notes`, body), params({ id })));
  const list = async (id: string) => json(await notes.GET(request('GET', `/api/quests/${id}/notes`), params({ id })));

  it('401 signed out, 403 for an intern', async () => {
    signIn(null);
    expect((await post(questId, { body: 'Hi' })).status).toBe(401);
    signIn(people.two);
    expect((await post(questId, { body: 'Hi' })).status).toBe(403);
  });

  it('a mentor can note a public quest (201) and anyone who can read the quest sees it', async () => {
    signIn(people.mentor);
    expect((await post(questId, { body: 'Strong start.' })).status).toBe(201);
    signIn(null);
    const { body } = await list(questId);
    expect(record(body).notes).toEqual([expect.objectContaining({ body: 'Strong start.', authorName: 'Test Mentor' })]);
  });

  it("a mentor can not note (or even see) a private quest: 404", async () => {
    signIn(people.mentor);
    expect((await post(privateId, { body: 'Peek' })).status).toBe(404);
    expect((await list(privateId)).status).toBe(404);
  });

  it('400 for an empty note', async () => {
    signIn(people.mentor);
    expect((await post(questId, { body: ' ' })).status).toBe(400);
  });
});

describe('mentor badges', () => {
  const award = async (body: unknown) => json(await badges.POST(request('POST', '/api/badges', body)));
  const remove = async (id: string) => json(await badge.DELETE(request('DELETE', `/api/badges/${id}`), params({ id })));

  it('401 signed out, 403 for an intern', async () => {
    signIn(null);
    expect((await award({ handle: 'tester-one', name: 'Star' })).status).toBe(401);
    signIn(people.one);
    expect((await award({ handle: 'tester-two', name: 'Star' })).status).toBe(403);
  });

  it('404 for an unknown handle', async () => {
    signIn(people.mentor);
    expect((await award({ handle: 'nobody-here', name: 'Star' })).status).toBe(404);
  });

  it('a mentor awards (201) and removes (204) a badge; an intern can not remove it', async () => {
    signIn(people.mentor);
    const { status, body } = await award({ handle: 'tester-one', name: 'Bug hunter', note: 'Found three.', icon: '🐞' });
    expect(status).toBe(201);
    const created = record(record(body).badge);
    expect(created).toMatchObject({ name: 'Bug hunter', icon: '🐞', awardedBy: people.mentor.id });
    const id = typeof created.id === 'string' ? created.id : '';
    signIn(people.one);
    expect((await remove(id)).status).toBe(403);
    signIn(people.mentor);
    expect((await remove(id)).status).toBe(204);
    expect((await remove(id)).status).toBe(404);
  });
});
