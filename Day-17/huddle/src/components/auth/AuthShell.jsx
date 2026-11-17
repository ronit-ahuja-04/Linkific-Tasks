import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/auth.css';

/** The card every sign-in page sits in: brand, title, subtitle and it sets the document title */
export default function AuthShell({ title, subtitle, children, footer }) {
  useEffect(() => {
    document.title = `${title} · Huddle`;
  }, [title]);
  return (
    <main className="auth-page">
      <div className="auth-card card">
        <Link to="/login" className="brand auth-brand">
          <span className="brand-mark" aria-hidden="true">H</span> Huddle
        </Link>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-sub muted">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </main>
  );
}
