import { describe, expect, it, vi } from 'vitest';
import { CLIENT, login, makeApp, rawRefreshCookie, refresh, refreshCookie, register, setCookies } from './helpers.js';
import { createGithubProvider } from '../src/oauth/github.js';

const stateCookie = (res) => setCookies(res).find((c) => c.startsWith('fl_oauth_state='));

async function start(api) {
  const res = await api.get('/api/auth/github');
  const location = res.headers.location;
  const state = new URL(location, 'http://x').searchParams.get('state');
  return { res, location, state };
}
const cb = (api, query, cookie) => {
  const r = api.get('/api/auth/github/callback').query(query);
  return cookie ? r.set('Cookie', cookie) : r;
};

describe('GitHub OAuth with the fake provider', () => {
  it('redirects to the fake authorize URL with a state and a Lax HttpOnly state cookie', async () => {
    const { api } = makeApp();
    const { res, location, state } = await start(api);
    expect(res.status).toBe(302);
    expect(location).toMatch(/^\/api\/dev\/fake-github\?state=/);
    expect(state.length).toBeGreaterThan(20);
    const c = stateCookie(res);
    expect(c).toContain(`fl_oauth_state=${state}`);
    expect(c).toMatch(/HttpOnly/i);
    expect(c).toMatch(/SameSite=Lax/i);
    expect(c).toMatch(/Max-Age=600/);
  });
  it('happy path creates a user, sets the cookie and redirects to the client callback (no token in URL)', async () => {
    const { api, store } = makeApp();
    const { state } = await start(api);
    const fake = await api.get(`/api/dev/fake-github?state=${state}`);
    expect(fake.status).toBe(302);
    expect(fake.headers.location).toBe(`/api/auth/github/callback?code=fake-code&state=${state}`);
    const res = await cb(api, { code: 'fake-code', state }, `fl_oauth_state=${state}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${CLIENT}/oauth/callback`);
    expect(res.headers.location).not.toMatch(/token|code|state/i);
    const raw = rawRefreshCookie(res);
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).not.toMatch(/Max-Age/i);
    expect(stateCookie(res)).toMatch(/fl_oauth_state=;/);
    expect(store.users.all()).toHaveLength(1);
    expect(store.users.all()[0]).toMatchObject({ provider: 'github', emailVerified: true, email: 'octocat@example.com', name: 'The Octocat' });
    // the cookie works for the client's follow-up refresh
    const r = await refresh(api, refreshCookie(res));
    expect(r.status).toBe(200);
    expect(r.body.user).toMatchObject({ provider: 'github', emailVerified: true });
  });
  it.each([
    ['wrong state', 'abc', 'fl_oauth_state=different'],
    ['missing cookie', 'abc', null],
  ])('%s redirects to /login?error=oauth_failed and creates nothing', async (_n, state, cookie) => {
    const { api, store } = makeApp();
    const res = await cb(api, { code: 'fake-code', state }, cookie);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${CLIENT}/login?error=oauth_failed`);
    expect(rawRefreshCookie(res)).toBeUndefined();
    expect(store.users.all()).toHaveLength(0);
  });
  it('missing state or code, or a bad code, fails the same way', async () => {
    const { api, store } = makeApp();
    for (const [q, c] of [[{ code: 'fake-code' }, 'fl_oauth_state=abc'], [{ state: 'abc' }, 'fl_oauth_state=abc'], [{ code: 'bad', state: 'abc' }, 'fl_oauth_state=abc'], [{ error: 'access_denied', state: 'abc' }, 'fl_oauth_state=abc']]) {
      const res = await cb(api, q, c);
      expect(res.headers.location).toBe(`${CLIENT}/login?error=oauth_failed`);
    }
    expect(store.users.all()).toHaveLength(0);
  });
  it('repeat login does not create a second user', async () => {
    const { api, store } = makeApp();
    for (let i = 0; i < 2; i++) {
      const { state } = await start(api);
      const res = await cb(api, { code: 'fake-code', state }, `fl_oauth_state=${state}`);
      expect(res.headers.location).toBe(`${CLIENT}/oauth/callback`);
    }
    expect(store.users.all()).toHaveLength(1);
    expect(store.sessions.all()).toHaveLength(2);
  });
  it('links an existing verified password account with the same email', async () => {
    const { api, store } = makeApp();
    const { payload, user } = await register(api, { email: 'octocat@example.com' });
    store.users.update(user.id, { emailVerified: true });
    const { state } = await start(api);
    const res = await cb(api, { code: 'fake-code', state }, `fl_oauth_state=${state}`);
    expect(res.headers.location).toBe(`${CLIENT}/oauth/callback`);
    expect(store.users.all()).toHaveLength(1);
    expect(store.users.all()[0].githubId).toBe('fake-1001');
    expect((await login(api, payload.email, payload.password)).res.status).toBe(200); // password still works
  });
  it('linking an UNVERIFIED password account drops its password (pre-hijack defence)', async () => {
    const { api, store } = makeApp();
    const { payload, cookie } = await register(api, { email: 'octocat@example.com' });
    const { state } = await start(api);
    await cb(api, { code: 'fake-code', state }, `fl_oauth_state=${state}`);
    expect(store.users.all()).toHaveLength(1);
    expect(store.users.all()[0].emailVerified).toBe(true);
    expect((await login(api, payload.email, payload.password)).res.status).toBe(401);
    expect((await refresh(api, cookie)).status).toBe(401);
  });
  it('fails when GitHub gives no verified email', async () => {
    const provider = { enabled: true, authorizeUrl: (s) => `/x?state=${s}`, exchange: async () => ({ id: '9', login: 'x', name: 'X', email: null, emailVerified: false }) };
    const { api, store } = makeApp({ githubProvider: provider });
    const { state } = await start(api);
    const res = await cb(api, { code: 'c', state }, `fl_oauth_state=${state}`);
    expect(res.headers.location).toBe(`${CLIENT}/login?error=oauth_failed`);
    expect(store.users.all()).toHaveLength(0);
  });
  it('returns 501 oauth_not_configured when disabled', async () => {
    const { api } = makeApp({ config: { oauthFake: false } });
    const res = await api.get('/api/auth/github');
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('oauth_not_configured');
  });
  it('the fake-github route 404s when OAUTH_FAKE is off', async () => {
    const { api } = makeApp({ config: { oauthFake: false } });
    expect((await api.get('/api/dev/fake-github?state=x')).status).toBe(404);
  });
});

describe('real GitHub provider (fetch mocked)', () => {
  const cfg = { clientId: 'cid', clientSecret: 'secret', callbackUrl: 'http://localhost:5173/api/auth/github/callback' };
  it('is disabled without credentials', () => {
    expect(createGithubProvider({ ...cfg, clientId: '' }).enabled).toBe(false);
  });
  it('builds the authorize URL with scope and state', () => {
    const u = new URL(createGithubProvider(cfg).authorizeUrl('st8'));
    expect(u.origin + u.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(u.searchParams.get('scope')).toBe('read:user user:email');
    expect(u.searchParams.get('state')).toBe('st8');
    expect(u.searchParams.get('client_id')).toBe('cid');
    expect(u.searchParams.get('redirect_uri')).toBe(cfg.callbackUrl);
  });
  it('exchanges the code and picks the primary verified email', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      calls.push([String(url), init]);
      const body = String(url).includes('access_token')
        ? { access_token: 'gho_x' }
        : String(url).endsWith('/user/emails')
          ? [{ email: 'a@x.io', primary: false, verified: true }, { email: 'p@x.io', primary: true, verified: false }, { email: 'main@x.io', primary: true, verified: true }]
          : { id: 77, login: 'octo', name: null, avatar_url: 'http://a/v.png' };
      return { ok: true, status: 200, json: async () => body };
    }));
    try {
      const profile = await createGithubProvider(cfg).exchange('the-code');
      expect(profile).toEqual({ id: '77', login: 'octo', name: 'octo', email: 'main@x.io', emailVerified: true, avatarUrl: 'http://a/v.png' });
      expect(calls[0][0]).toBe('https://github.com/login/oauth/access_token');
      expect(calls[0][1].headers.Accept).toBe('application/json');
      expect(calls[1][1].headers.Authorization).toBe('Bearer gho_x');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('throws when GitHub errors and when there is no access token', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ error: 'bad_verification_code' }) })));
    await expect(createGithubProvider(cfg).exchange('x')).rejects.toThrow(/access token/);
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await expect(createGithubProvider(cfg).exchange('x')).rejects.toThrow(/500/);
    vi.unstubAllGlobals();
  });
});

describe('dev routes', () => {
  it('404 unless ENABLE_DEV_OUTBOX', async () => {
    const { api } = makeApp({ config: { enableDevOutbox: false } });
    expect((await api.get('/api/dev/outbox')).status).toBe(404);
    expect((await api.delete('/api/dev/outbox')).status).toBe(404);
  });
  it('lists and clears the outbox when enabled', async () => {
    const { api } = makeApp();
    await register(api);
    const list = await api.get('/api/dev/outbox');
    expect(list.status).toBe(200);
    expect(Object.keys(list.body.messages[0]).sort()).toEqual(['createdAt', 'id', 'link', 'subject', 'text', 'to']);
    expect((await api.delete('/api/dev/outbox')).status).toBe(204);
    expect((await api.get('/api/dev/outbox')).body.messages).toEqual([]);
  });
});
