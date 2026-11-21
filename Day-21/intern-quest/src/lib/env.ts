/**
 * ENVIRONMENT CHECK. Run once at server start (src/instrumentation.ts) so a missing or weak setting fails with a
 * clear message in the logs, instead of a confusing error on some later request.
 *
 *   server-only   AUTH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MENTOR_INVITE_CODE, AUTH_GITHUB_ID/SECRET
 *   public        NEXT_PUBLIC_SITE_URL (inlined into the browser bundle at build time: never put a secret in one)
 *
 * A pure function over a plain object, so it is unit tested without touching the real environment.
 */
export interface EnvReport {
  errors: string[];
  warnings: string[];
}

type Env = Record<string, string | undefined>;

export function checkEnv(env: Env, mode: 'development' | 'production' | 'test' = 'development'): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const has = (name: string) => Boolean(env[name]?.trim());

  for (const name of ['AUTH_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!has(name)) errors.push(`${name} is not set.`);
  }
  if (has('AUTH_SECRET') && (env.AUTH_SECRET ?? '').length < 32) {
    (mode === 'production' ? errors : warnings).push('AUTH_SECRET is shorter than 32 characters: generate one with `npx auth secret` or `openssl rand -base64 32`.');
  }
  if (has('SUPABASE_URL') && !/^https?:\/\//.test(env.SUPABASE_URL ?? '')) errors.push('SUPABASE_URL must start with http:// or https://.');
  if (mode === 'production' && has('SUPABASE_URL') && /127\.0\.0\.1|localhost/.test(env.SUPABASE_URL ?? '')) {
    errors.push('SUPABASE_URL points at a local database in production.');
  }

  if (has('AUTH_GITHUB_ID') !== has('AUTH_GITHUB_SECRET')) warnings.push('Only one of AUTH_GITHUB_ID / AUTH_GITHUB_SECRET is set: GitHub sign-in stays off.');
  else if (!has('AUTH_GITHUB_ID')) warnings.push('AUTH_GITHUB_ID / AUTH_GITHUB_SECRET are not set: GitHub sign-in is off (email and password still work).');
  if (!has('MENTOR_INVITE_CODE')) warnings.push('MENTOR_INVITE_CODE is not set: nobody can become a mentor.');
  else if (mode === 'production' && env.MENTOR_INVITE_CODE === 'demo-mentor') errors.push('MENTOR_INVITE_CODE is still the demo value in production.');

  if (!has('NEXT_PUBLIC_SITE_URL')) {
    (mode === 'production' ? errors : warnings).push('NEXT_PUBLIC_SITE_URL is not set: canonical links and share cards would point at localhost.');
  }
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('NEXT_PUBLIC_') && /secret|key|password|token/i.test(name) && value) errors.push(`${name} looks like a secret but is public: NEXT_PUBLIC_ values are sent to every browser.`);
  }
  return { errors, warnings };
}

/**
 * The deployment environment: the live site, or anything else (a laptop, CI, a Vercel preview).
 * NODE_ENV only says how the code was built, so it is deliberately not used here.
 */
export function deploymentMode(env: Env): 'production' | 'development' | 'test' {
  if (env.VERCEL_ENV === 'production' || env.APP_ENV === 'production') return 'production';
  if (env.NODE_ENV === 'test') return 'test';
  return 'development';
}
