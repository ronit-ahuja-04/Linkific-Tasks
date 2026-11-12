import { flushSync } from 'react-dom';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * THEME CONTEXT (light or dark), saved in localStorage. The same split-context idea as Day 12:
 * `mode` changes, the actions never do, so a component that only toggles never re-renders.
 * The toggle can grow the new theme out of the clicked button with the View Transitions API.
 */
const ThemeStateContext = createContext(null);
const ThemeActionsContext = createContext(null);
const STORAGE_KEY = 'datadesk-theme';

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
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function originOf(event) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  if (!rect) return null;
  return event.detail === 0 ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: event.clientX, y: event.clientY };
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStoredTheme);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light';
    setMode(value);
    storeTheme(value);
  }, []);

  const toggleTheme = useCallback(
    (event) => {
      const next = modeRef.current === 'dark' ? 'light' : 'dark';
      const origin = originOf(event);
      if (!origin || !document.startViewTransition || prefersReducedMotion()) {
        setTheme(next);
        return;
      }
      const radius = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          document.documentElement.setAttribute('data-theme', next);
          setTheme(next);
        });
      });
      transition.ready
        .then(() =>
          document.documentElement.animate(
            { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
            { duration: 550, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
          )
        )
        .catch(() => {});
    },
    [setTheme]
  );

  const state = useMemo(() => ({ mode, isDark: mode === 'dark' }), [mode]);
  const actions = useMemo(() => ({ toggleTheme, setTheme }), [toggleTheme, setTheme]);
  return (
    <ThemeStateContext.Provider value={state}>
      <ThemeActionsContext.Provider value={actions}>{children}</ThemeActionsContext.Provider>
    </ThemeStateContext.Provider>
  );
}

export function useThemeState() {
  const context = useContext(ThemeStateContext);
  if (context === null) throw new Error('useThemeState must be used inside a <ThemeProvider>.');
  return context;
}
export function useThemeActions() {
  const context = useContext(ThemeActionsContext);
  if (context === null) throw new Error('useThemeActions must be used inside a <ThemeProvider>.');
  return context;
}
