import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: null, auth: null, googleProvider: {}, isFirebaseConfigured: false }));

import { authMock } from './mocks/auth.js';
import { firestoreMock as fs } from './mocks/firestore.js';
import { makeStore } from '../src/store/index.js';
import { startAuthListener } from '../src/store/listeners.js';
import { selectAuthError, selectAuthStatus, signInWithGoogle } from '../src/store/slices/authSlice.js';

afterEach(() => vi.restoreAllMocks());

describe('running without Firebase keys', () => {
  it('reports "signed out" without touching Firebase, so the sign-in page can show', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = makeStore();
    expect(selectAuthStatus(store.getState())).toBe('loading');
    const stop = startAuthListener(store);
    expect(selectAuthStatus(store.getState())).toBe('unauthenticated');
    expect(authMock.onAuthStateChanged).not.toHaveBeenCalled();
    expect(fs.setDoc).not.toHaveBeenCalled();
    expect(() => stop()).not.toThrow();
  });

  it('tells the user what is missing when they try to sign in', async () => {
    const store = makeStore();
    await store.dispatch(signInWithGoogle());
    expect(selectAuthError(store.getState())).toContain('.env');
  });
});
