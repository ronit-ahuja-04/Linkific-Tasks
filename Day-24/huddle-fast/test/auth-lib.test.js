// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { passwordStrength, friendlyAuthError, providersOf, safeRedirect, validateEmail, validatePassword, validateUsername } from '../src/lib/profiles';
import { urlAuthError } from '../src/lib/authUrl';

describe('friendlyAuthError', () => {
  it('maps bad credentials by code and by message', () => {
    expect(friendlyAuthError({ code: 'invalid_credentials', message: 'x' })).toBe('Email or password is incorrect.');
    expect(friendlyAuthError({ message: 'Invalid login credentials' })).toBe('Email or password is incorrect.');
  });
  it('maps already registered, weak and rate limit', () => {
    expect(friendlyAuthError({ code: 'user_already_exists' })).toMatch(/already exists/);
    expect(friendlyAuthError({ code: 'weak_password' })).toMatch(/at least 6/);
    expect(friendlyAuthError({ status: 429, message: 'x' })).toMatch(/Too many/);
  });
  it('falls back to the server message and to a generic one', () => {
    expect(friendlyAuthError({ message: 'Boom' })).toBe('Boom');
    expect(friendlyAuthError({})).toMatch(/went wrong/);
    expect(friendlyAuthError(null)).toBe('');
  });
});

describe('validation', () => {
  it('username: optional by default, format enforced', () => {
    expect(validateUsername('')).toBe('');
    expect(validateUsername('', { required: true })).toMatch(/required/);
    expect(validateUsername('ab')).toMatch(/3 to 24/);
    expect(validateUsername('Ada')).toMatch(/3 to 24/);
    expect(validateUsername('ada_99')).toBe('');
  });
  it('email and password', () => {
    expect(validateEmail('nope')).toMatch(/valid/);
    expect(validateEmail('a@b.co')).toBe('');
    expect(validatePassword('12345')).toMatch(/6/);
    expect(validatePassword('123456')).toBe('');
  });
  it('password strength grows with variety and length', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('abc').label).toBe('Too short');
    expect(passwordStrength('abcdef').score).toBe(1);
    expect(passwordStrength('Abcdefghij1!').score).toBe(4);
  });
});

describe('helpers', () => {
  it('safeRedirect only allows in-app paths', () => {
    expect(safeRedirect({ pathname: '/notes', search: '?a=1' })).toBe('/notes?a=1');
    expect(safeRedirect('//evil.com')).toBe('/');
    expect(safeRedirect('https://evil.com')).toBe('/');
  });
  it('providersOf reads app_metadata', () => {
    expect(providersOf({ app_metadata: { providers: ['email', 'github'] } })).toEqual(['email', 'github']);
    expect(providersOf({ app_metadata: { provider: 'google' } })).toEqual(['google']);
    expect(providersOf(null)).toEqual([]);
  });
  it('urlAuthError reads query and hash', () => {
    expect(urlAuthError('?error=access_denied&error_description=Link+expired')).toBe('Link expired');
    expect(urlAuthError('', '#error=server_error')).toBe('server_error');
    expect(urlAuthError('?code=abc')).toBe('');
  });
});
