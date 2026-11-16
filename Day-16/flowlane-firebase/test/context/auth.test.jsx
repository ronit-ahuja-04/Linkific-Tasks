// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';

const fb = vi.hoisted(() => ({ configured: true }));
vi.mock('firebase/auth', async () => (await import('../mocks/auth.js')).authMock);
vi.mock('firebase/firestore', async () => (await import('../mocks/firestore.js')).firestoreMock);
vi.mock('../../src/lib/firebase', () => ({
  db: { name: 'db' },
  auth: { name: 'auth' },
  googleProvider: {},
  githubProvider: {},
  get isFirebaseConfigured() {
    return fb.configured;
  },
}));

import { authMock } from '../mocks/auth.js';
import { firestoreMock as fs, resetFirestoreMock } from '../mocks/firestore.js';
import { AuthProvider, useAuth } from '../../src/context/AuthContext.jsx';
import { getSessionUser } from '../../src/lib/session.js';

let emitAuth; // simulates Firebase reporting a sign-in or sign-out
const unsubscribe = vi.fn();
const storage = {};

beforeEach(() => {
  fb.configured = true;
  resetFirestoreMock();
  Object.values(authMock).forEach((m) => m.mockClear?.());
  authMock.signInWithEmailAndPassword.mockResolvedValue({});
  authMock.createUserWithEmailAndPassword.mockResolvedValue({});
  authMock.signInWithPopup.mockResolvedValue({});
  authMock.GoogleAuthProvider.credentialFromResult.mockReturnValue({ accessToken: 'google-token' });
  authMock.onAuthStateChanged.mockImplementation((_auth, callback) => {
    emitAuth = callback;
    return unsubscribe;
  });
  unsubscribe.mockClear();
  Object.keys(storage).forEach((k) => delete storage[k]);
  vi.stubGlobal('localStorage', { getItem: (k) => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const setup = () => renderHook(() => useAuth(), { wrapper: AuthProvider });
const firebaseUser = (extra = {}) => ({
  uid: 'u1', email: 'ann@x.com', displayName: 'Ann', photoURL: null,
  stsTokenManager: { accessToken: 'secret' }, getIdToken: () => 'secret', ...extra,
});

describe('AuthProvider and useAuth', () => {
  it('starts in "loading" and subscribes to Firebase once', () => {
    const { result } = setup();
    expect(result.current.status).toBe('loading');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(authMock.onAuthStateChanged).toHaveBeenCalledOnce();
  });

  it('becomes authenticated with a PLAIN user, publishes it to the Redux bridge, and saves the profile', () => {
    const { result } = setup();
    act(() => emitAuth(firebaseUser()));
    expect(result.current.status).toBe('authenticated');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ uid: 'u1', email: 'ann@x.com', displayName: 'Ann', photoURL: null, emailVerified: false, providerIds: [] });
    expect(JSON.stringify(result.current)).not.toContain('secret'); // no tokens leak into context
    expect(getSessionUser()).toEqual(result.current.user); // what Redux thunks read
    const [ref, profile, options] = fs.setDoc.mock.calls[0];
    expect(ref.path).toBe('users/u1');
    expect(profile).toMatchObject({ uid: 'u1', email: 'ann@x.com', displayName: 'Ann' });
    expect(options).toEqual({ merge: true });
  });

  it('uses the email prefix as the profile name when there is no display name', () => {
    setup();
    act(() => emitAuth(firebaseUser({ displayName: null })));
    expect(fs.setDoc.mock.calls[0][1].displayName).toBe('ann');
  });

  it('signs out: unauthenticated, bridge cleared, no profile write', () => {
    const { result } = setup();
    act(() => emitAuth(firebaseUser()));
    fs.setDoc.mockClear();
    act(() => emitAuth(null));
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.user).toBeNull();
    expect(getSessionUser()).toBeNull();
    expect(fs.setDoc).not.toHaveBeenCalled();
  });

  it('signIn: busy while pending, true on success, no error', async () => {
    const { result } = setup();
    let resolve;
    authMock.signInWithEmailAndPassword.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    let outcome;
    act(() => { outcome = result.current.signIn({ email: 'a@x.com', password: 'pw' }); });
    expect(result.current.busy).toBe(true);
    await act(async () => { resolve({}); await outcome; });
    expect(await outcome).toBe(true);
    expect(result.current.busy).toBe(false);
    expect(result.current.error).toBeNull();
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledWith({ name: 'auth' }, 'a@x.com', 'pw');
  });

  it('signIn failure: false, the Firebase message in `error`, and clearError removes it', async () => {
    authMock.signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Firebase: wrong password'));
    const { result } = setup();
    let ok;
    await act(async () => { ok = await result.current.signIn({ email: 'a@x.com', password: 'bad' }); });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('Firebase: wrong password');
    expect(result.current.busy).toBe(false);
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('signUp calls createUser, and a new attempt clears the previous error', async () => {
    authMock.createUserWithEmailAndPassword.mockRejectedValueOnce(new Error('email in use'));
    const { result } = setup();
    await act(async () => { await result.current.signUp({ email: 'a@x.com', password: 'pw' }); });
    expect(result.current.error).toBe('email in use');
    await act(async () => { expect(await result.current.signUp({ email: 'b@x.com', password: 'pw' })).toBe(true); });
    expect(result.current.error).toBeNull();
  });

  it('Google sign-in stores the OAuth token that calendar sync needs', async () => {
    const { result } = setup();
    await act(async () => { await result.current.signInWithGoogle(); });
    expect(authMock.signInWithPopup).toHaveBeenCalled();
    expect(storage.googleAccessToken).toBe('google-token');
  });

  it('signOut calls Firebase', async () => {
    const { result } = setup();
    await act(async () => { await result.current.signOut(); });
    expect(authMock.signOut).toHaveBeenCalledOnce();
  });

  it('unsubscribes and clears the bridge when the provider unmounts', () => {
    const { unmount } = setup();
    act(() => emitAuth(firebaseUser()));
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(getSessionUser()).toBeNull();
  });

  it('without Firebase keys: shows signed-out, never calls Firebase, and explains what is missing', async () => {
    fb.configured = false;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = setup();
    expect(result.current.status).toBe('unauthenticated');
    expect(authMock.onAuthStateChanged).not.toHaveBeenCalled();
    let ok;
    await act(async () => { ok = await result.current.signIn({ email: 'a@x.com', password: 'pw' }); });
    expect(ok).toBe(false);
    expect(result.current.error).toContain('.env');
    expect(authMock.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('keeps the same context value between renders when nothing changed (useMemo)', () => {
    const seen = [];
    function Probe() {
      seen.push(useAuth());
      return null;
    }
    const { rerender } = render(<AuthProvider><Probe /></AuthProvider>);
    rerender(<AuthProvider><Probe /></AuthProvider>);
    rerender(<AuthProvider><Probe /></AuthProvider>);
    expect(new Set(seen).size).toBe(1);
  });

  it('only re-renders consumers when the value really changes', () => {
    let renders = 0;
    function Probe() {
      useAuth();
      renders += 1;
      return <span>probe</span>;
    }
    render(<AuthProvider><Probe /></AuthProvider>);
    const before = renders;
    act(() => emitAuth(firebaseUser()));
    expect(renders).toBe(before + 1);
    act(() => emitAuth(firebaseUser())); // a new object, but the same plain user: state changes only if the object differs
    expect(screen.getByText('probe')).toBeTruthy();
  });
});
