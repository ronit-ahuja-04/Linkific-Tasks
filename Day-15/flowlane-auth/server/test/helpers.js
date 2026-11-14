import request from 'supertest';
import { createApp } from '../src/app.js';
import { createStore } from '../src/store.js';

export const CLIENT = 'http://localhost:5173';
export const XRW = { 'X-Requested-With': 'fetch' };
export const GOOD_PASSWORD = 'Sup3r-Secret-9';

// Fresh app + in-memory store + controllable clock for every test.
export function makeApp({ config = {}, githubProvider } = {}) {
  let t = Date.UTC(2026, 0, 1, 12, 0, 0);
  const clock = {
    now: () => t,
    advance: (ms) => { t += ms; },
  };
  const store = createStore({ dbFile: ':memory:' });
  const app = createApp({
    config: {
      bcryptCost: 4,
      silent: true,
      enableDevOutbox: true,
      oauthFake: true,
      clientUrl: CLIENT,
      jwtSecret: 'test-secret-test-secret-test-secret',
      rateLimit: { loginMax: 1000, loginWindowMs: 60_000, forgotMax: 1000, forgotWindowMs: 60_000 },
      ...config,
    },
    store,
    githubProvider,
    now: clock.now,
  });
  return { app, store, clock, api: request(app) };
}

let counter = 0;
export const uniqueEmail = () => `user${++counter}@example.com`;

export async function register(api, over = {}) {
  const payload = { name: 'Test User', email: uniqueEmail(), password: GOOD_PASSWORD, ...over };
  const res = await api.post('/api/auth/register').send(payload);
  return { res, payload, token: res.body.accessToken, cookie: refreshCookie(res), user: res.body.user };
}

export async function login(api, email, password, remember) {
  const res = await api.post('/api/auth/login').send({ email, password, remember });
  return { res, token: res.body.accessToken, cookie: refreshCookie(res) };
}

export const setCookies = (res) => [].concat(res.headers['set-cookie'] || []);
export const rawRefreshCookie = (res) => setCookies(res).find((c) => c.startsWith('fl_refresh='));
export function refreshCookie(res) {
  const raw = rawRefreshCookie(res);
  return raw ? raw.split(';')[0].split('=')[1] : null;
}
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export const refresh = (api, cookie, headers = XRW) =>
  api.post('/api/auth/refresh').set(headers).set('Cookie', `fl_refresh=${cookie}`);

export async function outbox(api) {
  return (await api.get('/api/dev/outbox')).body.messages;
}
export const tokenFromLink = (link) => new URL(link).searchParams.get('token');
