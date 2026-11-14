// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const h = vi.hoisted(() => ({
  authValue: { user: null, refreshUser: null },
  fbAuth: { currentUser: null },
  provider: { providerId: 'github.com' },
}));
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ auth: h.fbAuth, db: {}, githubProvider: h.provider, isFirebaseConfigured: true }));
vi.mock('../src/context/AuthContext.jsx', () => ({ useAuth: () => h.authValue }));

import { authMock } from './mocks/auth.js';
import { GitHubProvider, useGitHub } from '../src/context/GitHubContext.jsx';
import { clearGithubToken, getGithubToken, setGithubToken } from '../src/lib/githubToken.js';

const fbUser = { uid: 'u1' };
const plainUser = (providerIds, uid = 'u1') => ({ uid, email: 'a@x.com', providerIds });
let refreshUser;

beforeEach(() => {
  refreshUser = vi.fn().mockResolvedValue(undefined);
  h.authValue = { user: plainUser(['password']), refreshUser };
  h.fbAuth.currentUser = fbUser;
  Object.values(authMock).forEach((m) => m.mockClear?.());
  authMock.linkWithPopup.mockResolvedValue({ additionalUserInfo: { username: 'octocat' } });
  authMock.reauthenticateWithPopup.mockResolvedValue({ additionalUserInfo: { username: 'octocat' } });
  authMock.unlink.mockResolvedValue({});
  authMock.GithubAuthProvider.credentialFromResult.mockReturnValue({ accessToken: 'github-token' });
  clearGithubToken();
});
afterEach(() => {
  cleanup();
  clearGithubToken();
});

const setup = () => renderHook(() => useGitHub(), { wrapper: GitHubProvider });

describe('GitHubContext state', () => {
  it('starts disconnected; linked comes from the Firebase providers', () => {
    expect(setup().result.current).toMatchObject({ connected: false, connecting: false, linked: false, githubLogin: null, error: null });
    h.authValue = { user: plainUser(['password', 'github.com']), refreshUser };
    expect(setup().result.current.linked).toBe(true);
  });

  it('connected follows the in-memory token store', () => {
    const { result } = setup();
    expect(result.current.connected).toBe(false);
    act(() => setGithubToken('abc'));
    expect(result.current.connected).toBe(true);
    act(() => clearGithubToken());
    expect(result.current.connected).toBe(false);
  });

  it('works without a provider (safe defaults)', () => {
    const { result } = renderHook(() => useGitHub());
    expect(result.current.connected).toBe(false);
  });
});

describe('connect()', () => {
  it('LINKS GitHub when it is not linked yet, stores the token and the login, and refreshes the user', async () => {
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(true);
    expect(authMock.linkWithPopup).toHaveBeenCalledWith(fbUser, h.provider);
    expect(authMock.reauthenticateWithPopup).not.toHaveBeenCalled();
    expect(getGithubToken()).toBe('github-token');
    expect(result.current).toMatchObject({ connected: true, githubLogin: 'octocat', error: null, connecting: false });
    expect(refreshUser).toHaveBeenCalledOnce();
  });

  it('REAUTHENTICATES when GitHub is already linked (no new link, no user refresh)', async () => {
    h.authValue = { user: plainUser(['password', 'github.com']), refreshUser };
    const { result } = setup();
    await act(async () => { await result.current.connect(); });
    expect(authMock.reauthenticateWithPopup).toHaveBeenCalledWith(fbUser, h.provider);
    expect(authMock.linkWithPopup).not.toHaveBeenCalled();
    expect(getGithubToken()).toBe('github-token');
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('shows connecting while the popup is open', async () => {
    let finish;
    authMock.linkWithPopup.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const { result } = setup();
    let promise;
    act(() => { promise = result.current.connect(); });
    expect(result.current.connecting).toBe(true);
    await act(async () => { finish({}); await promise; });
    expect(result.current.connecting).toBe(false);
  });

  it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])('is silent when the popup ends with %s', async (code) => {
    authMock.linkWithPopup.mockRejectedValueOnce(Object.assign(new Error('closed'), { code }));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.connecting).toBe(false);
    expect(getGithubToken()).toBeNull();
  });

  it('maps credential-already-in-use', async () => {
    authMock.linkWithPopup.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'auth/credential-already-in-use' }));
    const { result } = setup();
    await act(async () => { await result.current.connect(); });
    expect(result.current.error.code).toBe('credential_in_use');
  });

  it('maps other failures to unknown with the message, and clears the error on the next try', async () => {
    authMock.linkWithPopup.mockRejectedValueOnce(Object.assign(new Error('network down'), { code: 'auth/network-request-failed' }));
    const { result } = setup();
    await act(async () => { await result.current.connect(); });
    expect(result.current.error).toEqual({ code: 'unknown', message: 'network down' });
    await act(async () => { await result.current.connect(); });
    expect(result.current.error).toBeNull();
  });

  it('reports an error when GitHub gives no access token', async () => {
    authMock.GithubAuthProvider.credentialFromResult.mockReturnValueOnce(null);
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(false);
    expect(result.current.error.code).toBe('unknown');
    expect(result.current.connected).toBe(false);
  });

  it('fails cleanly when nobody is signed in to Firebase', async () => {
    h.fbAuth.currentUser = null;
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.connect(); });
    expect(ok).toBe(false);
    expect(result.current.error.code).toBe('unknown');
    expect(authMock.linkWithPopup).not.toHaveBeenCalled();
  });

  it('works when the popup result has no username', async () => {
    authMock.linkWithPopup.mockResolvedValueOnce({});
    const { result } = setup();
    await act(async () => { await result.current.connect(); });
    expect(result.current.githubLogin).toBeNull();
    expect(result.current.connected).toBe(true);
  });
});

