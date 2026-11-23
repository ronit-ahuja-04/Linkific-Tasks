import { Link } from 'react-router-dom';
import { AtSign, CircleCheck, FileText, FolderOpen, Hash, Lock, MessageSquarePlus, NotebookPen, Upload } from 'lucide-react';
import { STAT_TILES, DEMONSTRATES, displayName } from '../../lib/dashboard';
import { formatBytes } from '../../lib/files';
import CountBadge from '../ui/CountBadge';
import EmptyState from '../ui/EmptyState';
import RelativeTime from '../ui/RelativeTime';
import UnderTheHood from '../ui/UnderTheHood';

/** Three grey lines while a list loads; screen readers hear "Loading..." once */
function Loading() {
  return (
    <div className="dash-loading">
      <p role="status" className="sr-only">Loading...</p>
      {[70, 55, 62].map((w) => <span key={w} className="skeleton" style={{ width: `${w}%` }} aria-hidden="true" />)}
    </div>
  );
}

/** A card with a title, a "see all" link and the three states every list needs: loading, error, empty */
export function Panel({ id, title, to, linkText, state, error, empty, count = 0, children }) {
  return (
    <section className="card dash-panel" aria-labelledby={id}>
      <div className="card-header">
        <h2 id={id} className="card-title">{title}</h2>
        {to ? <Link to={to} className="dash-view-all">{linkText}</Link> : null}
      </div>
      {state === 'loading' && <Loading />}
      {state === 'error' && <p className="alert alert-error" role="alert">{error}</p>}
      {state === 'ready' && count === 0 && empty}
      {state === 'ready' && count > 0 && children}
    </section>
  );
}

/** One row: an icon, a title that is the link (it stretches over the whole row), a line of detail, a time */
function Row({ icon, tone, to, title, meta, time }) {
  return (
    <li className="row">
      <span className="row-icon" data-tone={tone} aria-hidden="true">{icon}</span>
      <span className="row-main">
        <Link to={to} className="row-link">{title}</Link>
        {meta ? <span className="row-meta">{meta}</span> : null}
      </span>
      {time ? <RelativeTime className="row-end" date={time} /> : null}
    </li>
  );
}

/**
 * NEEDS YOU: the first thing the eye lands on (top left, F-pattern). Unread @mentions first (amber), then rooms
 * with new messages. When nothing is waiting it says so, in one calm line.
 */
export function NeedsYou({ state, mentionCount, mentions, rooms }) {
  const unreadRooms = (rooms ?? []).filter((r) => r.unread > 0);
  const waiting = mentions.length + unreadRooms.length;
  return (
    <section className="card dash-needs" aria-labelledby="dash-needs-title" data-waiting={state === 'ready' && waiting > 0 ? '' : undefined}>
      <div className="card-header">
        <h2 id="dash-needs-title" className="card-title">Needs you</h2>
        {mentionCount > 0 ? <CountBadge count={mentionCount} attention label={`${mentionCount} unread ${mentionCount === 1 ? 'mention' : 'mentions'}`} /> : null}
      </div>
      {state === 'loading' && <Loading />}
      {state === 'ready' && waiting === 0 && (
        <p className="dash-caught-up"><CircleCheck size={18} aria-hidden="true" />You are all caught up. New mentions and messages show up here.</p>
      )}
      {state === 'ready' && waiting > 0 && (
        <ul className="rows rows-flush">
          {mentions.map((n) => (
            <Row key={n.id} icon={<AtSign size={16} />} tone="attention" to={`/chat/${n.room_id}`} title={`Mention in #${n.rooms?.name ?? 'a room'}`} meta={n.message} time={n.created_at} />
          ))}
          {unreadRooms.map((r) => (
            <Row
              key={r.id}
              icon={r.isPrivate ? <Lock size={16} /> : <Hash size={16} />}
              to={`/chat/${r.id}`}
              title={<>{r.name}{r.isPrivate ? <span className="sr-only"> (private)</span> : null}</>}
              meta={`${r.unread} new ${r.unread === 1 ? 'message' : 'messages'}`}
            />
          ))}
        </ul>
      )}
      {state === 'ready' && mentionCount > mentions.length ? (
        <p className="dash-more">{mentionCount - mentions.length} more in the notification bell.</p>
      ) : null}
    </section>
  );
}

