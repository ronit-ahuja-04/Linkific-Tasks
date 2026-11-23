import { createClient } from '@supabase/supabase-js';

/**
 * THE SUPABASE CLIENT: one object that talks to every Supabase service.
 *
 *   supabase.auth       sign up, sign in, sessions            (GoTrue)
 *   supabase.from()     tables: select / insert / update / delete   (PostgREST turns these into SQL)
 *   supabase.rpc()      call a database function
 *   supabase.channel()  Realtime: row changes, Broadcast, Presence
 *   supabase.storage    buckets and files
 *
 * The URL and the "anon" key are PUBLIC: they ship to every browser. What an anonymous or signed-in user can
 * actually do is decided by Row Level Security policies in the database (supabase/migrations), never by hiding
 * this key. The secret / service_role key must never be used in a browser app.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabaseUrl = url;
export const supabaseAnonKey = anonKey;

// Without keys nothing can work, but the app should still load and say why (like FlowLane did for Firebase)
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,       // keep the session in localStorage so a reload stays signed in
        autoRefreshToken: true,     // renew the access token before it expires
        detectSessionInUrl: true,   // finish magic-link / OAuth sign-ins that return with ?code= in the URL
      },
    })
  : null;
