import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, githubProvider, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { isSilentAuthError } from '../lib/authErrors';
import { clearGithubToken, setGithubToken } from '../lib/githubToken';
import { saveUserProfile } from '../lib/profile';
import { setSessionUser, toPlainUser } from '../lib/session';
import { setAuthFailureHandler } from '../api/client';

/**
 * AUTH CONTEXT: who is signed in, and the functions to sign in and out.
 *
 * Why Context and not Redux: the user is read by almost every component but changes rarely, and
 * nothing about it needs time travel or middleware. It is the classic "global, low-frequency" value.
 *
 * Day 15 adds the "session" side of authentication:
 *  - ID token: after sign-in Firebase holds a JWT (signed by Google, valid 1 hour). The SDK renews
 *    it by itself using a long-lived refresh token that this app never sees.
 *  - Remember me: persistence "local" keeps the session across browser restarts, "session" ends
 *    it when the tab closes.
 *  - Forced sign-out: if the refresh token is revoked or expires, Firebase reports "no user". We
 *    tell that apart from the user clicking "Sign out" so the sign-in page can explain why.
 *  - Idle timeout: no mouse, key or scroll for N minutes -> we sign the user out.
 */
const AuthContext = createContext(null);

const NOT_CONFIGURED = 'Firebase keys are required. Add them to .env (see .env.example).';
const DEFAULT_IDLE_MINUTES = Number(import.meta.env.VITE_IDLE_MINUTES) || 30;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll'];

/** What the Security page shows about the ID token. `token` is the raw JWT: never render it. */
function toTokenInfo(result) {
  const claims = result.claims ?? {};
  return {
    token: result.token,
    claims,
    issuedAt: Date.parse(result.issuedAtTime),
    expiresAt: Date.parse(result.expirationTime),
    authTime: Date.parse(result.authTime),
    signInProvider: result.signInProvider ?? claims.firebase?.sign_in_provider ?? null,
  };
}