export function TeamNotes({ notes }) {
  return (
    <ul className="rows rows-flush">
      {notes.map((n) => (
        <Row key={n.id} icon={<NotebookPen size={16} />} to="/notes" title={n.title} meta={`by ${displayName(n.author)}`} time={n.updated_at} />
      ))}
    </ul>
  );
}

export function RecentFiles({ files }) {
  return (
    <ul className="rows rows-flush">
      {files.map((f) => (
        <Row key={f.id} icon={<FileText size={16} />} to="/files" title={f.name} meta={formatBytes(f.size)} time={f.created_at} />
      ))}
    </ul>
  );
}

export function NotesEmpty() {
  return (
  <EmptyState compact icon={<NotebookPen size={20} />} title="No team notes yet" action={<Link className="btn btn-sm" to="/notes" state={{ compose: true }}>Write a note</Link>}>
    Notes shared with the team show up here.
  </EmptyState>
  );
}
export function FilesEmpty() {
  return (
  <EmptyState compact icon={<FolderOpen size={20} />} title="No files yet" action={<Link className="btn btn-sm" to="/files">Upload a file</Link>}>
    Files you upload show up here, newest first.
  </EmptyState>
  );
}

/** The Day 17 stat tiles, demoted to one quiet list: useful, but not what you came to the page for */
export function WorkspaceNumbers({ stats, error }) {
  return (
    <section className="card dash-panel" aria-labelledby="dash-numbers-title">
      <h2 id="dash-numbers-title" className="card-title dash-numbers-title">Workspace</h2>
      {error ? (
        <p className="alert alert-error" role="alert">Could not load the numbers: {error}</p>
      ) : (
        <dl className="dash-stats">
          {STAT_TILES.map((t) => (
            <div key={t.key} className="dash-stat">
              <dt><Link to={t.to}>{t.label}</Link></dt>
              <dd data-testid={`stat-${t.key}`}>{stats ? Number(stats[t.key] ?? 0) : '…'}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export function QuickActions() {
  return (
    <section className="card dash-panel" aria-labelledby="dash-start-title">
      <h2 id="dash-start-title" className="card-title dash-numbers-title">Start something</h2>
      <div className="dash-actions">
        <Link className="btn btn-block" to="/notes" state={{ compose: true }}><NotebookPen size={16} aria-hidden="true" />Write a note</Link>
        <Link className="btn btn-block" to="/files"><Upload size={16} aria-hidden="true" />Upload a file</Link>
        <Link className="btn btn-block" to="/chat" state={{ newRoom: true }}><MessageSquarePlus size={16} aria-hidden="true" />Start a room</Link>
      </div>
    </section>
  );
}

export function DashboardUnderTheHood() {
  return (
    <UnderTheHood title="Under the hood: what this app demonstrates">
      <ul className="dash-demo">
        {DEMONSTRATES.map((d) => (
          <li key={d.page}>
            <Link to={d.to}>{d.page}</Link>: <strong>{d.feature}</strong>. {d.text}
          </li>
        ))}
      </ul>
      <p>
        This page: <code>rpc(&apos;workspace_stats&apos;)</code> counts five things in one round trip; team notes embed their author with{' '}
        <code>author:profiles(...)</code>; rooms merge <code>room_members</code> with <code>rpc(&apos;unread_counts&apos;)</code>; mentions are{' '}
        <code>notifications</code> rows a database trigger wrote. Each section loads on its own, so one failure does not blank the page.
      </p>
    </UnderTheHood>
  );
}
