import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** The one Supabase client. Only the public anon key is ever in the browser; RLS does the security. */
export function supabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (npm run env:local).',
    );
  }
  client ??= createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
