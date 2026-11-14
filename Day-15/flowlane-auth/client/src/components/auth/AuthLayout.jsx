import { Moon, Sun } from 'lucide-react';
import { useThemeActions, useThemeState } from '../../context/ThemeContext';
import '../../styles/auth.css';

// The centred card every auth page lives in: logo, h1, optional subtitle, content, footer links.
export default function AuthLayout({ title, subtitle, footer, children }) {
  const { isDark } = useThemeState();
  const { toggleTheme } = useThemeActions();
  return (
    <div className="auth-shell">
      <button type="button" className="icon-btn auth-theme" onClick={toggleTheme} aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>
        {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
      <main className="auth-main" id="main">
        <div className="auth-brand">
          <svg className="auth-logo" viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="var(--accent-strong)" />
            <text x="16" y="23" fontFamily="system-ui,sans-serif" fontSize="20" fontWeight="800" textAnchor="middle" fill="#fff">
              F
            </text>
          </svg>
          <span className="auth-brand-name">FlowLane</span>
        </div>
        <div className="card auth-card">
          <h1 className="auth-title">{title}</h1>
          {subtitle ? <p className="muted auth-subtitle">{subtitle}</p> : null}
          {children}
        </div>
        {footer ? <p className="auth-footer">{footer}</p> : null}
      </main>
    </div>
  );
}
