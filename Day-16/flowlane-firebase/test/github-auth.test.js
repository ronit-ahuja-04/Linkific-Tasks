import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);

import { authMock } from './mocks/auth.js';
import { hasGithubProvider, loginFromResult, mapGithubAuthError, tokenFromResult } from '../src/lib/githubAuth.js';

describe('hasGithubProvider', () => {
  it('is true only when github.com is in providerIds', () => {
    expect(hasGithubProvider({ providerIds: ['password', 'github.com'] })).toBe(true);
    expect(hasGithubProvider({ providerIds: ['password'] })).toBe(false);
    expect(hasGithubProvider({})).toBe(false);
    expect(hasGithubProvider(null)).toBe(false);
  });
});

describe('tokenFromResult', () => {
  it('reads the access token through GithubAuthProvider.credentialFromResult', () => {
    expect(tokenFromResult({})).toBe('github-token');
  });
  it('is null when there is no credential', () => {
    authMock.GithubAuthProvider.credentialFromResult.mockReturnValueOnce(null);
    expect(tokenFromResult({})).toBeNull();
  });
});

describe('loginFromResult', () => {
  it('prefers additionalUserInfo.username', () => {
    expect(loginFromResult({ additionalUserInfo: { username: 'octocat' }, _tokenResponse: { screenName: 'other' } })).toBe('octocat');
  });
  it('falls back to the token response and the reloaded user info', () => {
    expect(loginFromResult({ _tokenResponse: { screenName: 'mona' } })).toBe('mona');
    expect(loginFromResult({ user: { reloadUserInfo: { screenName: 'lisa' } } })).toBe('lisa');
  });
  it('is null when nothing is available', () => {
    expect(loginFromResult({})).toBeNull();
    expect(loginFromResult(undefined)).toBeNull();
    expect(loginFromResult({ _tokenResponse: { screenName: '' } })).toBeNull();
  });
});

describe('mapGithubAuthError', () => {
  it('is silent (null) when the user closes or cancels the popup', () => {
    expect(mapGithubAuthError({ code: 'auth/popup-closed-by-user' })).toBeNull();
    expect(mapGithubAuthError({ code: 'auth/cancelled-popup-request' })).toBeNull();
  });
  it('maps credential-already-in-use', () => {
    expect(mapGithubAuthError({ code: 'auth/credential-already-in-use' })).toMatchObject({ code: 'credential_in_use' });
    expect(mapGithubAuthError({ code: 'auth/operation-not-allowed' })).toMatchObject({ code: 'provider_off' }); // provider not enabled in the Firebase console
  });
  it('maps everything else to unknown with a message', () => {
    expect(mapGithubAuthError({ code: 'auth/network-request-failed', message: 'offline' })).toEqual({ code: 'unknown', message: 'offline' });
    expect(mapGithubAuthError(undefined)).toMatchObject({ code: 'unknown' });
  });
});
