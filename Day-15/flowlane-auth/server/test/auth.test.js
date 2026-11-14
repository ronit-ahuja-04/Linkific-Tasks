import bcrypt from 'bcryptjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GOOD_PASSWORD, XRW, bearer, login, makeApp, outbox, rawRefreshCookie, refresh, refreshCookie, register, tokenFromLink, uniqueEmail } from './helpers.js';

afterEach(() => vi.restoreAllMocks());

describe('register', () => {
  it('creates a user, returns an auth result and sets a session cookie', async () => {
    const { api } = makeApp();
    const { res, payload } = await register(api, { email: 'New.User@Example.com' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Test User', email: 'new.user@example.com', role: 'member', emailVerified: false, provider: 'password', avatarUrl: null });
    expect(res.body.expiresIn).toBe(900);
    expect(typeof res.body.accessToken).toBe('string');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect(JSON.stringify(res.body)).not.toContain(payload.password);
  });
  it('writes a verification email to the outbox', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const [m] = await outbox(api);
    expect(m.to).toBe(payload.email);
    expect(m.link).toMatch(/^http:\/\/localhost:5173\/verify-email\?token=/);
  });
  it('rejects duplicate emails case-insensitively with 409', async () => {
    const { api } = makeApp();
    await register(api, { email: 'dup@example.com' });
    const { res } = await register(api, { email: 'DUP@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('email_taken');
  });
  it('returns field errors for bad input', async () => {
    const { api } = makeApp();
    const res = await api.post('/api/auth/register').send({ name: 'A', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_failed');
    expect(Object.keys(res.body.error.fields).sort()).toEqual(['email', 'name', 'password']);
  });
  it.each(['password1', 'Password1', '12345678', 'qwerty123'])('rejects the common password %s', async (password) => {
    const { api } = makeApp();
    const { res } = await register(api, { password });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toBeTruthy();
  });
  it('handles malformed JSON and oversized bodies with the error shape', async () => {
    const { api } = makeApp();
    const bad = await api.post('/api/auth/register').set('Content-Type', 'application/json').send('{oops');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('validation_failed');
    const big = await api.post('/api/auth/register').send({ name: 'x'.repeat(20_000) });
    expect(big.status).toBe(400);
    expect(big.body.error).toBeTruthy();
  });
  it('stores a bcrypt hash, never the password', async () => {
    const { api, store } = makeApp();
    const { payload } = await register(api);
    const u = store.users.all()[0];
    expect(u.passwordHash).toMatch(/^\$2[aby]\$04\$/);
    expect(JSON.stringify(store.users.all())).not.toContain(payload.password);
  });
});

describe('login', () => {
  it('logs in with a case-insensitive email', async () => {
    const { api } = makeApp();
    const { payload } = await register(api, { email: 'mixed@example.com' });
    const { res } = await login(api, 'MIXED@example.com', payload.password);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('mixed@example.com');
  });
  it('gives the identical 401 for unknown email and wrong password', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const wrong = await login(api, payload.email, 'Wrong-Pass-1');
    const unknown = await login(api, 'ghost@example.com', 'Wrong-Pass-1');
    expect(wrong.res.status).toBe(401);
    expect(unknown.res.status).toBe(401);
    expect(wrong.res.body).toEqual(unknown.res.body);
    expect(wrong.res.body.error.code).toBe('invalid_credentials');
    expect(rawRefreshCookie(wrong.res)).toBeUndefined();
  });
  it('runs a bcrypt compare for unknown emails too (timing defence)', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const spy = vi.spyOn(bcrypt, 'compare');
    await login(api, payload.email, 'Wrong-Pass-1');
    expect(spy).toHaveBeenCalledTimes(1);
    await login(api, 'ghost@example.com', 'Wrong-Pass-1');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][1]).toMatch(/^\$2[aby]\$04\$/); // compared against a real (dummy) hash
  });
  it('validates required fields', async () => {
    const { api } = makeApp();
    const res = await api.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('email');
    expect(res.body.error.fields).toHaveProperty('password');
  });
  it('rate limits failed logins with 429 rate_limited', async () => {
    const { api } = makeApp({ config: { rateLimit: { loginMax: 3, loginWindowMs: 60_000 } } });
    for (let i = 0; i < 3; i++) expect((await login(api, 'x@example.com', 'Wrong-Pass-1')).res.status).toBe(401);
    const res = await login(api, 'x@example.com', 'Wrong-Pass-1');
    expect(res.res.status).toBe(429);
    expect(res.res.body.error.code).toBe('rate_limited');
  });
  it('does not count successful logins against the limit', async () => {
    const { api } = makeApp({ config: { rateLimit: { loginMax: 2, loginWindowMs: 60_000 } } });
    const { payload } = await register(api);
    for (let i = 0; i < 5; i++) expect((await login(api, payload.email, payload.password)).res.status).toBe(200);
  });
  it('cannot log in with a password to a GitHub-only account', async () => {
    const { api, store } = makeApp();
    store.users.insert({ email: 'gh@example.com', name: 'GH', passwordHash: null, role: 'member', provider: 'github', emailVerified: true, createdAt: '' });
    expect((await login(api, 'gh@example.com', GOOD_PASSWORD)).res.status).toBe(401);
  });
});

describe('refresh cookie flags', () => {
  it('is HttpOnly, SameSite=Strict, Path=/api/auth, with no Max-Age when remember is false', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const { res } = await login(api, payload.email, payload.password, false);
    const raw = rawRefreshCookie(res);
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Strict/i);
    expect(raw).toMatch(/Path=\/api\/auth/);
    expect(raw).not.toMatch(/Max-Age/i);
    expect(raw).not.toMatch(/Expires/i);
    expect(raw).not.toMatch(/Secure/i);
  });
  it('has Max-Age of 30 days when remember is true', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const { res } = await login(api, payload.email, payload.password, true);
    expect(rawRefreshCookie(res)).toMatch(/Max-Age=2592000/);
  });
  it('is Secure only in production', async () => {
    const { api } = makeApp({ config: { isProd: true, nodeEnv: 'production' } });
    const r = await api.post('/api/auth/register').send({ name: 'Prod User', email: uniqueEmail(), password: GOOD_PASSWORD });
    expect(rawRefreshCookie(r)).toMatch(/Secure/i);
  });
  it('rotation keeps the remember choice', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const { cookie } = await login(api, payload.email, payload.password, true);
    const res = await refresh(api, cookie);
    expect(rawRefreshCookie(res)).toMatch(/Max-Age=2592000/);
    const { cookie: c2 } = await login(api, payload.email, payload.password, false);
    expect(rawRefreshCookie(await refresh(api, c2))).not.toMatch(/Max-Age/i);
  });
});

