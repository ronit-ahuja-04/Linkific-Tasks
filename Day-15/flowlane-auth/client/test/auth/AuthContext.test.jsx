// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../src/api/authApi';
import * as httpModule from '../../src/api/http';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import { apiError, makeResult, makeUser } from './helpers';

vi.mock('../../src/api/authApi', () => ({ login: vi.fn(), register: vi.fn(), logout: vi.fn() }));
vi.mock('../../src/api/http', async (importOriginal) => ({ ...(await importOriginal()), refreshAccessToken: vi.fn(), setAuthFailureHandler: vi.fn((await importOriginal()).setAuthFailureHandler) }));

const NOW = new Date('2026-06-01T12:00:00Z').getTime();
let auth;

function Probe() {
  auth = useAuth();
  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="user">{auth.user?.name ?? 'none'}</p>
      <p data-testid="count">{auth.session.refreshCount}</p>
      <p data-testid="expires">{auth.session.expiresAt ?? 'none'}</p>
      <p data-testid="notice">{auth.notice ? `${auth.notice.type}|${auth.notice.message}` : 'none'}</p>
    </div>
  );
}
const text = (id) => screen.getByTestId(id).textContent;
const flush = () => act(async () => {});
const advance = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

async function mountAuthed({ strict = false, lifeSeconds = 900 } = {}) {
  httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW, lifeSeconds }));
  const tree = (
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  await flush();
  return view;
}

beforeEach(() => {
  globalThis.jest = { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) };
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  for (const fn of [httpModule.refreshAccessToken, authApi.login, authApi.register, authApi.logout]) fn.mockReset();
  httpModule.setAccessToken(null);
});
afterEach(() => {
  vi.useRealTimers();
  delete globalThis.jest;
});

describe('startup refresh', () => {
  it('is loading until the first refresh settles, then authenticated', async () => {
    let resolve;
    httpModule.refreshAccessToken.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(text('status')).toBe('loading');
    expect(auth.isAuthenticated).toBe(false);
    await act(async () => resolve(makeResult({ nowMs: NOW })));
    expect(text('status')).toBe('authenticated');
    expect(text('user')).toBe('Ada');
    expect(auth.isAuthenticated).toBe(true);
    expect(text('notice')).toBe('none');
  });
  it('becomes anonymous without a notice when the refresh fails', async () => {
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    expect(text('status')).toBe('anonymous');
    expect(text('notice')).toBe('none');
    expect(auth.user).toBeNull();
  });
  it('sends exactly one startup refresh under StrictMode', async () => {
    // the real refreshAccessToken is single-flight; emulate it with one shared promise
    const shared = Promise.resolve(makeResult({ nowMs: NOW }));
    httpModule.refreshAccessToken.mockReturnValue(shared);
    render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>);
    await flush();
    expect(text('status')).toBe('authenticated');
    // both effect runs ask; the single-flight layer turns that into one request (see http.test.js)
    expect(new Set(httpModule.refreshAccessToken.mock.results.map((r) => r.value)).size).toBe(1);
  });
  it('exposes expiresAt (ms) and claims from the token exp claim', async () => {
    await mountAuthed();
    expect(Number(text('expires'))).toBe(Math.floor(NOW / 1000) * 1000 + 900_000);
    expect(auth.session.claims).toMatchObject({ sub: 'u1', role: 'member', sid: 's1' });
    expect(text('count')).toBe('0');
  });
  it('falls back to expiresIn when the token cannot be decoded', async () => {
    httpModule.refreshAccessToken.mockResolvedValueOnce({ user: makeUser(), accessToken: 'opaque', expiresIn: 120 });
    render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    expect(Number(text('expires'))).toBe(NOW + 120_000);
    expect(auth.session.claims).toBeNull();
  });
});

