import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { saveUserProfile } from '../lib/profile';
import { setSessionUser, toPlainUser } from '../lib/session';

/**
 * AUTH CONTEXT: who is signed in, and the functions to sign in and out.
 *
 * Why Context and not Redux: the user is read by almost every component but changes rarely, and
 * nothing about it needs time travel or middleware. It is the classic "global, low-frequency" value.
 *
 * The context object is created once. Components do not use it directly: they call the custom
 * hook `useAuth()`, which also throws a helpful error if the provider is missing.
 */
const AuthContext = createContext(null);

const NOT_CONFIGURED = 'Firebase keys are required. Add them to .env (see .env.example).';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' until Firebase reports once, then 'authenticated' or 'unauthenticated'
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Listen to Firebase Auth for the lifetime of the app
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // No keys: nobody can be signed in, so show the sign-in page
      console.warn('Firebase is not configured. Copy .env.example to .env and add your keys.');
      setStatus('unauthenticated');
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const plain = toPlainUser(firebaseUser);
      setSessionUser(plain); // the bridge Redux thunks read (see lib/session.js)
      setUser(plain);
      setStatus(plain ? 'authenticated' : 'unauthenticated');
      if (firebaseUser) saveUserProfile(firebaseUser);
    });
    return () => {
      unsubscribe();
      setSessionUser(null);
    };
  }, []);

  // Runs a sign-in action. Resolves true on success, false on failure (the message is in `error`).
  const run = useCallback(async (action) => {
    if (!isFirebaseConfigured) {
      setError(NOT_CONFIGURED);
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(
    ({ email, password }) => run(() => signInWithEmailAndPassword(auth, email, password)),
    [run]
  );
  const signUp = useCallback(
    ({ email, password }) => run(() => createUserWithEmailAndPassword(auth, email, password)),
    [run]
  );
  const signInWithGoogle = useCallback(
    () =>
      run(async () => {
        const result = await signInWithPopup(auth, googleProvider);
        // The OAuth token is needed by the Google Calendar sync component
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) localStorage.setItem('googleAccessToken', credential.accessToken);
      }),
    [run]
  );
  const signOut = useCallback(() => firebaseSignOut(auth), []);
  const clearError = useCallback(() => setError(null), []);

  // useMemo: the value is a new object only when something in it really changed. Without it every
  // render of AuthProvider would hand all consumers a new object and re-render all of them.
  const value = useMemo(
    () => ({
      user,
      status,
      busy,
      error,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, status, busy, error, signIn, signUp, signInWithGoogle, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Custom hook: wraps useContext and fails loudly when used outside <AuthProvider> */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used inside an <AuthProvider>.');
  return context;
}
