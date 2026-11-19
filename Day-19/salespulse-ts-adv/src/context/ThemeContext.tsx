import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createStrictContext } from '../lib/createStrictContext';

/**
 * THEME CONTEXT (light or dark), saved in localStorage. The same split-context idea as Day 12:
 * `mode` changes, the actions never do, so a component that only toggles never re-renders.
 * The toggle can grow the new theme out of the clicked button with the View Transitions API.
 */
export type ThemeMode = 'light' | 'dark';
export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
}
export interface ThemeActions {
  /** flip the theme; given a click event, the new theme grows out of the clicked button */
  toggleTheme: (event?: MouseEvent<HTMLElement>) => void;
  setTheme: (next: string) => void;
}

const [ThemeStateContext, useThemeState] = createStrictContext<ThemeState>('useThemeState', 'ThemeProvider');
const [ThemeActionsContext, useThemeActions] = createStrictContext<ThemeActions>('useThemeActions', 'ThemeProvider');
export { useThemeActions, useThemeState };
const STORAGE_KEY = 'salespulse-theme';

const readStoredTheme = (): ThemeMode => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};
const storeTheme = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage blocked: ignore */
  }
};
const prefersReducedMotion = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function originOf(event?: MouseEvent<HTMLElement>): { x: number; y: number } | null {
  if (!event) return null;
  const rect = event.currentTarget.getBoundingClientRect();
  if (!rect) return null;
  return event.detail === 0 ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: event.clientX, y: event.clientY };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredTheme);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setTheme = useCallback((next: string) => {
    const value: ThemeMode = next === 'dark' ? 'dark' : 'light';
    setMode(value);
    storeTheme(value);
  }, []);

  const toggleTheme = useCallback(
    (event?: MouseEvent<HTMLElement>) => {
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

  const state = useMemo((): ThemeState => ({ mode, isDark: mode === 'dark' }), [mode]);
  const actions = useMemo((): ThemeActions => ({ toggleTheme, setTheme }), [toggleTheme, setTheme]);
  return (
    <ThemeStateContext.Provider value={state}>
      <ThemeActionsContext.Provider value={actions}>{children}</ThemeActionsContext.Provider>
    </ThemeStateContext.Provider>
  );
}
