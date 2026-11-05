import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
const fb = vi.hoisted(() => ({ configured: true }));
vi.mock('../src/lib/firebase', () => ({
  db: { name: 'db' },
  auth: { name: 'auth' },
  googleProvider: {},
  get isFirebaseConfigured() {
    return fb.configured;
  },
}));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { authMock } from './mocks/auth.js';
import { makeStore } from '../src/store/index.js';
import {
  authErrorCleared, authStateChanged, selectAuthBusy, selectAuthError, selectAuthStatus, selectUser,
  signInWithEmail, signInWithGoogle, signOutUser, signUpWithEmail, toPlainUser,
} from '../src/store/slices/authSlice.js';
import { loadUserTheme, selectTheme, themeSet, toggleTheme } from '../src/store/slices/themeSlice.js';

const storage = {};
beforeEach(() => {
  fb.configured = true;
  resetFirestoreMock();
  Object.values(authMock).forEach((m) => m.mockClear?.());
  authMock.GoogleAuthProvider.credentialFromResult.mockReturnValue({ accessToken: 'google-token' });
  Object.keys(storage).forEach((k) => delete storage[k]);
  vi.stubGlobal('localStorage', { getItem: (k) => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } });
});
afterEach(() => vi.unstubAllGlobals());

describe('auth slice', () => {
  it('starts in the loading state with no user', () => {
    const s = makeStore().getState();
    expect(selectAuthStatus(s)).toBe('loading');
    expect(selectUser(s)).toBeNull();
  });

  it('keeps only plain fields of the Firebase user (no class instances, no tokens)', () => {
    class FirebaseUser {
      uid = 'u1'; email = 'a@x.com'; displayName = 'Ann'; photoURL = null;
      stsTokenManager = { accessToken: 'secret' };
      getIdToken() { return 'secret'; }
    }
    const store = makeStore();
    store.dispatch(authStateChanged(new FirebaseUser()));
    expect(selectUser(store.getState())).toEqual({ uid: 'u1', email: 'a@x.com', displayName: 'Ann', photoURL: null });
    expect(JSON.stringify(store.getState())).not.toContain('secret');
    expect(selectAuthStatus(store.getState())).toBe('authenticated');
    store.dispatch(authStateChanged(null));
    expect(selectAuthStatus(store.getState())).toBe('unauthenticated');
    expect(toPlainUser(null)).toBeNull();
  });

  it('signs in with email: busy while pending, then idle with no error', async () => {
    const store = makeStore();
    const promise = store.dispatch(signInWithEmail({ email: 'a@x.com', password: 'pw' }));
    expect(selectAuthBusy(store.getState())).toBe(true);
    await promise;
    expect(selectAuthBusy(store.getState())).toBe(false);
    expect(selectAuthError(store.getState())).toBeNull();
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledWith({ name: 'auth' }, 'a@x.com', 'pw');
  });

  it('shows the Firebase error message and clears it on request', async () => {
    authMock.signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Firebase: wrong password'));
    const store = makeStore();
    await store.dispatch(signInWithEmail({ email: 'a@x.com', password: 'bad' }));
    expect(selectAuthError(store.getState())).toBe('Firebase: wrong password');
    expect(selectAuthBusy(store.getState())).toBe(false);
    store.dispatch(authErrorCleared());
    expect(selectAuthError(store.getState())).toBeNull();
  });

  it('signs up, and unwrap() rejects with the message so components can branch', async () => {
    const store = makeStore();
    await store.dispatch(signUpWithEmail({ email: 'n@x.com', password: 'pw' })).unwrap();
    expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalled();
    authMock.createUserWithEmailAndPassword.mockRejectedValueOnce(new Error('email in use'));
    await expect(store.dispatch(signUpWithEmail({ email: 'n@x.com', password: 'pw' })).unwrap()).rejects.toBe('email in use');
  });

  it('google sign-in saves the OAuth token for calendar sync (fixes a missing import in the old code)', async () => {
    const store = makeStore();
    await store.dispatch(signInWithGoogle()).unwrap();
    expect(authMock.signInWithPopup).toHaveBeenCalled();
    expect(storage.googleAccessToken).toBe('google-token');
  });

  it('refuses to call Firebase when keys are missing, with a helpful message', async () => {
    fb.configured = false;
    const store = makeStore();
    await store.dispatch(signInWithEmail({ email: 'a@x.com', password: 'pw' }));
    expect(selectAuthError(store.getState())).toContain('Firebase keys are required');
    expect(authMock.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('signs out through Firebase', async () => {
    await makeStore().dispatch(signOutUser());
    expect(authMock.signOut).toHaveBeenCalledOnce();
  });
});

describe('theme slice', () => {
  it('toggles, remembers locally and saves on the profile when signed in', async () => {
    const store = makeStore();
    store.dispatch(authStateChanged({ uid: 'u1', email: 'a@x.com' }));
    store.dispatch(themeSet('light'));
    await store.dispatch(toggleTheme());
    expect(selectTheme(store.getState())).toBe('dark');
    expect(storage.theme).toBe('dark');
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.objectContaining({ path: 'users/u1' }), { theme: 'dark' });
    await store.dispatch(toggleTheme());
    expect(selectTheme(store.getState())).toBe('light');
  });

  it('toggles without a network call when signed out, and survives a failed save', async () => {
    const store = makeStore();
    store.dispatch(themeSet('light'));
    await store.dispatch(toggleTheme());
    expect(fs.updateDoc).not.toHaveBeenCalled();

    store.dispatch(authStateChanged({ uid: 'u1', email: 'a@x.com' }));
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await store.dispatch(toggleTheme());
    expect(selectTheme(store.getState())).toBe('light');
  });

  it('applies the theme saved on the profile at login', async () => {
    fs.getDocs.mockResolvedValue({ empty: false, docs: [{ data: () => ({ theme: 'dark' }) }] });
    const store = makeStore();
    store.dispatch(themeSet('light'));
    await store.dispatch(loadUserTheme('u1'));
    expect(selectTheme(store.getState())).toBe('dark');
    fs.getDocs.mockResolvedValue({ empty: true, docs: [] });
    store.dispatch(themeSet('light'));
    await store.dispatch(loadUserTheme('u1'));
    expect(selectTheme(store.getState())).toBe('light');
  });

  it('only accepts light or dark', () => {
    const store = makeStore();
    store.dispatch(themeSet('purple'));
    expect(selectTheme(store.getState())).toBe('light');
  });
});
