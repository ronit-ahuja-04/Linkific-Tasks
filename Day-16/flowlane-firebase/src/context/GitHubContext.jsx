import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { linkWithPopup, reauthenticateWithPopup, unlink as unlinkProvider } from 'firebase/auth';
import { auth, githubProvider } from '../lib/firebase';
import { clearGithubToken, getGithubToken, setGithubToken, subscribeGithubToken } from '../lib/githubToken';
import { GITHUB_PROVIDER_ID, hasGithubProvider, loginFromResult, mapGithubAuthError, tokenFromResult } from '../lib/githubAuth';
import { useAuth } from './AuthContext';

/**
 * GITHUB CONTEXT: "is GitHub connected?" for the whole app.
 *
 * Two different ideas, easy to mix up:
 *  - `linked`    GitHub is one of the user's SIGN-IN METHODS on their Firebase account (saved by Firebase).
 *  - `connected` this browser tab currently HOLDS a GitHub access token (memory only, see
 *                lib/githubToken.js). After a reload `linked` stays true but `connected` is false
 *                until the user presses Connect again (that re-runs the GitHub popup).
 */
const defaultValue = {
  connected: false,
  connecting: false,
  linked: false,
  githubLogin: null,
  error: null,
  connect: async () => false,
  unlink: async () => false,
  disconnect: () => {},
};
export const GitHubContext = createContext(defaultValue);

const hasToken = () => Boolean(getGithubToken());

export function GitHubProvider({ children }) {
  const { user, refreshUser } = useAuth();
  // An external store (the token lives outside React): React re-renders us when it changes.
  const connected = useSyncExternalStore(subscribeGithubToken, hasToken, () => false);
  const linked = hasGithubProvider(user);

  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  // The GitHub username is remembered together with the user it belongs to, so a different
  // user signing in on this tab never inherits it.
  const [loginInfo, setLoginInfo] = useState({ uid: null, login: null });
  const githubLogin = loginInfo.uid && loginInfo.uid === user?.uid ? loginInfo.login : null;

  // When the user signs out, forget the GitHub token: it must not outlive the session.
  const hadUser = useRef(false);
  useEffect(() => {
    if (hadUser.current && !user) clearGithubToken();
    hadUser.current = Boolean(user);
  }, [user]);

  // Tell AuthContext to re-read the Firebase user (providerIds change after link/unlink)
  const syncUser = useCallback(async () => {
    try {
      await refreshUser?.();
    } catch {
      /* best effort */
    }
  }, [refreshUser]);

  const connect = useCallback(async () => {
    setError(null);
    const current = auth?.currentUser;
    if (!current) {
      setError({ code: 'unknown', message: 'You are not signed in.' });
      return false;
    }
    setConnecting(true);
    try {
      // Linked already -> only re-prove it is us (reauthenticate) to get a fresh GitHub token.
      // Not linked -> attach GitHub to this account.
      const run = linked ? reauthenticateWithPopup : linkWithPopup;
      const result = await run(current, githubProvider);
      const token = tokenFromResult(result);
      if (!token) {
        setError({ code: 'unknown', message: 'GitHub did not return an access token.' });
        return false;
      }
      setGithubToken(token);
      setLoginInfo({ uid: current.uid ?? null, login: loginFromResult(result) });
      if (!linked) await syncUser();
      return true;
    } catch (err) {
      const mapped = mapGithubAuthError(err);
      if (mapped) setError(mapped); // null = the user closed the popup: stay quiet
      return false;
    } finally {
      setConnecting(false);
    }
  }, [linked, syncUser]);

  const unlink = useCallback(async () => {
    setError(null);
    const current = auth?.currentUser;
    if (!current) {
      setError({ code: 'unknown', message: 'You are not signed in.' });
      return false;
    }
    // Never remove the only way to sign in
    if ((user?.providerIds?.length ?? 0) <= 1) {
      setError({ code: 'last_provider', message: 'GitHub is your only sign-in method, so it cannot be unlinked.' });
      return false;
    }
    try {
      await unlinkProvider(current, GITHUB_PROVIDER_ID);
      clearGithubToken();
      setLoginInfo({ uid: null, login: null });
      await syncUser();
      return true;
    } catch (err) {
      setError(mapGithubAuthError(err) ?? { code: 'unknown', message: 'Could not unlink GitHub.' });
      return false;
    }
  }, [user, syncUser]);

  const disconnect = useCallback(() => clearGithubToken(), []);

  const value = useMemo(
    () => ({ connected, connecting, linked, githubLogin, error, connect, unlink, disconnect }),
    [connected, connecting, linked, githubLogin, error, connect, unlink, disconnect]
  );
  return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGitHub = () => useContext(GitHubContext);
