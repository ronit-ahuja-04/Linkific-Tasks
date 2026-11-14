// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';

const fb = vi.hoisted(() => ({ currentUser: null }));
const handler = vi.hoisted(() => ({ fn: null }));
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('../src/lib/firebase', () => ({
  db: {},
  auth: {
    name: 'auth',
    get currentUser() {
      return fb.currentUser;
    },
  },
  googleProvider: { name: 'google' },
  githubProvider: { name: 'github' },
  isFirebaseConfigured: true,
}));
vi.mock('../src/api/client', () => ({
  setAuthFailureHandler: (fn) => {
    handler.fn = fn;
  },
}));

import { authMock } from './mocks/auth.js';
import { resetFirestoreMock } from './mocks/firestore.js';
import { AuthProvider, useAuth } from '../src/context/AuthContext.jsx';
import { getSessionUser } from '../src/lib/session.js';
import { clearGithubToken, getGithubToken } from '../src/lib/githubToken.js';

let emitAuth;
const fbUser = (extra = {}) => ({
  uid: 'u1', email: 'ann@x.com', displayName: 'Ann', photoURL: null, emailVerified: false,
  providerData: [{ providerId: 'password' }], ...extra,
});
const setup = (props = {}) => renderHook(() => useAuth(), { wrapper: ({ children }) => <AuthProvider {...props}>{children}</AuthProvider> });
const err = (code, message = code) => Object.assign(new Error(message), { code });

beforeEach(() => {
  resetFirestoreMock();
  fb.currentUser = null;
  handler.fn = null;
  clearGithubToken();
  Object.values(authMock).forEach((m) => m.mockClear?.());
  authMock.signInWithEmailAndPassword.mockResolvedValue({});
  authMock.createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'new' } });
  authMock.signInWithPopup.mockResolvedValue({});
  authMock.signOut.mockResolvedValue(undefined);
  authMock.sendEmailVerification.mockResolvedValue(undefined);
  authMock.sendPasswordResetEmail.mockResolvedValue(undefined);
  authMock.GithubAuthProvider.credentialFromResult.mockReturnValue({ accessToken: 'github-token' });
  authMock.onAuthStateChanged.mockImplementation((_a, cb) => {
    emitAuth = cb;
    return () => {};
  });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('plain user shape', () => {
  it('includes emailVerified and the provider ids', () => {
    const { result } = setup();
    act(() => emitAuth(fbUser({ emailVerified: true, providerData: [{ providerId: 'password' }, { providerId: 'github.com' }] })));
    expect(result.current.user.emailVerified).toBe(true);
    expect(result.current.user.providerIds).toEqual(['password', 'github.com']);
  });
  it('providerIds is empty when Firebase gives no providerData', () => {
    const { result } = setup();
    act(() => emitAuth(fbUser({ providerData: undefined })));
    expect(result.current.user.providerIds).toEqual([]);
  });
});

describe('remember me (persistence)', () => {
  it('signIn with remember=true picks local persistence BEFORE signing in', async () => {
    const order = [];
    authMock.setPersistence.mockImplementationOnce(async () => { order.push('persist'); });
    authMock.signInWithEmailAndPassword.mockImplementationOnce(async () => { order.push('signin'); return {}; });
    const { result } = setup();
    await act(async () => { await result.current.signIn({ email: 'a@x.com', password: 'pw', remember: true }); });
    expect(authMock.setPersistence).toHaveBeenCalledWith({ name: 'auth', currentUser: null }, authMock.indexedDBLocalPersistence);
    expect(order).toEqual(['persist', 'signin']);
  });
  it('defaults to local persistence', async () => {
    const { result } = setup();
    await act(async () => { await result.current.signIn({ email: 'a@x.com', password: 'pw' }); });
    expect(authMock.setPersistence.mock.calls[0][1]).toBe(authMock.indexedDBLocalPersistence);
  });
  it('remember=false picks session persistence', async () => {
    const { result } = setup();
    await act(async () => { await result.current.signIn({ email: 'a@x.com', password: 'pw', remember: false }); });
    expect(authMock.setPersistence.mock.calls[0][1]).toBe(authMock.browserSessionPersistence);
  });
  it('signUp, Google and GitHub also set persistence', async () => {
    const { result } = setup();
    await act(async () => { await result.current.signUp({ email: 'a@x.com', password: 'pw', remember: false }); });
    await act(async () => { await result.current.signInWithGoogle({ remember: false }); });
    await act(async () => { await result.current.signInWithGithub({ remember: true }); });
    expect(authMock.setPersistence.mock.calls.map((c) => c[1])).toEqual([
      authMock.browserSessionPersistence, authMock.browserSessionPersistence, authMock.indexedDBLocalPersistence,
    ]);
  });
  it('a failing setPersistence stops the sign-in and reports an error', async () => {
    authMock.setPersistence.mockRejectedValueOnce(err('auth/internal-error', 'boom'));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signIn({ email: 'a@x.com', password: 'pw' }); });
    expect(ok).toBe(false);
    expect(authMock.signInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(result.current.error).toBe('boom');
  });
});

