import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, MessagesSquare, NotebookPen } from 'lucide-react';
import '../../styles/auth.css';

const POINTS = [
  [MessagesSquare, 'Rooms that update live, with @mentions'],
  [NotebookPen, 'Notes you keep private or share with the team'],
  [FolderOpen, 'Files with links that expire on their own'],
];

/**
 * Every sign-in page: a Z-shaped layout on wide screens. The eye starts at the brand (top left), reads what
 * Huddle is (left), and ends on the form and its button (right), which is where the page wants it to end.
 * On a phone the pitch shrinks to one line above the form. The pitch is a paragraph, not a heading, so the
 * form's h1 stays the first heading on the page. It also sets the document title.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  useEffect(() => {
    document.title = `${title} · Huddle`;
  }, [title]);
  return (
    <main className="auth-page">
      <div className="auth-hero">
        <Link to="/login" className="brand auth-brand">
          <span className="brand-mark" aria-hidden="true">H</span> Huddle
        </Link>
        <p className="auth-pitch">Your team&rsquo;s chat, notes and files, in one calm place.</p>
        <ul className="auth-points">
          {POINTS.map(([Icon, text]) => (
            <li key={text}><Icon size={18} aria-hidden="true" />{text}</li>
          ))}
        </ul>
        <p className="auth-stack">Built on Supabase: Postgres, Row Level Security, Realtime and Storage.</p>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
