import { describe, expect, it } from 'vitest';
import { ALLOWED_HEADERS, ALLOWED_METHODS, corsFor, isCrossSiteWrite, MAX_AGE_SECONDS, parseAllowlist } from '@/lib/cors';
import { checkEnv } from '@/lib/env';

const list = parseAllowlist('http://localhost:4000, https://ronit.example');
const card = '/api/public/characters/ronit';

describe('parseAllowlist', () => {
  it('keeps exact origins, tolerating spaces and a trailing slash', () => {
    expect([...parseAllowlist(' http://localhost:4000/ ,https://a.example ').origins]).toEqual(['http://localhost:4000', 'https://a.example']);
  });

  it('rejects `*`, "null", paths, other schemes and junk instead of guessing', () => {
    const { origins, rejected } = parseAllowlist('*, null, https://a.example/path, ftp://a.example, not a url');
    expect(origins.size).toBe(0);
    expect(rejected).toHaveLength(5);
  });

  it('nothing set: an empty list', () => expect(parseAllowlist(undefined).origins.size).toBe(0));
});

describe('corsFor', () => {
  it('routes outside /api/public get no CORS headers at all: the signed-in API stays same-origin only', () => {
    expect(corsFor('/api/quests', 'GET', 'http://localhost:4000', list)).toEqual({ kind: 'none' });
    expect(corsFor('/api/quests', 'OPTIONS', 'http://localhost:4000', list)).toEqual({ kind: 'none' });
    expect(corsFor('/c/ronit', 'GET', 'http://localhost:4000', list)).toEqual({ kind: 'none' });
  });

  it('an allowed origin: its own origin echoed (never *), Vary: Origin, the request id exposed, no credentials', () => {
    const decision = corsFor(card, 'GET', 'http://localhost:4000', list);
    expect(decision).toEqual({ kind: 'request', headers: { Vary: 'Origin', 'Access-Control-Allow-Origin': 'http://localhost:4000', 'Access-Control-Expose-Headers': 'X-Request-Id' } });
    expect(JSON.stringify(decision)).not.toContain('Credentials');
  });

  it('another origin: still answered (public data), but without Allow-Origin, so its page can not read it', () => {
    expect(corsFor(card, 'GET', 'http://127.0.0.1:4000', list)).toEqual({ kind: 'request', headers: { Vary: 'Origin' } });
  });

  it('no Origin header (same-origin GET, curl, a server): nothing to allow, Vary still set for caches', () => {
    expect(corsFor(card, 'GET', null, list)).toEqual({ kind: 'request', headers: { Vary: 'Origin' } });
  });

  it('origins are compared exactly: scheme, host and port all count', () => {
    for (const near of ['https://localhost:4000', 'http://localhost:4001', 'http://LOCALHOST:4000', 'http://localhost:4000.evil.example']) {
      expect(corsFor(card, 'GET', near, list)).toEqual({ kind: 'request', headers: { Vary: 'Origin' } });
    }
  });

  it('a preflight from an allowed origin: 204 with methods, headers and Max-Age', () => {
    expect(corsFor(card, 'OPTIONS', 'https://ronit.example', list)).toEqual({
      kind: 'preflight', status: 204,
      headers: {
        Vary: 'Origin', 'Access-Control-Allow-Origin': 'https://ronit.example', 'Access-Control-Expose-Headers': 'X-Request-Id',
        'Access-Control-Allow-Methods': ALLOWED_METHODS, 'Access-Control-Allow-Headers': ALLOWED_HEADERS, 'Access-Control-Max-Age': String(MAX_AGE_SECONDS),
      },
    });
  });

  it('a preflight from any other origin (or none): 403, nothing allowed', () => {
    expect(corsFor(card, 'OPTIONS', 'https://evil.example', list)).toEqual({ kind: 'preflight', status: 403, headers: { Vary: 'Origin' } });
    expect(corsFor(card, 'OPTIONS', null, list)).toEqual({ kind: 'preflight', status: 403, headers: { Vary: 'Origin' } });
  });
});

describe('checkEnv: CORS_ALLOWED_ORIGINS', () => {
  const base = { AUTH_SECRET: 'x'.repeat(40), SUPABASE_URL: 'http://127.0.0.1:55421', SUPABASE_SERVICE_ROLE_KEY: 'k', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', MENTOR_INVITE_CODE: 'm' };

  it('a valid list: no error, no CORS warning', () => {
    const report = checkEnv({ ...base, CORS_ALLOWED_ORIGINS: 'http://localhost:4000' });
    expect(report.errors).toEqual([]);
    expect(report.warnings.some((w) => w.includes('CORS'))).toBe(false);
  });

  it('`*` or a malformed entry stops the start, in every environment', () => {
    expect(checkEnv({ ...base, CORS_ALLOWED_ORIGINS: '*' }).errors).toEqual(['CORS_ALLOWED_ORIGINS: * (list exact origins instead).']);
    expect(checkEnv({ ...base, CORS_ALLOWED_ORIGINS: 'https://a.example/x' }, 'production').errors.some((e) => e.startsWith('CORS_ALLOWED_ORIGINS: https://a.example/x'))).toBe(true);
  });

  it('not set: a warning only (the app itself does not need it)', () => {
    expect(checkEnv(base).warnings).toContain('CORS_ALLOWED_ORIGINS is not set: no other site can read /api/public (this app itself is not affected).');
  });
});

describe('isCrossSiteWrite: CORS hides answers, this stops forged writes', () => {
  const own = 'http://localhost:3000';
  it('refuses an API write from another origin, even an allowed CORS origin and even a "simple" POST', () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) expect(isCrossSiteWrite('/api/quests', method, 'http://localhost:4000', own)).toBe(true);
    expect(isCrossSiteWrite('/api/public/characters/ronit', 'POST', 'http://localhost:4000', own)).toBe(true);
  });
  it('lets through: our own origin, reads, non-browser clients (no Origin), and NextAuth (its own CSRF token)', () => {
    expect(isCrossSiteWrite('/api/quests', 'POST', own, own)).toBe(false);
    expect(isCrossSiteWrite('/api/quests', 'GET', 'http://localhost:4000', own)).toBe(false);
    expect(isCrossSiteWrite('/api/quests', 'POST', null, own)).toBe(false);
    expect(isCrossSiteWrite('/api/auth/signout', 'POST', 'http://localhost:4000', own)).toBe(false);
    expect(isCrossSiteWrite('/journal', 'POST', 'http://localhost:4000', own)).toBe(false); // server actions: Next checks those itself
  });
});