describe('errors', () => {
  it('exposes errorCode next to the message, and clearError clears both', async () => {
    authMock.signInWithEmailAndPassword.mockRejectedValueOnce(err('auth/invalid-credential', 'Firebase: Error'));
    const { result } = setup();
    await act(async () => { await result.current.signIn({ email: 'a@x.com', password: 'bad' }); });
    expect(result.current.error).toBe('Firebase: Error');
    expect(result.current.errorCode).toBe('auth/invalid-credential');
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });
});

describe('signUp', () => {
  it('sends the verification email to the new user', async () => {
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signUp({ email: 'a@x.com', password: 'pw' }); });
    expect(ok).toBe(true);
    expect(authMock.sendEmailVerification).toHaveBeenCalledWith({ uid: 'new' });
  });
  it('still succeeds when the verification email fails', async () => {
    authMock.sendEmailVerification.mockRejectedValueOnce(err('auth/too-many-requests'));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signUp({ email: 'a@x.com', password: 'pw' }); });
    expect(ok).toBe(true);
    expect(result.current.error).toBeNull();
  });
  it('does not send anything when creating the account fails', async () => {
    authMock.createUserWithEmailAndPassword.mockRejectedValueOnce(err('auth/email-already-in-use'));
    const { result } = setup();
    await act(async () => { await result.current.signUp({ email: 'a@x.com', password: 'pw' }); });
    expect(authMock.sendEmailVerification).not.toHaveBeenCalled();
    expect(result.current.errorCode).toBe('auth/email-already-in-use');
  });
});

describe('signInWithGithub', () => {
  it('uses the GitHub provider and keeps the OAuth token in memory', async () => {
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signInWithGithub(); });
    expect(ok).toBe(true);
    expect(authMock.signInWithPopup).toHaveBeenCalledWith(expect.anything(), { name: 'github' });
    expect(getGithubToken()).toBe('github-token');
  });
  it('works without a token in the credential', async () => {
    authMock.GithubAuthProvider.credentialFromResult.mockReturnValueOnce(null);
    const { result } = setup();
    await act(async () => { expect(await result.current.signInWithGithub()).toBe(true); });
    expect(getGithubToken()).toBeNull();
  });
  it('maps account-exists-with-different-credential to its translation key', async () => {
    authMock.signInWithPopup.mockRejectedValueOnce(err('auth/account-exists-with-different-credential', 'raw'));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signInWithGithub(); });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('account.error.accountExists');
    expect(result.current.errorCode).toBe('auth/account-exists-with-different-credential');
    expect(getGithubToken()).toBeNull();
  });
  it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])('%s shows no error', async (code) => {
    authMock.signInWithPopup.mockRejectedValueOnce(err(code));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signInWithGithub(); });
    expect(ok).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.errorCode).toBeNull();
  });
  it('forgets the GitHub token when the session ends', async () => {
    const { result } = setup();
    act(() => emitAuth(fbUser()));
    await act(async () => { await result.current.signInWithGithub(); });
    expect(getGithubToken()).toBe('github-token');
    act(() => emitAuth(null));
    expect(getGithubToken()).toBeNull();
  });
});