describe('refresh rotation and reuse detection', () => {
  it('issues a new access token and a different refresh token', async () => {
    const { api } = makeApp();
    const { cookie, user } = await register(api);
    const res = await refresh(api, cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(refreshCookie(res)).toBeTruthy();
    expect(refreshCookie(res)).not.toBe(cookie);
    const me = await api.get('/api/auth/me').set(bearer(res.body.accessToken));
    expect(me.status).toBe(200);
  });
  it('reusing a rotated token revokes the family: 401 refresh_invalid, and the newer token dies too', async () => {
    const { api } = makeApp();
    const { cookie: first } = await register(api);
    const second = refreshCookie(await refresh(api, first));
    const replay = await refresh(api, first); // attacker replays the old token
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('refresh_invalid');
    const legit = await refresh(api, second); // the legitimate holder is cut off as well
    expect(legit.status).toBe(401);
    expect(legit.body.error.code).toBe('refresh_invalid');
  });
  it('also kills the access token of the revoked family', async () => {
    const { api } = makeApp();
    const { cookie: first } = await register(api);
    const r = await refresh(api, first);
    await refresh(api, first);
    const me = await api.get('/api/auth/me').set(bearer(r.body.accessToken));
    expect(me.status).toBe(401);
  });
  it('does not affect other sessions of the same user', async () => {
    const { api } = makeApp();
    const { payload, cookie: a } = await register(api);
    const { cookie: b } = await login(api, payload.email, payload.password);
    const a2 = refreshCookie(await refresh(api, a));
    await refresh(api, a); // reuse on family A
    expect(a2).toBeTruthy();
    expect((await refresh(api, b)).status).toBe(200);
  });
  it('clears the cookie on failure and rejects a missing or unknown cookie', async () => {
    const { api } = makeApp();
    const none = await api.post('/api/auth/refresh').set(XRW);
    expect(none.status).toBe(401);
    expect(none.body.error.code).toBe('refresh_invalid');
    expect(rawRefreshCookie(none)).toMatch(/fl_refresh=;/);
    expect((await refresh(api, 'not-a-real-token')).status).toBe(401);
  });
  it('rejects an expired session cookie (injected clock, 24h for non-remember)', async () => {
    const { api, clock } = makeApp();
    const { cookie } = await register(api);
    clock.advance(24 * 3600 * 1000 + 1000);
    const res = await refresh(api, cookie);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('refresh_invalid');
  });
  it('remember-me sessions outlive 24h but not 30 days', async () => {
    const { api, clock } = makeApp();
    const { payload } = await register(api);
    const { cookie } = await login(api, payload.email, payload.password, true);
    clock.advance(25 * 3600 * 1000);
    const ok = await refresh(api, cookie);
    expect(ok.status).toBe(200);
    clock.advance(31 * 24 * 3600 * 1000);
    expect((await refresh(api, refreshCookie(ok))).status).toBe(401);
  });
  it('rejects a refresh cookie whose session was revoked by logout', async () => {
    const { api } = makeApp();
    const { cookie } = await register(api);
    await api.post('/api/auth/logout').set(XRW).set('Cookie', `fl_refresh=${cookie}`);
    expect((await refresh(api, cookie)).status).toBe(401);
  });
});

describe('csrf protection on cookie endpoints', () => {
  it.each(['/api/auth/refresh', '/api/auth/logout'])('%s needs X-Requested-With', async (url) => {
    const { api } = makeApp();
    const { cookie } = await register(api);
    const res = await api.post(url).set('Cookie', `fl_refresh=${cookie}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('csrf_blocked');
  });
  it.each(['/api/auth/refresh', '/api/auth/logout'])('%s blocks a foreign Origin', async (url) => {
    const { api } = makeApp();
    const { cookie } = await register(api);
    const res = await api.post(url).set(XRW).set('Origin', 'https://evil.example').set('Cookie', `fl_refresh=${cookie}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('csrf_blocked');
  });
  it('a blocked logout does not revoke anything', async () => {
    const { api } = makeApp();
    const { cookie } = await register(api);
    await api.post('/api/auth/logout').set('Origin', 'https://evil.example').set(XRW).set('Cookie', `fl_refresh=${cookie}`);
    expect((await refresh(api, cookie)).status).toBe(200);
  });
  it('allows the client origin', async () => {
    const { api } = makeApp();
    const { cookie } = await register(api);
    expect((await refresh(api, cookie, { ...XRW, Origin: 'http://localhost:5173' })).status).toBe(200);
  });
  it('accepts a same-origin Origin header (the request own origin)', async () => {
    const { api } = makeApp();
    const { cookie } = await register(api);
    const res = await refresh(api, cookie, { ...XRW, Host: 'api.test', Origin: 'http://api.test' });
    expect(res.status).toBe(200);
  });
});

describe('logout', () => {
  it('returns 204, clears the cookie, and kills the access token', async () => {
    const { api } = makeApp();
    const { cookie, token } = await register(api);
    const res = await api.post('/api/auth/logout').set(XRW).set('Cookie', `fl_refresh=${cookie}`);
    expect(res.status).toBe(204);
    expect(rawRefreshCookie(res)).toMatch(/fl_refresh=;/);
    expect((await api.get('/api/auth/me').set(bearer(token))).status).toBe(401);
  });
  it('is 204 even without a cookie', async () => {
    const { api } = makeApp();
    expect((await api.post('/api/auth/logout').set(XRW)).status).toBe(204);
  });
});

describe('access token handling', () => {
  it('requires a bearer token', async () => {
    const { api } = makeApp();
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });
  it('returns token_expired after the access TTL (injected clock)', async () => {
    const { api, clock } = makeApp();
    const { token } = await register(api);
    expect((await api.get('/api/auth/me').set(bearer(token))).status).toBe(200);
    clock.advance(901 * 1000);
    const res = await api.get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('token_expired');
  });
  it('returns unauthorized for garbage and tampered tokens', async () => {
    const { api } = makeApp();
    const { token } = await register(api);
    const [h, p, s] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url')), role: 'admin' })).toString('base64url');
    for (const bad of ['garbage', `${h}.${tamperedPayload}.${s}`, `${h}.${p}.${s.slice(0, -2)}xx`]) {
      const res = await api.get('/api/auth/me').set(bearer(bad));
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('unauthorized');
    }
  });
  it('rejects Authorization headers that are not Bearer', async () => {
    const { api } = makeApp();
    const { token } = await register(api);
    expect((await api.get('/api/auth/me').set('Authorization', `Basic ${token}`)).status).toBe(401);
  });
  it('/me returns the user without secrets', async () => {
    const { api } = makeApp();
    const { token, payload } = await register(api);
    const res = await api.get('/api/auth/me').set(bearer(token));
    expect(res.body.user.email).toBe(payload.email);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|tokenHash/);
  });
});

describe('forgot and reset password', () => {
  it('responds identically for known and unknown emails', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const known = await api.post('/api/auth/forgot-password').send({ email: payload.email });
    const unknown = await api.post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(known.body).toEqual(unknown.body);
    const mails = await outbox(api);
    expect(mails.filter((m) => m.subject.includes('Reset'))).toHaveLength(1);
  });
  it('rate limits forgot-password', async () => {
    const { api } = makeApp({ config: { rateLimit: { forgotMax: 2, forgotWindowMs: 60_000 } } });
    await api.post('/api/auth/forgot-password').send({ email: 'a@example.com' });
    await api.post('/api/auth/forgot-password').send({ email: 'a@example.com' });
    const res = await api.post('/api/auth/forgot-password').send({ email: 'a@example.com' });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('rate_limited');
  });
  async function requestReset(api, email) {
    await api.post('/api/auth/forgot-password').send({ email });
    const mails = await outbox(api);
    const m = mails.filter((x) => x.subject.includes('Reset')).at(-1);
    expect(m.link).toMatch(/\/reset-password\?token=/);
    return tokenFromLink(m.link);
  }
  it('sets a new password, is single use, and revokes all sessions', async () => {
    const { api } = makeApp();
    const { payload, cookie, token } = await register(api);
    const { cookie: other } = await login(api, payload.email, payload.password);
    const resetToken = await requestReset(api, payload.email);
    const ok = await api.post('/api/auth/reset-password').send({ token: resetToken, password: 'Brand-New-Pass-7' });
    expect(ok.status).toBe(200);
    expect((await refresh(api, cookie)).status).toBe(401);
    expect((await refresh(api, other)).status).toBe(401);
    expect((await api.get('/api/auth/me').set(bearer(token))).status).toBe(401);
    expect((await login(api, payload.email, payload.password)).res.status).toBe(401);
    expect((await login(api, payload.email, 'Brand-New-Pass-7')).res.status).toBe(200);
    const again = await api.post('/api/auth/reset-password').send({ token: resetToken, password: 'Another-Pass-8' });
    expect(again.status).toBe(400);
    expect(again.body.error.fields.token).toBeTruthy();
  });
  it('expires after 30 minutes (injected clock)', async () => {
    const { api, clock } = makeApp();
    const { payload } = await register(api);
    const t = await requestReset(api, payload.email);
    clock.advance(30 * 60 * 1000 + 1000);
    const res = await api.post('/api/auth/reset-password').send({ token: t, password: 'Brand-New-Pass-7' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.token).toBeTruthy();
  });
  it('is still valid just before 30 minutes', async () => {
    const { api, clock } = makeApp();
    const { payload } = await register(api);
    const t = await requestReset(api, payload.email);
    clock.advance(29 * 60 * 1000);
    expect((await api.post('/api/auth/reset-password').send({ token: t, password: 'Brand-New-Pass-7' })).status).toBe(200);
  });
  it('rejects unknown tokens and weak passwords without consuming the token', async () => {
    const { api } = makeApp();
    const { payload } = await register(api);
    const t = await requestReset(api, payload.email);
    const bad = await api.post('/api/auth/reset-password').send({ token: 'nope', password: 'Brand-New-Pass-7' });
    expect(bad.body.error.fields.token).toBeTruthy();
    const weak = await api.post('/api/auth/reset-password').send({ token: t, password: 'password1' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.fields.password).toBeTruthy();
    expect((await api.post('/api/auth/reset-password').send({ token: t, password: 'Brand-New-Pass-7' })).status).toBe(200);
  });
  it('stores only the hash of the reset token', async () => {
    const { api, store } = makeApp();
    const { payload } = await register(api);
    const t = await requestReset(api, payload.email);
    expect(JSON.stringify(store.resetTokens.all())).not.toContain(t);
  });
});

describe('email verification', () => {
  it('verifies once, then the token is dead', async () => {
    const { api, store } = makeApp();
    const { token } = await register(api);
    const link = (await outbox(api))[0].link;
    const vt = tokenFromLink(link);
    const res = await api.post('/api/auth/verify-email').send({ token: vt });
    expect(res.status).toBe(200);
    expect(res.body.user.emailVerified).toBe(true);
    expect(store.users.all()[0].emailVerified).toBe(true);
    const again = await api.post('/api/auth/verify-email').send({ token: vt });
    expect(again.status).toBe(400);
    expect(again.body.error.fields.token).toBeTruthy();
    expect(token).toBeTruthy();
  });
  it('rejects bad and expired tokens (24h)', async () => {
    const { api, clock } = makeApp();
    await register(api);
    expect((await api.post('/api/auth/verify-email').send({ token: 'bad' })).status).toBe(400);
    const vt = tokenFromLink((await outbox(api))[0].link);
    clock.advance(24 * 3600 * 1000 + 1000);
    expect((await api.post('/api/auth/verify-email').send({ token: vt })).status).toBe(400);
  });
  it('resend-verification writes another email, or 200 when already verified', async () => {
    const { api } = makeApp();
    const { token } = await register(api);
    expect((await api.post('/api/auth/resend-verification').set(bearer(token))).status).toBe(202);
    const mails = await outbox(api);
    expect(mails).toHaveLength(2);
    await api.post('/api/auth/verify-email').send({ token: tokenFromLink(mails[1].link) });
    const res = await api.post('/api/auth/resend-verification').set(bearer(token));
    expect(res.status).toBe(200);
    expect(await outbox(api)).toHaveLength(2);
  });
  it('resend-verification requires auth', async () => {
    const { api } = makeApp();
    expect((await api.post('/api/auth/resend-verification')).status).toBe(401);
  });
});

describe('sessions list', () => {
  it('lists active sessions, marks the current one and revokes a chosen one', async () => {
    const { api } = makeApp();
    const { payload, token } = await register(api);
    const second = await login(api, payload.email, payload.password, true);
    const list = await api.get('/api/auth/sessions').set(bearer(token));
    expect(list.body.sessions).toHaveLength(2);
    const current = list.body.sessions.filter((s) => s.current);
    expect(current).toHaveLength(1);
    expect(Object.keys(list.body.sessions[0]).sort()).toEqual(['createdAt', 'current', 'id', 'lastUsedAt', 'remember', 'userAgent']);
    const other = list.body.sessions.find((s) => !s.current);
    expect(other.remember).toBe(true);
    expect((await api.delete(`/api/auth/sessions/${other.id}`).set(bearer(token))).status).toBe(204);
    expect((await refresh(api, second.cookie)).status).toBe(401);
    expect((await api.get('/api/auth/sessions').set(bearer(token))).body.sessions).toHaveLength(1);
  });
  it("cannot revoke someone else's session (404)", async () => {
    const { api } = makeApp();
    const a = await register(api);
    const b = await register(api);
    const bSessions = (await api.get('/api/auth/sessions').set(bearer(b.token))).body.sessions;
    const res = await api.delete(`/api/auth/sessions/${bSessions[0].id}`).set(bearer(a.token));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
    expect((await refresh(api, b.cookie)).status).toBe(200);
  });
});

describe('misc server behaviour', () => {
  it('sets security headers and no-store', async () => {
    const { api } = makeApp();
    const res = await api.get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['cache-control']).toBe('no-store');
  });
  it('allows CORS only for the client origin, with credentials', async () => {
    const { api } = makeApp();
    const ok = await api.get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const evil = await api.get('/api/health').set('Origin', 'https://evil.example');
    expect(evil.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(evil.headers['access-control-allow-origin']).not.toBe('https://evil.example');
  });
  it('answers unknown routes in the contract shape', async () => {
    const { api } = makeApp();
    const res = await api.get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
  it('providers reflects the configured provider', async () => {
    const { api } = makeApp({ config: { oauthFake: false } });
    expect((await api.get('/api/auth/providers')).body).toEqual({ github: { enabled: false } });
    const on = makeApp({ config: { oauthFake: true } });
    expect((await on.api.get('/api/auth/providers')).body).toEqual({ github: { enabled: true } });
  });
  it('never writes passwords or tokens to the console', async () => {
    const spies = ['log', 'info', 'warn', 'error'].map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const { api } = makeApp({ config: { silent: false } });
    const { payload, token, cookie } = await register(api);
    await login(api, payload.email, 'Wrong-Pass-1');
    await api.get('/api/nope');
    const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls));
    expect(logged).toContain('POST /api/auth/register 201');
    for (const secret of [payload.password, 'Wrong-Pass-1', token, cookie]) expect(logged).not.toContain(secret);
  });
});