export function AuthProvider({ children, idleMinutes = DEFAULT_IDLE_MINUTES }) {
  const [user, setUser] = useState(null);
  // 'loading' until Firebase reports once, then 'authenticated' or 'unauthenticated'.
  // Without Firebase keys nothing can ever report, so it starts signed out.
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unauthenticated');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [notice, setNotice] = useState(null);
  // True after the user pressed Sign out themselves (until the next sign-in). ProtectedRoute uses it so the
  // NEXT person to sign in on this browser is not sent to the page the previous user was on.
  const [signedOutByUser, setSignedOutByUser] = useState(false);

  // True while a sign-out WE started is running; lets the listener tell it from a forced one
  const ownSignOut = useRef(false);
  const wasAuthenticated = useRef(false);

  // Listen to Firebase Auth for the lifetime of the app
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // No keys: nobody can be signed in, so the sign-in page is shown (status starts as signed out)
      console.warn('Firebase is not configured. Copy .env.example to .env and add your keys.');
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const plain = toPlainUser(firebaseUser);
      setSessionUser(plain); // the bridge Redux thunks read (see lib/session.js)
      setUser(plain);
      if (plain) setSignedOutByUser(false);
      setStatus(plain ? 'authenticated' : 'unauthenticated');
      if (firebaseUser) {
        wasAuthenticated.current = true;
        setNotice(null);
        saveUserProfile(firebaseUser);
      } else {
        // Signed out. If we did not ask for it, the session was revoked or expired.
        if (wasAuthenticated.current && !ownSignOut.current) setNotice((n) => n ?? { type: 'expired' });
        wasAuthenticated.current = false;
        ownSignOut.current = false;
        clearGithubToken(); // the GitHub token belongs to the session that is gone
      }
    });
    return () => {
      unsubscribe();
      setSessionUser(null);
    };
  }, []);

  // Runs a sign-in action. Resolves true on success, false on failure (the message is in `error`).
  // `remember` (when given) picks where Firebase keeps the session BEFORE the sign-in happens.
  const run = useCallback(async (action, remember) => {
    if (!isFirebaseConfigured) {
      setError(NOT_CONFIGURED);
      setErrorCode('flowlane/not-configured');
      return false;
    }
    setBusy(true);
    setError(null);
    setErrorCode(null);
    try {
      if (remember !== undefined) {
        // "Remember me": keep the session across browser restarts (IndexedDB, which is Firebase's own default for a
        // lasting session) or only until this tab closes (sessionStorage).
        // NOT browserLocalPersistence: that one uses localStorage, and a second tab starts with the IndexedDB default,
        // migrates the user from localStorage to IndexedDB and so signs the FIRST tab out (found by a browser test).
        await setPersistence(auth, remember ? indexedDBLocalPersistence : browserSessionPersistence);
      }
      await action();
      return true;
    } catch (err) {
      if (!isSilentAuthError(err?.code)) {
        setErrorCode(err?.code ?? null);
        // This one has a ready translation key (see lib/authErrors.js); other errors keep Firebase's text
        setError(
          err?.code === 'auth/account-exists-with-different-credential'
            ? 'account.error.accountExists'
            : err?.message || 'Authentication failed'
        );
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(
    ({ email, password, remember = true }) =>
      run(() => signInWithEmailAndPassword(auth, email, password), remember),
    [run]
  );
  const signUp = useCallback(
    ({ email, password, remember = true }) =>
      run(async () => {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Best effort: the account exists already, so a failed email must not fail the sign-up
        try {
          if (credential?.user) await sendEmailVerification(credential.user);
        } catch {
          /* the banner offers "Resend email" */
        }
      }, remember),
    [run]
  );
  const signInWithGoogle = useCallback(
    ({ remember = true } = {}) =>
      run(async () => {
        const result = await signInWithPopup(auth, googleProvider);
        // The OAuth token is needed by the Google Calendar sync component
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) localStorage.setItem('googleAccessToken', credential.accessToken);
      }, remember),
    [run]
  );
  const signInWithGithub = useCallback(
    ({ remember = true } = {}) =>
      run(async () => {
        const result = await signInWithPopup(auth, githubProvider);
        // The GitHub access token (OAuth) is what lets us call the GitHub API as the user. It is
        // kept in MEMORY only, never in storage (see lib/githubToken.js).
        setGithubToken(GithubAuthProvider.credentialFromResult(result)?.accessToken);
      }, remember),
    [run]
  );

  const signOut = useCallback(async () => {
    ownSignOut.current = true;
    setSignedOutByUser(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      // The listener resets the flag too; this covers a sign-out that never produced an event
      setTimeout(() => {
        ownSignOut.current = false;
      }, 0);
    }
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    if (!isFirebaseConfigured) {
      setError(NOT_CONFIGURED);
      setErrorCode('flowlane/not-configured');
      return false;
    }
    setBusy(true);
    setError(null);
    setErrorCode(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      // Never reveal whether an email has an account: "no such user" looks like success
      if (err?.code === 'auth/user-not-found') return true;
      setErrorCode(err?.code ?? null);
      setError(err?.message || 'Could not send the email');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const resendVerification = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return false;
    try {
      await sendEmailVerification(current);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Firebase caches the user. After the person clicks the link in the email, reload() fetches the
  // fresh record so emailVerified flips. Resolves to the new plain user.
  const refreshUser = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return null;
    await current.reload();
    const plain = toPlainUser(auth.currentUser);
    setSessionUser(plain);
    setUser(plain);
    return plain;
  }, []);

  const getTokenInfo = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return null;
    return toTokenInfo(await current.getIdTokenResult());
  }, []);
  // forceRefresh=true makes the SDK use the refresh token to get a brand new ID token now
  const refreshToken = useCallback(async () => {
    const current = auth?.currentUser;
    if (!current) return null;
    return toTokenInfo(await current.getIdTokenResult(true));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);
  const clearNotice = useCallback(() => setNotice(null), []);

  // The API client calls this when a request still gets 401 after one token refresh: the session
  // is not valid anymore, so we sign out and the Auth page explains why.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setNotice({ type: 'expired' });
      signOut().catch(() => {});
    });
    return () => setAuthFailureHandler(() => {});
  }, [signOut]);

  // INACTIVITY AUTO-LOGOUT. The timer only exists while signed in. Any pointer, key or scroll
  // restarts it; when it finally fires we sign out and remember why.
  const isAuthenticated = Boolean(user);
  useEffect(() => {
    if (!isAuthenticated || !(idleMinutes > 0)) return undefined;
    let timer;
    const expire = () => {
      setNotice({ type: 'idle' });
      signOut().catch(() => {});
    };
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(expire, idleMinutes * 60 * 1000);
    };
    restart();
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, restart, { passive: true, capture: true }));
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, restart, { capture: true }));
    };
  }, [isAuthenticated, idleMinutes, signOut]);

  // useMemo: the value is a new object only when something in it really changed. Without it every
  // render of AuthProvider would hand all consumers a new object and re-render all of them.
  const value = useMemo(
    () => ({
      user,
      status,
      busy,
      error,
      errorCode,
      notice,
      signedOutByUser,
      isAuthenticated,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithGithub,
      signOut,
      sendPasswordReset,
      resendVerification,
      refreshUser,
      getTokenInfo,
      refreshToken,
      clearError,
      clearNotice,
    }),
    [
      user, status, busy, error, errorCode, notice, signedOutByUser, isAuthenticated,
      signIn, signUp, signInWithGoogle, signInWithGithub, signOut, sendPasswordReset,
      resendVerification, refreshUser, getTokenInfo, refreshToken, clearError, clearNotice,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Custom hook: wraps useContext and fails loudly when used outside <AuthProvider> */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return context;
}
