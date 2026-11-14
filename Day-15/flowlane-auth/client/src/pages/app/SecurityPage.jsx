import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { listSessions, resendVerification, revokeSession } from '../../api/authApi';
import { formatCountdown, formatDate, formatUnix, shortUserAgent } from '../../components/app/format';
import '../../styles/app.css';

const CLAIMS = ['sub', 'role', 'email', 'sid', 'iss', 'aud'];

// "Session inspector": shows how the auth system works using the user's own session.
export default function SecurityPage() {
  const auth = useAuth();
  const { user, session } = auth;
  const toast = useToast();

  // `now` lives in state and is advanced by an interval: reading the clock during render would be impure.
  const [now, setNow] = useState(() => Date.now());
  const [sessions, setSessions] = useState(null);
  const [sessionsError, setSessionsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmId, setConfirmId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    document.title = 'Security · FlowLane';
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSessions().then(
      (list) => {
        if (cancelled) return;
        setSessions(list);
        setSessionsError('');
      },
      (error) => {
        if (cancelled) return;
        setSessionsError((error && error.message) || 'Could not load your sessions.');
        setSessions([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const claims = session?.claims ?? null;
  const expiresAt = session?.expiresAt ?? (claims?.exp ? claims.exp * 1000 : null);
  const secondsLeft = expiresAt ? (expiresAt - now) / 1000 : null;

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await auth.refreshNow();
      setNow(Date.now());
      toast.success('Access token refreshed');
      setAnnouncement('Access token refreshed');
    } catch (error) {
      toast.error((error && error.message) || 'Could not refresh the session.');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRevoke(item) {
    try {
      await revokeSession(item.id);
      setSessions((prev) => prev.filter((s) => s.id !== item.id));
      setConfirmId(null);
      toast.success('Session signed out');
      setAnnouncement('Session signed out');
    } catch (error) {
      toast.error((error && error.message) || 'Could not sign out that session.');
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendVerification();
      toast.success('Verification email sent. Check your inbox.');
    } catch (error) {
      toast.error((error && error.message) || 'Could not send the email. Try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Session inspector</h1>
        <p className="muted">See how your sign-in works behind the scenes.</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <div className="security-grid">
        <section className="card" aria-labelledby="your-session">
          <h2 id="your-session">Your session</h2>
          {claims ? (
            <dl className="claims">
              {CLAIMS.map((key) => (
                <div key={key} style={{ display: 'contents' }}>
                  <dt>{key}</dt>
                  <dd>{String(claims[key] ?? '-')}</dd>
                </div>
              ))}
              <dt>iat</dt>
              <dd>{formatUnix(claims.iat)}</dd>
              <dt>exp</dt>
              <dd>{formatUnix(claims.exp)}</dd>
            </dl>
          ) : (
            <p className="muted">No access token claims available.</p>
          )}
          {secondsLeft !== null && (
            <p className="countdown">Access token expires in {formatCountdown(secondsLeft)}</p>
          )}
          <p>Silent refreshes so far: <strong>{session?.refreshCount ?? 0}</strong></p>
          <p style={{ margin: '12px 0' }}>
            <button type="button" className="btn" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh now'}
            </button>
          </p>
          <p className="alert alert-info">
            <span>
              The access token lives only in this page&apos;s memory, so it is never shown here and disappears on reload. The refresh
              token is an HttpOnly cookie that JavaScript cannot read, which is what keeps you signed in after a reload.
            </span>
          </p>
        </section>

        <section className="card" aria-labelledby="active-sessions">
          <h2 id="active-sessions">Active sessions</h2>
          {sessions === null && <p className="state-box" role="status">Loading sessions…</p>}
          {sessionsError && (
            <div className="state-box" role="alert">
              <p>{sessionsError}</p>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSessions(null);
                  setReloadKey((k) => k + 1);
                }}
              >
                Retry
              </button>
            </div>
          )}
          {sessions !== null && !sessionsError && sessions.length === 0 && <p className="muted">No active sessions.</p>}
          {sessions !== null && sessions.length > 0 && (
            <ul className="session-list">
              {sessions.map((item) => (
                <li key={item.id} className="session-item">
                  <div className="session-meta">
                    <span>
                      <strong>{shortUserAgent(item.userAgent)}</strong>{' '}
                      {item.current && <span className="badge">This device</span>}
                    </span>
                    <span className="muted">Created {formatDate(item.createdAt)}</span>
                    <span className="muted">Last used {formatDate(item.lastUsedAt)}</span>
                    <span className="muted">{item.remember ? 'Remembered (30 days)' : 'Not remembered (ends with the browser)'}</span>
                  </div>
                  {!item.current &&
                    (confirmId === item.id ? (
                      <span className="confirm-row">
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRevoke(item)}>
                          Confirm sign out
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => setConfirmId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <button type="button" className="btn btn-sm" onClick={() => setConfirmId(item.id)}>Sign out</button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="email-card">
          <h2 id="email-card">Email</h2>
          <p>
            {user?.email}{' '}
            <span className="badge">{user?.emailVerified ? 'Verified' : 'Not verified'}</span>
          </p>
          {!user?.emailVerified && (
            <p style={{ marginTop: 12 }}>
              <button type="button" className="btn" onClick={handleResend} disabled={resending}>
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="how-it-works">
          <h2 id="how-it-works">How this works</h2>
          <ul className="how-list">
            <li><strong>Access token:</strong> a short-lived signed JWT sent with every API request. It is kept in memory only.</li>
            <li><strong>Refresh token rotation:</strong> each refresh gives a new refresh token and retires the old one. Reusing an old one signals theft and ends the whole session.</li>
            <li><strong>Remember me:</strong> keeps the refresh cookie for 30 days. Without it the cookie disappears when the browser closes.</li>
            <li><strong>Auto-logout:</strong> if the silent refresh fails (expired or revoked session), you are signed out and sent to the login page.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