describe('login, register, logout', () => {
  beforeEach(() => {
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
  });
  async function mountAnon() {
    render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
  }
  it('login signs in, stores the token in memory and returns the user', async () => {
    const result = makeResult({ nowMs: NOW });
    authApi.login.mockResolvedValueOnce(result);
    await mountAnon();
    let returned;
    await act(async () => { returned = await auth.login({ email: 'ada@example.com', password: 'pw', remember: true }); });
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'pw', remember: true });
    expect(returned).toEqual(result.user);
    expect(text('status')).toBe('authenticated');
    expect(httpModule.getAccessToken()).toBe(result.accessToken);
  });
  it('a failed login throws the ApiError and stays anonymous', async () => {
    authApi.login.mockRejectedValueOnce(apiError(401, 'invalid_credentials'));
    await mountAnon();
    let caught;
    await act(async () => { caught = await auth.login({ email: 'a', password: 'b' }).catch((e) => e); });
    expect(caught).toMatchObject({ code: 'invalid_credentials' });
    expect(text('status')).toBe('anonymous');
    expect(httpModule.getAccessToken()).toBeNull();
  });
  it('register signs in', async () => {
    authApi.register.mockResolvedValueOnce(makeResult({ nowMs: NOW, user: makeUser({ name: 'Grace' }) }));
    await mountAnon();
    await act(async () => { await auth.register({ name: 'Grace', email: 'g@example.com', password: 'pw' }); });
    expect(text('user')).toBe('Grace');
    expect(text('status')).toBe('authenticated');
  });
  it('a failed register throws', async () => {
    authApi.register.mockRejectedValueOnce(apiError(409, 'email_taken'));
    await mountAnon();
    let caught;
    await act(async () => { caught = await auth.register({}).catch((e) => e); });
    expect(caught.code).toBe('email_taken');
    expect(text('status')).toBe('anonymous');
  });
  it('login clears an old notice', async () => {
    authApi.login.mockResolvedValueOnce(makeResult({ nowMs: NOW }));
    await mountAnon();
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    await act(async () => { await auth.logout(); });
    expect(text('notice')).toContain('logged_out');
    await act(async () => { await auth.login({}); });
    expect(text('notice')).toBe('none');
  });
});

describe('logout', () => {
  it('calls the API, clears the token and ends anonymous with a notice', async () => {
    await mountAuthed();
    httpModule.setAccessToken('live');
    authApi.logout.mockResolvedValueOnce(undefined);
    await act(async () => { await auth.logout(); });
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(text('status')).toBe('anonymous');
    expect(text('user')).toBe('none');
    expect(httpModule.getAccessToken()).toBeNull();
    expect(text('notice')).toContain('logged_out');
    expect(text('expires')).toBe('none');
  });
  it('still ends anonymous when the API call fails', async () => {
    await mountAuthed();
    authApi.logout.mockRejectedValueOnce(apiError(0, 'network_error'));
    await act(async () => { await auth.logout(); });
    expect(text('status')).toBe('anonymous');
    expect(httpModule.getAccessToken()).toBeNull();
  });
  it('cancels the silent refresh timer', async () => {
    await mountAuthed();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    authApi.logout.mockResolvedValueOnce(undefined);
    await act(async () => { await auth.logout(); });
    expect(vi.getTimerCount()).toBe(0);
    await advance(2_000_000);
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(1); // only the startup one
  });
});

