import { Link } from 'react-router-dom';
import { STAT_TILES, DEMONSTRATES } from '../../lib/dashboard';
import { formatBytes } from '../../lib/files';

export function StatTiles({ stats, error }) {
  if (error) return <p className="alert alert-error" role="alert">Could not load the numbers: {error}</p>;
  return (
    <ul className="dash-tiles" aria-label="Workspace numbers">
      {STAT_TILES.map((t) => (
        <li key={t.key}>
          <Link className="card dash-tile" to={t.to}>
            <span className="dash-tile-value" data-testid={`stat-${t.key}`}>{stats ? Number(stats[t.key] ?? 0) : '...'}</span>
            <span className="dash-tile-label">{t.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A titled card with the three list states every list needs: loading, error, empty */
export function Panel({ id, title, to, linkText, state, error, empty, count = 0, children }) {
  return (
    <section className="card dash-panel" aria-labelledby={id}>
      <div className="dash-panel-head">
        <h2 id={id} className="dash-h2">{title}</h2>
        <Link to={to}>{linkText}</Link>
      </div>
      {state === 'loading' && <p role="status" className="muted">Loading...</p>}
      {state === 'error' && <p className="alert alert-error" role="alert">{error}</p>}
      {state === 'ready' && count === 0 && <p className="muted">{empty}</p>}
      {state === 'ready' && count > 0 && children}
    </section>
  );
}

export function TeamNotes({ notes }) {
  if (!notes.length) return null;
  return (
    <ul className="dash-list">
      {notes.map((n) => (
        <li key={n.id}>
          <Link to="/notes">{n.title}</Link>
          <span className="muted"> by {n.author?.username ?? 'someone'} · {new Date(n.updated_at).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}

export function RecentFiles({ files }) {
  if (!files.length) return null;
  return (
    <ul className="dash-list">
      {files.map((f) => (
        <li key={f.id}>
          <Link to="/files">{f.name}</Link>
          <span className="muted"> {formatBytes(f.size)}</span>
        </li>
      ))}
    </ul>
  );
}

export function MyRooms({ rooms }) {
  if (!rooms.length) return null;
  return (
    <ul className="dash-list">
      {rooms.map((r) => (
        <li key={r.id} className="dash-room">
          <Link to={`/chat/${r.id}`}>{r.isPrivate ? 'Private: ' : '# '}{r.name}</Link>
          {r.unread > 0 && <span className="badge dash-unread">{r.unread} unread</span>}
        </li>
      ))}
    </ul>
  );
}

export function Demonstrates() {
  return (
    <section className="card dash-panel" aria-labelledby="dash-demo-title">
      <h2 id="dash-demo-title" className="dash-h2">What this app demonstrates</h2>
      <ul className="dash-demo">
        {DEMONSTRATES.map((d) => (
          <li key={d.page}>
            <Link to={d.to}>{d.page}</Link>: <strong>{d.feature}</strong>. {d.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