describe('unlink() and disconnect()', () => {
  it('unlinks github.com, forgets the token and refreshes the user', async () => {
    h.authValue = { user: plainUser(['password', 'github.com']), refreshUser };
    setGithubToken('t');
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.unlink(); });
    expect(ok).toBe(true);
    expect(authMock.unlink).toHaveBeenCalledWith(fbUser, 'github.com');
    expect(getGithubToken()).toBeNull();
    expect(refreshUser).toHaveBeenCalledOnce();
  });

  it('refuses to unlink the last sign-in method', async () => {
    h.authValue = { user: plainUser(['github.com']), refreshUser };
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.unlink(); });
    expect(ok).toBe(false);
    expect(result.current.error.code).toBe('last_provider');
    expect(authMock.unlink).not.toHaveBeenCalled();
  });

  it('reports a Firebase failure and keeps the token', async () => {
    h.authValue = { user: plainUser(['password', 'github.com']), refreshUser };
    setGithubToken('t');
    authMock.unlink.mockRejectedValueOnce(Object.assign(new Error('boom'), { code: 'auth/no-such-provider' }));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.unlink(); });
    expect(ok).toBe(false);
    expect(result.current.error).toEqual({ code: 'unknown', message: 'boom' });
    expect(getGithubToken()).toBe('t');
  });

  it('unlink without a Firebase user reports an error', async () => {
    h.fbAuth.currentUser = null;
    const { result } = setup();
    await act(async () => { await result.current.unlink(); });
    expect(result.current.error.code).toBe('unknown');
  });

  it('disconnect() forgets only the in-memory token', async () => {
    h.authValue = { user: plainUser(['password', 'github.com']), refreshUser };
    setGithubToken('t');
    const { result } = setup();
    act(() => result.current.disconnect());
    expect(result.current.connected).toBe(false);
    expect(result.current.linked).toBe(true);
    expect(authMock.unlink).not.toHaveBeenCalled();
  });
});

describe('session boundaries', () => {
  it('forgets the GitHub token when the user signs out', () => {
    const { rerender } = renderHook(() => useGitHub(), { wrapper: GitHubProvider });
    h.authValue = { user: plainUser(['password']), refreshUser };
    rerender();
    act(() => setGithubToken('t'));
    h.authValue = { user: null, refreshUser };
    rerender();
    expect(getGithubToken()).toBeNull();
  });

  it('does not hand one user\'s GitHub login to the next user', async () => {
    const { result, rerender } = setup();
    await act(async () => { await result.current.connect(); });
    expect(result.current.githubLogin).toBe('octocat');
    h.authValue = { user: plainUser(['password'], 'u2'), refreshUser };
    rerender();
    expect(result.current.githubLogin).toBeNull();
  });
});
