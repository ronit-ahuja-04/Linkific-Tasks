import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * The one Supabase client, created on first use. It uses the SERVICE ROLE key, which bypasses Row Level Security,
 * so it must never reach a browser: `server-only` makes importing this file from a Client Component a build error.
 *
 * Failure policy (Day 23):
 *   - a DEADLINE on every database request (5 s, DB_TIMEOUT_MS): a database that never answers becomes an error
 *     the API turns into a 503, instead of a request that hangs until the platform kills it (inventory row S13).
 *   - NO RETRIES here (`db.retry: false`). postgrest-js retries reads up to 3 times (waits of 1, 2 and 4 s), which
 *     made a database outage take ~10 s to show. Retrying happens in ONE layer only: the browser's apiFetch retries
 *     reads, and error pages offer "Try again". Retries at two layers multiply (3 × 3 = 9 attempts).
 */
export const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS) > 0 ? Number(process.env.DB_TIMEOUT_MS) : 5000;

/** fetch with a deadline; a signal the caller passed still works */
export function withDeadline(fetchImpl: typeof fetch, ms: number): typeof fetch {
  return (input, init) => {
    const deadline = AbortSignal.timeout(ms);
    const signal = init?.signal ? AbortSignal.any([init.signal, deadline]) : deadline;
    return fetchImpl(input, { ...init, signal });
  };
}

let cached: SupabaseClient<Database> | null = null;
export function db(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (run `npm run env:local`).');
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { retry: false },
    global: { fetch: withDeadline(fetch, DB_TIMEOUT_MS) },
  });
  return cached;
}
