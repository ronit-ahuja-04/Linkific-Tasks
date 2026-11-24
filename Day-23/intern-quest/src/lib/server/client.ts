import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * The one Supabase client, created on first use. It uses the SERVICE ROLE key, which bypasses Row Level Security,
 * so it must never reach a browser: `server-only` makes importing this file from a Client Component a build error.
 */
let cached: SupabaseClient<Database> | null = null;
export function db(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (run `npm run env:local`).');
  cached = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
