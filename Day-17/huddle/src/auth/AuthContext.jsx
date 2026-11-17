import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase as defaultClient, supabaseAnonKey, supabaseUrl } from '../lib/supabase';

/**
 * AUTH CONTEXT: who is signed in, and every way to sign in.
 *
 * Supabase Auth gives us a SESSION: { access_token (a JWT, 1 hour), refresh_token, user }. supabase-js stores it
 * in localStorage, renews it before it expires, and tells us about changes through onAuthStateChange. The access
 * token is what every database request carries, and what Row Level Security reads (auth.uid() is its `sub`).
 *
 * Every sign-in method returns Supabase's own `{ data, error }` so a page can show error.message.
 */
const AuthContext = createContext(null);
export { AuthContext };

export function AuthProvider({ children, client = defaultClient }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(client ? 'loading' : 'anonymous');
  const [profile, setProfile] = useState(null);
  const [providers, setProviders] = useState({ github: false, google: false });
  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  // 1. the current session, and every later change (sign in, sign out, token renewed, user updated)
  useEffect(() => {
    if (!client) return undefined;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'anonymous');
      // getSession() only READS the copy in localStorage. After "sign out of all devices" (or a deleted or banned
      // user) that copy can still look fine: its access token stays valid until it expires (up to an hour), only
      // the refresh token was revoked. getUser() asks the Auth SERVER, which checks the session still exists.
      if (data.session) {
        client.auth.getUser().then(({ error }) => {
          if (active && error && [401, 403].includes(error.status)) client.auth.signOut({ scope: 'local' });
        });
      }
    });
    // NOTE: do not await other Supabase calls inside this callback (it can deadlock); just store the session
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  // 2. the profile row (username, avatar...) of whoever is signed in. The state is set when the answer
  //    arrives, so a signed-out user's profile is cleared the same way (by the next answer or by `userId` being null).
  const loadProfile = useCallback(
    async (id) => {
      if (!client || !id) return null;
      const { data } = await client.from('profiles').select('*').eq('id', id).maybeSingle();
      return data ?? null;
    },
    [client]
  );
  useEffect(() => {
    let active = true;
    loadProfile(userId).then((row) => active && setProfile(row));
    return () => {
      active = false;
    };
  }, [loadProfile, userId]);
  const refreshProfile = useCallback(async () => setProfile(await loadProfile(userId)), [loadProfile, userId]);

  // 3. which OAuth buttons to show: the Auth server says what is switched on (GET /auth/v1/settings)
  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey || client !== defaultClient) return undefined;
    let active = true;
    fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => active && settings?.external && setProviders({ github: Boolean(settings.external.github), google: Boolean(settings.external.google) }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [client]);

  // ---- the ways in and out ---------------------------------------------------------------------------
  const signUp = useCallback(
    ({ email, password, username, fullName }) =>
      client.auth.signUp({
        email,
        password,
        // `data` is copied into raw_user_meta_data, which the handle_new_user trigger turns into the profile
        options: { data: { ...(username ? { username } : {}), ...(fullName ? { full_name: fullName } : {}) }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      }),
    [client]
  );
  const signIn = useCallback(({ email, password }) => client.auth.signInWithPassword({ email, password }), [client]);
  // Magic link: an email with a one-time link, no password. (shouldCreateUser: a new address creates an account.)
  const signInWithMagicLink = useCallback(
    (email) => client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: true } }),
    [client]
  );
  const signInWithProvider = useCallback(
    (provider) => client.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } }),
    [client]
  );
  const resetPassword = useCallback(
    (email) => client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset` }),
    [client]
  );
  const updatePassword = useCallback((password) => client.auth.updateUser({ password }), [client]);
  const signOut = useCallback(() => client.auth.signOut(), [client]);

  const value = useMemo(
    () => ({
      client, status, session, user, profile, providers, isAuthenticated: status === 'authenticated',
      refreshProfile, signUp, signIn, signInWithMagicLink, signInWithProvider, resetPassword, updatePassword, signOut,
    }),
    [client, status, session, user, profile, providers, refreshProfile, signUp, signIn, signInWithMagicLink, signInWithProvider, resetPassword, updatePassword, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return value;
}