describe('sendPasswordReset', () => {
  it('sends the email and resolves true', async () => {
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.sendPasswordReset('a@x.com'); });
    expect(ok).toBe(true);
    expect(authMock.sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'a@x.com');
  });
  it('swallows user-not-found so nobody can probe for accounts', async () => {
    authMock.sendPasswordResetEmail.mockRejectedValueOnce(err('auth/user-not-found'));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.sendPasswordReset('nobody@x.com'); });
    expect(ok).toBe(true);
    expect(result.current.error).toBeNull();
  });
  it('reports other errors', async () => {
    authMock.sendPasswordResetEmail.mockRejectedValueOnce(err('auth/too-many-requests', 'slow down'));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.sendPasswordReset('a@x.com'); });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('slow down');
    expect(result.current.errorCode).toBe('auth/too-many-requests');
    expect(result.current.busy).toBe(false);
  });
});

describe('resendVerification and refreshUser', () => {
  it('resendVerification sends to the current user', async () => {
    fb.currentUser = fbUser();
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.resendVerification(); });
    expect(ok).toBe(true);
    expect(authMock.sendEmailVerification).toHaveBeenCalledWith(fb.currentUser);
  });
  it('resendVerification is false with nobody signed in or when sending fails', async () => {
    const { result } = setup();
    await act(async () => { expect(await result.current.resendVerification()).toBe(false); });
    fb.currentUser = fbUser();
    authMock.sendEmailVerification.mockRejectedValueOnce(err('auth/too-many-requests'));
    await act(async () => { expect(await result.current.resendVerification()).toBe(false); });
  });
  it('refreshUser reloads and publishes the new plain user (context and Redux bridge)', async () => {
    const current = fbUser();
    current.reload = vi.fn(async () => { current.emailVerified = true; });
    fb.currentUser = current;
    const { result } = setup();
    act(() => emitAuth(current));
    expect(result.current.user.emailVerified).toBe(false);
    await act(async () => { await result.current.refreshUser(); });
    expect(current.reload).toHaveBeenCalledOnce();
    expect(result.current.user.emailVerified).toBe(true);
    expect(getSessionUser().emailVerified).toBe(true);
  });
  it('refreshUser does nothing when signed out', async () => {
    const { result } = setup();
    await act(async () => { await result.current.refreshUser(); });
    expect(result.current.user).toBeNull();
  });
});

describe('token info', () => {
  const idTokenResult = {
    token: 'raw.jwt.value',
    claims: { iss: 'https://securetoken.google.com/p', sub: 'u1', firebase: { sign_in_provider: 'password' } },
    issuedAtTime: 'Thu, 01 Jan 2026 10:00:00 GMT',
    expirationTime: 'Thu, 01 Jan 2026 11:00:00 GMT',
    authTime: 'Thu, 01 Jan 2026 09:59:00 GMT',
    signInProvider: 'password',
  };
  it('getTokenInfo shapes the result with timestamps in ms', async () => {
    fb.currentUser = fbUser({ getIdTokenResult: vi.fn(async () => idTokenResult) });
    const { result } = setup();
    let info;
    await act(async () => { info = await result.current.getTokenInfo(); });
    expect(info.token).toBe('raw.jwt.value');
    expect(info.claims.sub).toBe('u1');
    expect(info.issuedAt).toBe(Date.parse('2026-01-01T10:00:00Z'));
    expect(info.expiresAt - info.issuedAt).toBe(3600 * 1000);
    expect(info.authTime).toBe(Date.parse('2026-01-01T09:59:00Z'));
    expect(info.signInProvider).toBe('password');
    expect(fb.currentUser.getIdTokenResult).toHaveBeenCalledWith();
  });
  it('falls back to the firebase claim for the provider', async () => {
    const { signInProvider: _skip, ...without } = idTokenResult;
    fb.currentUser = fbUser({ getIdTokenResult: async () => without });
    const { result } = setup();
    let info;
    await act(async () => { info = await result.current.getTokenInfo(); });
    expect(info.signInProvider).toBe('password');
  });
  it('refreshToken forces a refresh', async () => {
    fb.currentUser = fbUser({ getIdTokenResult: vi.fn(async () => idTokenResult) });
    const { result } = setup();
    await act(async () => { await result.current.refreshToken(); });
    expect(fb.currentUser.getIdTokenResult).toHaveBeenCalledWith(true);
  });
  it('both return null when signed out, and the token never sits in the context value', async () => {
    const { result } = setup();
    await act(async () => {
      expect(await result.current.getTokenInfo()).toBeNull();
      expect(await result.current.refreshToken()).toBeNull();
    });
    expect(JSON.stringify(result.current)).not.toContain('raw.jwt.value');
  });
});

