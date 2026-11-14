import { vi } from 'vitest';

/**
 * The shared stand-in for 'firebase/auth' in unit tests. Every Firebase Auth function the app
 * imports must exist here, or a test that loads the app's auth code fails with "no export defined".
 */
export const authMock = {
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  signInWithPopup: vi.fn().mockResolvedValue({}),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
  onIdTokenChanged: vi.fn(() => () => {}),
  GoogleAuthProvider: class GoogleAuthProvider {
    addScope() { return this; }
    static credentialFromResult = vi.fn(() => ({ accessToken: 'google-token' }));
  },
  // Day 15
  GithubAuthProvider: class GithubAuthProvider {
    constructor() { this.providerId = 'github.com'; this.scopes = []; }
    addScope(scope) { this.scopes.push(scope); return this; }
    setCustomParameters() { return this; }
    static credentialFromResult = vi.fn(() => ({ accessToken: 'github-token' }));
    static credentialFromError = vi.fn(() => null);
  },
  setPersistence: vi.fn().mockResolvedValue(undefined),
  indexedDBLocalPersistence: { type: 'INDEXED_DB' },
  browserSessionPersistence: { type: 'SESSION' },
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  applyActionCode: vi.fn().mockResolvedValue(undefined),
  verifyPasswordResetCode: vi.fn().mockResolvedValue('user@example.com'),
  confirmPasswordReset: vi.fn().mockResolvedValue(undefined),
  linkWithPopup: vi.fn().mockResolvedValue({}),
  reauthenticateWithPopup: vi.fn().mockResolvedValue({}),
  unlink: vi.fn().mockResolvedValue({}),
};
