import { describe, expect, it } from 'vitest';
import { decodeJwt, secondsLeft } from '../../src/lib/jwt';

const b64url = (text) => {
  const bytes = new TextEncoder().encode(text);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const makeJwt = (claims) => `${b64url('{"alg":"HS256"}')}.${b64url(JSON.stringify(claims))}.sig`;

describe('decodeJwt', () => {
  it('decodes the payload of a valid token', () => {
    expect(decodeJwt(makeJwt({ sub: 'u1', role: 'admin', exp: 99 }))).toEqual({ sub: 'u1', role: 'admin', exp: 99 });
  });
  it('handles base64url without padding for every remainder length', () => {
    for (const name of ['a', 'ab', 'abc', 'abcd']) {
      expect(decodeJwt(makeJwt({ name }))?.name).toBe(name);
    }
  });
  it('handles - and _ characters from base64url', () => {
    const claims = { text: '???>>>~~~' };
    const token = makeJwt(claims);
    expect(decodeJwt(token)).toEqual(claims);
  });
  it('decodes unicode names', () => {
    expect(decodeJwt(makeJwt({ name: 'José 李雷 🚀' })).name).toBe('José 李雷 🚀');
  });
  it.each([[null], [undefined], [42], [''], ['abc'], ['a.b'], ['a.b.c.d'], ['a..c'], ['a.!!!.c']])('returns null for %s', (value) => {
    expect(decodeJwt(value)).toBeNull();
  });
  it('returns null when the payload is not a JSON object', () => {
    expect(decodeJwt(`h.${b64url('"text"')}.s`)).toBeNull();
    expect(decodeJwt(`h.${b64url('[1,2]')}.s`)).toBeNull();
    expect(decodeJwt(`h.${b64url('null')}.s`)).toBeNull();
    expect(decodeJwt(`h.${b64url('not json')}.s`)).toBeNull();
  });
});

describe('secondsLeft', () => {
  it('counts whole seconds until exp', () => {
    expect(secondsLeft({ exp: 1000 }, 940_500)).toBe(59);
  });
  it('never goes negative', () => {
    expect(secondsLeft({ exp: 10 }, 50_000)).toBe(0);
  });
  it('is 0 without claims or exp', () => {
    expect(secondsLeft(null, 0)).toBe(0);
    expect(secondsLeft({}, 0)).toBe(0);
    expect(secondsLeft({ exp: 'x' }, 0)).toBe(0);
  });
});
