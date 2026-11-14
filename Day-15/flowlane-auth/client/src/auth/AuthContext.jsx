import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import * as authApi from '../api/authApi';
import { refreshAccessToken, setAccessToken, setAuthFailureHandler } from '../api/http';
import { decodeJwt } from '../lib/jwt';

/**
 * AUTH CONTEXT: who is signed in, and keeping that true over time.
 *
 * - status 'loading' only while the first refresh runs. On a page reload the in-memory access
 *   token is gone, so we ask /auth/refresh (the HttpOnly cookie rides along). Success = still
 *   signed in; failure = anonymous (no scary message: the user simply was not logged in).
 * - A timer refreshes the access token silently shortly before it expires.
 * - If that refresh fails (session revoked, cookie expired) we log out with an "expired" notice.
 */
export const AuthContext = createContext(null);

const NETWORK_RETRY_MS = 5000;
const EXPIRED_NOTICE = { type: 'expired', message: 'Your session expired. Please sign in again.' };
const LOGGED_OUT_NOTICE = { type: 'logged_out', message: 'You have been signed out.' };
const REFRESH_LEAD_MS = 60_000;
const EMPTY_SESSION = { expiresAt: null, claims: null, refreshCount: 0 };
const INITIAL = { user: null, status: 'loading', session: EMPTY_SESSION, notice: null };

/** Reads the exp claim (with expiresIn as a fallback) into the session info */
function sessionFrom(result, previous, countRefresh, nowMs) {
  const claims = decodeJwt(result.accessToken);
  const expiresAt = claims?.exp ? claims.exp * 1000 : nowMs + (result.expiresIn ?? 0) * 1000;
  return { expiresAt, claims, refreshCount: previous.refreshCount + (countRefresh ? 1 : 0) };
}

function reducer(state, action) {
  switch (action.type) {
    case 'signed_in':
      return { ...state, user: action.result.user, status: 'authenticated', notice: null, session: sessionFrom(action.result, action.reset ? EMPTY_SESSION : state.session, action.countRefresh, action.nowMs) };
    case 'token_renewed':
      return { ...state, user: action.result.user ?? state.user, session: sessionFrom(action.result, state.session, true, action.nowMs) };
    case 'signed_out':
      return { user: null, status: 'anonymous', session: EMPTY_SESSION, notice: action.notice };
    case 'set_user':
      return { ...state, user: action.user };
    case 'clear_notice':
      return state.notice ? { ...state, notice: null } : state;
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const signOutLocally = useCallback((notice) => {
    setAccessToken(null);
    dispatch({ type: 'signed_out', notice });
  }, []);

  // 1. Startup refresh. Under StrictMode dev effects run twice; both runs call
  //    refreshAccessToken(), which is single-flight, so only ONE POST /auth/refresh is sent
  //    (two would rotate the token twice and look like token theft to the server).
  useEffect(() => {
    let ignore = false;
    refreshAccessToken().then(
      (result) => {
        if (!ignore) dispatch({ type: 'signed_in', result, reset: true, countRefresh: false, nowMs: Date.now() });
      },
      () => {
        if (!ignore) signOutLocally(null);
      }
    );
    return () => {
      ignore = true;
    };
  }, [signOutLocally]);

  // 2. The http layer reports a failed refresh (e.g. a 401 on a normal request): same auto-logout.
  useEffect(() => {
    setAuthFailureHandler(() => signOutLocally(EXPIRED_NOTICE));
    return () => setAuthFailureHandler(null);
  }, [signOutLocally]);

  // 3. Silent refresh timer: ~60 s before expiry, or at 80% of the token's life when it is shorter.
  const { expiresAt, claims, refreshCount } = state.session;
  useEffect(() => {
    if (state.status !== 'authenticated' || !expiresAt) return undefined;
    const lifeMs = claims?.iat ? (expiresAt - claims.iat * 1000) : null;
    const lead = lifeMs && lifeMs > 0 ? Math.min(REFRESH_LEAD_MS, lifeMs * 0.2) : REFRESH_LEAD_MS;
    const delay = Math.max(0, expiresAt - lead - Date.now());
    let ignore = false;
    let timer;
    const attempt = () => {
      refreshAccessToken().then(
        (result) => {
          if (!ignore) dispatch({ type: 'token_renewed', result, nowMs: Date.now() });
        },
        (error) => {
          if (ignore) return;
          // A dropped connection is not a reason to sign anyone out: the session is still valid on the
          // server. Try again shortly, for as long as the access token itself has not expired. Only a
          // real "your session is gone" answer (401 refresh_invalid) logs out.
          if (error?.code === 'network_error' && Date.now() < expiresAt) {
            timer = setTimeout(attempt, NETWORK_RETRY_MS);
            return;
          }
          signOutLocally(EXPIRED_NOTICE);
        }
      );
    };
    timer = setTimeout(attempt, delay);
    return () => {
      ignore = true;
      clearTimeout(timer); // cleaned on logout, unmount and after every renewal
    };
  }, [state.status, expiresAt, claims, refreshCount, signOutLocally]);

  const startSession = useCallback((result) => {
    setAccessToken(result.accessToken);
    dispatch({ type: 'signed_in', result, reset: true, countRefresh: false, nowMs: Date.now() });
    return result.user;
  }, []);

  const login = useCallback(async (credentials) => startSession(await authApi.login(credentials)), [startSession]);
  const register = useCallback(async (details) => startSession(await authApi.register(details)), [startSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server is unreachable we sign out locally: the user asked to leave.
    }
    signOutLocally(LOGGED_OUT_NOTICE);
  }, [signOutLocally]);

  const beginGithubLogin = useCallback(() => {
    // A full page navigation: the server redirects to GitHub, then back to /oauth/callback.
    window.location.assign('/api/auth/github');
  }, []);

  const completeOAuth = useCallback(async () => {
    // After the callback the server set the refresh cookie; trade it for an access token.
    const result = await refreshAccessToken();
    return startSession(result);
  }, [startSession]);

  const refreshNow = useCallback(async () => {
    try {
      const result = await refreshAccessToken();
      dispatch({ type: 'token_renewed', result, nowMs: Date.now() });
    } catch {
      signOutLocally(EXPIRED_NOTICE);
    }
  }, [signOutLocally]);

  const setUser = useCallback((user) => dispatch({ type: 'set_user', user }), []);
  const clearNotice = useCallback(() => dispatch({ type: 'clear_notice' }), []);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: state.status === 'authenticated',
      session: state.session,
      notice: state.notice,
      clearNotice,
      login,
      register,
      logout,
      beginGithubLogin,
      completeOAuth,
      refreshNow,
      setUser,
    }),
    [state, clearNotice, login, register, logout, beginGithubLogin, completeOAuth, refreshNow, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return value;
}