describe('silent refresh', () => {
  it('refreshes about 60 seconds before the token expires, not earlier', async () => {
    await mountAuthed();
    await advance(838_000);
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(1);
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW + 840_000 }));
    await advance(3_000);
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(2);
    expect(text('count')).toBe('1');
    expect(text('status')).toBe('authenticated');
  });
  it('keeps going: the next timer is scheduled from the new token and the count grows', async () => {
    await mountAuthed();
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW + 840_000 }));
    await advance(841_000);
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW + 1_680_000 }));
    await advance(840_000);
    expect(text('count')).toBe('2');
  });
  it('updates expiresAt after a refresh', async () => {
    await mountAuthed();
    const before = Number(text('expires'));
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW + 840_000 }));
    await advance(841_000);
    expect(Number(text('expires'))).toBeGreaterThan(before);
  });
  it('uses 80 percent of the life when the token is short-lived', async () => {
    await mountAuthed({ lifeSeconds: 100 });
    await advance(79_000);
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(1);
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW + 80_000, lifeSeconds: 100 }));
    await advance(2_000);
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(2);
  });
  it('a failed silent refresh logs out with the expired notice', async () => {
    await mountAuthed();
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    await advance(841_000);
    expect(text('status')).toBe('anonymous');
    expect(text('notice')).toBe('expired|Your session expired. Please sign in again.');
    expect(httpModule.getAccessToken()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('a network error during a silent refresh does not log out: it tries again, and a later success keeps the session', async () => {
    await mountAuthed();
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(0, 'network_error'));
    await advance(841_000); // the timer fires, the request fails because the connection dropped
    expect(text('status')).toBe('authenticated');
    expect(text('notice')).toBe('none');
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW + 846_000 }));
    await advance(5_000); // the retry
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(3);
    expect(text('count')).toBe('1');
    expect(text('status')).toBe('authenticated');
  });
  it('gives up (expired notice) when the network stays down until the token itself has expired', async () => {
    await mountAuthed();
    httpModule.refreshAccessToken.mockRejectedValue(apiError(0, 'network_error'));
    await advance(900_000 + 10_000);
    expect(text('status')).toBe('anonymous');
    expect(text('notice')).toContain('expired');
  });
  it('clears its timer on unmount', async () => {
    const { unmount } = await mountAuthed();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    await advance(2_000_000);
    expect(httpModule.refreshAccessToken).toHaveBeenCalledTimes(1);
  });
  it('refreshNow renews on demand and counts it', async () => {
    await mountAuthed();
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW }));
    await act(async () => { await auth.refreshNow(); });
    expect(text('count')).toBe('1');
  });
  it('refreshNow failure logs out as expired', async () => {
    await mountAuthed();
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    await act(async () => { await auth.refreshNow(); });
    expect(text('status')).toBe('anonymous');
    expect(text('notice')).toContain('expired');
  });
});

describe('failure handler, notices and helpers', () => {
  it('registers a failure handler that logs out as expired, and removes it on unmount', async () => {
    const { unmount } = await mountAuthed();
    const handler = httpModule.setAuthFailureHandler.mock.calls.at(-1)[0];
    expect(handler).toBeTypeOf('function');
    act(() => handler('expired'));
    expect(text('status')).toBe('anonymous');
    expect(text('notice')).toContain('expired|Your session expired');
    unmount();
    expect(httpModule.setAuthFailureHandler).toHaveBeenLastCalledWith(null);
  });
  it('clearNotice removes the notice', async () => {
    await mountAuthed();
    authApi.logout.mockResolvedValueOnce(undefined);
    await act(async () => { await auth.logout(); });
    expect(text('notice')).not.toBe('none');
    act(() => auth.clearNotice());
    expect(text('notice')).toBe('none');
  });
  it('setUser replaces the user (e.g. after email verification)', async () => {
    await mountAuthed();
    act(() => auth.setUser(makeUser({ name: 'Verified Ada', emailVerified: true })));
    expect(text('user')).toBe('Verified Ada');
  });
  it('completeOAuth trades the cookie for a session', async () => {
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    httpModule.refreshAccessToken.mockResolvedValueOnce(makeResult({ nowMs: NOW, user: makeUser({ name: 'Octo', provider: 'github' }) }));
    let user;
    await act(async () => { user = await auth.completeOAuth(); });
    expect(user.name).toBe('Octo');
    expect(text('status')).toBe('authenticated');
  });
  it('completeOAuth throws the ApiError on failure', async () => {
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    httpModule.refreshAccessToken.mockRejectedValueOnce(apiError(401, 'refresh_invalid'));
    let caught;
    await act(async () => { caught = await auth.completeOAuth().catch((e) => e); });
    expect(caught.code).toBe('refresh_invalid');
    expect(text('status')).toBe('anonymous');
  });
  it('useAuth outside a provider throws a helpful error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
