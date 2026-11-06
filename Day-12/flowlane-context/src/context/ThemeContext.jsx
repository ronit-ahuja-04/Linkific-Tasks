import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';

/**
 * THEME CONTEXT: light or dark.
 *
 * Two lessons live here:
 *
 * 1. CONTEXT COMPOSITION. ThemeProvider calls useAuth(), so it must sit inside AuthProvider. That
 *    is how it saves the theme on the signed-in user's profile and restores it after login.
 *
 * 2. SPLITTING A CONTEXT FOR PERFORMANCE. Context re-renders every consumer whenever its value
 *    changes. The theme has one changing value (`mode`) and a few functions that never change. If
 *    both lived in one context, a component that only needs the toggle button's *action* would
 *    still re-render on every theme change. So there are two contexts: state and actions. The
 *    actions are memoized once and never change, so components that only use them never re-render.
 */
const ThemeStateContext = createContext(null);
const ThemeActionsContext = createContext(null);

const STORAGE_KEY = 'theme';

const readStoredTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};
const storeTheme = (mode) => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage blocked: ignore */
  }
};

export function ThemeProvider({ children }) {
  const { user } = useAuth(); // composition: Theme needs Auth
  const uid = user?.uid;
  const [mode, setMode] = useState(readStoredTheme);

  // Refs let the stable action functions read the latest values without changing identity
  const modeRef = useRef(mode);
  const uidRef = useRef(uid);
  useEffect(() => {
    modeRef.current = mode;
    uidRef.current = uid;
  }, [mode, uid]);

  // The page itself follows the theme (the CSS reads data-theme on <html>), signed in or not
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // Follow the theme saved on the user's profile: applied after login, and live when it changes on
  // another device. Two details matter:
  //  - Right after sign-in the app is also writing the profile, so the first snapshot can be the
  //    half-written local copy (no theme yet). Snapshots with pending local writes are ignored, so
  //    only the server's confirmed version is applied. `includeMetadataChanges` is what delivers
  //    the follow-up snapshot when the pending write is confirmed.
  //  - Applying it only sets state and local storage. It never writes back, so there is no loop.
  useEffect(() => {
    if (!uid || !isFirebaseConfigured) return undefined;
    return onSnapshot(
      doc(db, 'users', uid),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.metadata.hasPendingWrites || !snap.exists()) return;
        const saved = snap.data().theme;
        if (saved === 'dark' || saved === 'light') {
          setMode(saved);
          storeTheme(saved);
        }
      },
      (err) => console.error('Failed to load saved theme', err)
    );
  }, [uid]);

  const setTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light';
    setMode(value);
    storeTheme(value);
    if (uidRef.current && isFirebaseConfigured) {
      updateDoc(doc(db, 'users', uidRef.current), { theme: value }).catch((err) =>
        console.error('Failed to save theme', err)
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(modeRef.current === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  // Both values are memoized. `actions` has no dependencies that ever change, so it is created once.
  const state = useMemo(() => ({ mode, isDark: mode === 'dark' }), [mode]);
  const actions = useMemo(() => ({ toggleTheme, setTheme }), [toggleTheme, setTheme]);

  return (
    <ThemeStateContext.Provider value={state}>
      <ThemeActionsContext.Provider value={actions}>{children}</ThemeActionsContext.Provider>
    </ThemeStateContext.Provider>
  );
}

/** Read-only: { mode, isDark }. Re-renders when the theme changes. */
export function useThemeState() {
  const context = useContext(ThemeStateContext);
  if (context === null) throw new Error('useThemeState must be used inside a <ThemeProvider>.');
  return context;
}

/** Actions only: { toggleTheme, setTheme }. Never re-renders when the theme changes. */
export function useThemeActions() {
  const context = useContext(ThemeActionsContext);
  if (context === null) throw new Error('useThemeActions must be used inside a <ThemeProvider>.');
  return context;
}

/** Everything in one: { mode, isDark, toggleTheme, setTheme } */
export function useTheme() {
  const state = useThemeState();
  const actions = useThemeActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}
