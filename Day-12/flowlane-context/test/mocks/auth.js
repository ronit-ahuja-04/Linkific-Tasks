import { vi } from 'vitest';

export const authMock = {
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({}),
  signInWithPopup: vi.fn().mockResolvedValue({}),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: { credentialFromResult: vi.fn(() => ({ accessToken: 'google-token' })) },
};
