import { describe, expect, it } from 'vitest';
import { errorKeyFor, isSilentAuthError } from '../src/lib/authErrors.js';
import { DICTIONARIES } from '../src/i18n';

describe('authErrors', () => {
  it.each([
    ['auth/invalid-credential', 'account.error.invalidCredential'],
    ['auth/wrong-password', 'account.error.invalidCredential'],
    ['auth/email-already-in-use', 'account.error.emailInUse'],
    ['auth/weak-password', 'account.error.weakPassword'],
    ['auth/too-many-requests', 'account.error.tooManyRequests'],
    ['auth/network-request-failed', 'account.error.network'],
    ['auth/account-exists-with-different-credential', 'account.error.accountExists'],
    ['auth/operation-not-allowed', 'account.error.providerOff'], // e.g. the GitHub provider is not enabled in the Firebase console yet
  ])('%s -> %s', (code, key) => {
    expect(errorKeyFor(code)).toBe(key);
    expect(DICTIONARIES.en[key]).toBeTruthy();
  });
  it('unknown codes have no key', () => {
    expect(errorKeyFor('auth/other')).toBeNull();
    expect(errorKeyFor(null)).toBeNull();
  });
  it('popup closures are silent', () => {
    expect(isSilentAuthError('auth/popup-closed-by-user')).toBe(true);
    expect(isSilentAuthError('auth/cancelled-popup-request')).toBe(true);
    expect(isSilentAuthError('auth/invalid-credential')).toBe(false);
  });
});
