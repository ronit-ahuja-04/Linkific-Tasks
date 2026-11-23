import { Moon, Sun } from 'lucide-react';
import { useThemeActions, useThemeState } from '../context/ThemeContext';

/** The light/dark switch. Its name says what pressing it WILL do, so the state is never only an icon. */
export default function ThemeToggle({ className = 'icon-btn' }) {
  const { isDark } = useThemeState();
  const { toggleTheme } = useThemeActions();
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
