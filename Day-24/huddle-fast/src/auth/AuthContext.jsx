import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

/** Set when the app signs you out because the server no longer knows the session; the sign-in page explains it */
export const SESSION_ENDED_KEY = 'huddle-session-ended';
const RECHECK_EVERY_MS = 30_000;

const readEnded = () => {
  try {
    return sessionStorage.getItem(SESSION_ENDED_KEY) === '1';
  } catch {
    return false;
  }
};
const writeEnded = (ended) => {
  try {
    if (ended) sessionStorage.setItem(SESSION_ENDED_KEY, '1');
    else sessionStorage.removeItem(SESSION_ENDED_KEY);
  } catch {
    /* storage blocked: the note only lasts until a reload */
  }
};

/**
 * Has the server ended this session? Two shapes of "no": a 401/403 (a deleted user: user_not_found), and
 * supabase-js's AuthSessionMissingError, which it returns for session_not_found ("sign out of all devices")
 * after it has ALREADY removed the session itself. A network error (status 0) is not a "no".
 */
export const sessionEndedByServer = (error) =>
  Boolean(error) && ([401, 403].includes(error.status) || error.name === 'AuthSessionMissingError' || ['session_not_found', 'user_not_found'].includes(error.code));

/**
 * Ask the Auth SERVER whether this session, and its user, still exist. getSession() only reads the copy in
 * localStorage, and the access token in it stays valid for up to an hour after "sign out of all devices" or after
 * the account is deleted. If the server says no, note why (onEnded) and sign out here too.
 */
async function confirmSession(client, onEnded) {
  const { error } = await client.auth.getUser();
  if (!sessionEndedByServer(error)) return true;
  onEnded();
  await client.auth.signOut({ scope: 'local' });
  return false;
}

export function AuthProvider({ children, client = defaultClient }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(client ? 'loading' : 'anonymous');
  const [profile, setProfile] = useState(null);
  const [providers, setProviders] = useState({ github: false, google: false });
  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  // "the server ended your session": STATE, so the sign-in page shows it even if it is already on screen
  // (supabase-js may sign out, and the router move to /login, before getUser() even returns); kept in
  // sessionStorage for a reload, cleared on the next sign-in
  const [sessionEnded, setSessionEnded] = useState(readEnded);
  const markEnded = useCallback(() => {
    writeEnded(true);
    setSessionEnded(true);
  }, []);

  // 1. the current session, and every later change (sign in, sign out, token renewed, user updated)
  useEffect(() => {
    if (!client) return undefined;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'authenticated' : 'anonymous');
      // the stored copy can look fine for a session the server has ended: ask the server (see confirmSession)
      if (data.session) confirmSession(client, markEnded);
    });
    // NOTE: do not await other Supabase calls inside this callback (it can deadlock); just store the session
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      if (next) {
        writeEnded(false); // signed in again: the "you were signed out" note is done
        setSessionEnded(false);
      }
      setSession(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client, markEnded]);

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

  // 3. which OAuth buttons to show: the Auth server says what is switched on (GET /auth/v1/settings).
  // Day 24: asked only when the sign-in buttons are actually shown (OAuthButtons calls loadProviders), once. Before,
  // every page asked at start-up: with its CORS preflight, two requests in front of every page's own data.
  const providersAsked = useRef(false);
  const loadProviders = useCallback(() => {
    if (providersAsked.current || !supabaseUrl || !supabaseAnonKey || client !== defaultClient) return;
    providersAsked.current = true;
    fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings) => settings?.external && setProviders({ github: Boolean(settings.external.github), google: Boolean(settings.external.google) }))
      .catch(() => { providersAsked.current = false; });
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
  const recheckSession = useCallback(() => confirmSession(client, markEnded), [client, markEnded]);

  // 2. check again whenever you come back to the tab (at most every 30 s): an account deleted, or "sign out of all
  //    devices" pressed elsewhere, while this tab sat open is noticed then, not at the next reload
  const lastCheck = useRef(0);
  useEffect(() => {
    if (!client || status !== 'authenticated') return undefined;
    const onReturn = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck.current < RECHECK_EVERY_MS) return;
      lastCheck.current = Date.now();
      confirmSession(client, markEnded);
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [client, status, markEnded]);

  const value = useMemo(
    () => ({
      client, status, session, user, profile, providers, loadProviders, isAuthenticated: status === 'authenticated',
      refreshProfile, recheckSession, sessionEnded, signUp, signIn, signInWithMagicLink, signInWithProvider, resetPassword, updatePassword, signOut,
    }),
    [client, status, session, user, profile, providers, loadProviders, refreshProfile, recheckSession, sessionEnded, signUp, signIn, signInWithMagicLink, signInWithProvider, resetPassword, updatePassword, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return value;
}
