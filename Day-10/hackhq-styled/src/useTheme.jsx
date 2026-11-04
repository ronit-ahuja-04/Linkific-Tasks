import { useEffect, useState } from 'react';
import { lightTheme, darkTheme } from './theme';

const KEY = 'hackhq-theme';

export function useThemeMode() {
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return saved;
    } catch { /* storage unavailable */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  return { mode, toggle, theme: mode === 'light' ? lightTheme : darkTheme };
}
