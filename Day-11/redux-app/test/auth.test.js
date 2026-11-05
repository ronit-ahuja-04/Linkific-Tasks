import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../src/store/index.js';
import {
  clearAuthError, loginUser, logout, selectAuthError, selectAuthStatus, selectIsLoggedIn, selectUser,
} from '../src/store/slices/authSlice.js';
import { mockFetch } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

const GOOD = { id: 1, username: 'emilys', email: 'e@x.com', firstName: 'Emily', lastName: 'J', image: 'i.png', accessToken: 'tok', refreshToken: 'r' };

describe('auth slice', () => {
  it('starts logged out', () => {
    const s = makeStore().getState();
    expect(selectIsLoggedIn(s)).toBe(false);
    expect(selectUser(s)).toBeNull();
    expect(selectAuthStatus(s)).toBe('idle');
  });

  it('goes idle -> loading -> succeeded and stores the user and token', async () => {
    const fetch = mockFetch({ json: GOOD });
    const store = makeStore();
    const promise = store.dispatch(loginUser({ username: 'emilys', password: 'pw' }));
    expect(selectAuthStatus(store.getState())).toBe('loading');
    await promise;
    const s = store.getState();
    expect(selectAuthStatus(s)).toBe('succeeded');
    expect(selectIsLoggedIn(s)).toBe(true);
    expect(selectUser(s)).toEqual({ id: 1, username: 'emilys', email: 'e@x.com', firstName: 'Emily', lastName: 'J', image: 'i.png' });
    expect(s.auth.token).toBe('tok');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ username: 'emilys', password: 'pw' });
  });

  it('never stores the refresh token or password in the state', async () => {
    mockFetch({ json: GOOD });
    const store = makeStore();
    await store.dispatch(loginUser({ username: 'emilys', password: 'secret-pw' }));
    const text = JSON.stringify(store.getState());
    expect(text).not.toContain('secret-pw');
    expect(text).not.toContain('"refreshToken"');
  });

  it('shows the server message on invalid credentials', async () => {
    mockFetch({ ok: false, status: 400, json: { message: 'Invalid credentials' } });
    const store = makeStore();
    await store.dispatch(loginUser({ username: 'x', password: 'y' }));
    expect(selectAuthStatus(store.getState())).toBe('failed');
    expect(selectAuthError(store.getState())).toBe('Invalid credentials');
    expect(selectIsLoggedIn(store.getState())).toBe(false);
  });

  it('shows the network error when fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));
    const store = makeStore();
    await store.dispatch(loginUser({ username: 'x', password: 'y' }));
    expect(selectAuthError(store.getState())).toBe('Failed to fetch');
  });

  it('unwrap() throws on a rejected login so components can branch on it', async () => {
    mockFetch({ ok: false, status: 400, json: { message: 'Invalid credentials' } });
    const store = makeStore();
    await expect(store.dispatch(loginUser({ username: 'x', password: 'y' })).unwrap()).rejects.toBe('Invalid credentials');
  });

  it('logs out back to the initial state and can clear an error', async () => {
    mockFetch({ json: GOOD });
    const store = makeStore();
    await store.dispatch(loginUser({ username: 'emilys', password: 'pw' }));
    store.dispatch(logout());
    expect(store.getState().auth).toEqual({ user: null, token: null, status: 'idle', error: null });

    mockFetch({ ok: false, status: 400, json: { message: 'nope' } });
    await store.dispatch(loginUser({ username: 'a', password: 'b' }));
    store.dispatch(clearAuthError());
    expect(selectAuthError(store.getState())).toBeNull();
  });
});