describe('notice: why the user was signed out', () => {
  it('a forced sign-out (session revoked) gives notice expired', () => {
    const { result } = setup();
    act(() => emitAuth(fbUser()));
    act(() => emitAuth(null));
    expect(result.current.notice).toEqual({ type: 'expired' });
    act(() => result.current.clearNotice());
    expect(result.current.notice).toBeNull();
  });
  it("the user's own signOut gives no notice", async () => {
    const { result } = setup();
    act(() => emitAuth(fbUser()));
    await act(async () => { await result.current.signOut(); });
    act(() => emitAuth(null));
    expect(result.current.notice).toBeNull();
  });
  it('a forced sign-out after an own one is detected again (flag was cleared)', async () => {
    vi.useFakeTimers();
    const { result } = setup();
    act(() => emitAuth(fbUser()));
    await act(async () => { await result.current.signOut(); });
    act(() => emitAuth(null));
    act(() => emitAuth(fbUser()));
    act(() => emitAuth(null));
    expect(result.current.notice).toEqual({ type: 'expired' });
  });
  it('signedOutByUser is true after the user\'s own sign-out, false after a forced one, and resets on the next sign-in', async () => {
    const { result } = setup();
    expect(result.current.signedOutByUser).toBe(false);
    act(() => emitAuth(fbUser()));
    await act(async () => { await result.current.signOut(); });
    act(() => emitAuth(null));
    expect(result.current.signedOutByUser).toBe(true);
    act(() => emitAuth(fbUser()));
    expect(result.current.signedOutByUser).toBe(false);
  });
  it('is not set when the first report is "no user" (never signed in)', () => {
    const { result } = setup();
    act(() => emitAuth(null));
    expect(result.current.notice).toBeNull();
  });
  it('signing in again clears the notice', () => {
    const { result } = setup();
    act(() => emitAuth(fbUser()));
    act(() => emitAuth(null));
    act(() => emitAuth(fbUser()));
    expect(result.current.notice).toBeNull();
  });
  it('the API auth-failure handler signs out with notice expired', async () => {
    const { result } = setup();
    act(() => emitAuth(fbUser()));
    await act(async () => { handler.fn(); });
    expect(result.current.notice).toEqual({ type: 'expired' });
    expect(authMock.signOut).toHaveBeenCalledOnce();
  });
});

describe('idle auto-logout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  it('signs out with notice idle after the idle time', async () => {
    const { result } = setup({ idleMinutes: 1 });
    act(() => emitAuth(fbUser()));
    await act(async () => { vi.advanceTimersByTime(59 * 1000); });
    expect(authMock.signOut).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(authMock.signOut).toHaveBeenCalledOnce();
    expect(result.current.notice).toEqual({ type: 'idle' });
    act(() => emitAuth(null)); // Firebase confirms: the idle notice must survive
    expect(result.current.notice).toEqual({ type: 'idle' });
  });
  it.each(['pointerdown', 'keydown', 'scroll'])('%s resets the timer', async (name) => {
    setup({ idleMinutes: 1 });
    act(() => emitAuth(fbUser()));
    await act(async () => { vi.advanceTimersByTime(50 * 1000); });
    act(() => { window.dispatchEvent(new Event(name)); });
    await act(async () => { vi.advanceTimersByTime(50 * 1000); });
    expect(authMock.signOut).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(11 * 1000); });
    expect(authMock.signOut).toHaveBeenCalledOnce();
  });
  it('has no timer while signed out', async () => {
    setup({ idleMinutes: 1 });
    act(() => emitAuth(null));
    await act(async () => { vi.advanceTimersByTime(10 * 60 * 1000); });
    expect(authMock.signOut).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cleans the timer on sign-out and on unmount', () => {
    const { unmount } = setup({ idleMinutes: 1 });
    act(() => emitAuth(fbUser()));
    expect(vi.getTimerCount()).toBe(1);
    act(() => emitAuth(null));
    expect(vi.getTimerCount()).toBe(0);
    act(() => emitAuth(fbUser()));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('idleMinutes=0 disables the feature', () => {
    setup({ idleMinutes: 0 });
    act(() => emitAuth(fbUser()));
    expect(vi.getTimerCount()).toBe(0);
  });
});
