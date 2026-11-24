import { describe, expect, it } from 'vitest';
import { checkEnv, deploymentMode } from '@/lib/env';

const good = {
  AUTH_SECRET: 'x'.repeat(44),
  SUPABASE_URL: 'https://abcd.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  MENTOR_INVITE_CODE: 'a-real-secret-code',
  AUTH_GITHUB_ID: 'id',
  AUTH_GITHUB_SECRET: 'secret',
  NEXT_PUBLIC_SITE_URL: 'https://intern-quest.vercel.app',
  CORS_ALLOWED_ORIGINS: 'http://localhost:4000', // Day 23: the public card API's allowlist
};

describe('checkEnv', () => {
  it('a complete production setup passes with no warnings', () => {
    expect(checkEnv(good, 'production')).toEqual({ errors: [], warnings: [] });
  });

  it('missing required values are errors, named one by one', () => {
    const { errors } = checkEnv({ ...good, AUTH_SECRET: '', SUPABASE_SERVICE_ROLE_KEY: undefined });
    expect(errors).toEqual(['AUTH_SECRET is not set.', 'SUPABASE_SERVICE_ROLE_KEY is not set.']);
  });

  it('is stricter in production: short secret, local database, demo mentor code, missing site URL', () => {
    const risky = { ...good, AUTH_SECRET: 'short', SUPABASE_URL: 'http://127.0.0.1:55421', MENTOR_INVITE_CODE: 'demo-mentor', NEXT_PUBLIC_SITE_URL: undefined };
    expect(checkEnv(risky, 'production').errors).toHaveLength(4);
    expect(checkEnv(risky, 'development').errors).toEqual([]); // fine on a laptop
    expect(checkEnv(risky, 'development').warnings.length).toBeGreaterThan(0);
  });

  it('optional features only warn: GitHub sign-in off, nobody can become a mentor', () => {
    const { errors, warnings } = checkEnv({ ...good, AUTH_GITHUB_ID: '', AUTH_GITHUB_SECRET: '', MENTOR_INVITE_CODE: '' }, 'production');
    expect(errors).toEqual([]);
    expect(warnings.join(' ')).toMatch(/GitHub sign-in is off/);
    expect(warnings.join(' ')).toMatch(/nobody can become a mentor/);
  });

  it('refuses a secret-looking value in a NEXT_PUBLIC_ variable (those reach every browser)', () => {
    expect(checkEnv({ ...good, NEXT_PUBLIC_SUPABASE_SERVICE_KEY: 'oops' }).errors.join(' ')).toMatch(/looks like a secret but is public/);
  });
});


describe('deploymentMode', () => {
  it('is production only for the live deployment, not for every optimised build', () => {
    expect(deploymentMode({ VERCEL_ENV: 'production', NODE_ENV: 'production' })).toBe('production');
    expect(deploymentMode({ APP_ENV: 'production' })).toBe('production');
    expect(deploymentMode({ VERCEL_ENV: 'preview', NODE_ENV: 'production' })).toBe('development');
    expect(deploymentMode({ NODE_ENV: 'production' })).toBe('development'); // `next start` on a laptop
    expect(deploymentMode({ NODE_ENV: 'test' })).toBe('test');
  });
});
