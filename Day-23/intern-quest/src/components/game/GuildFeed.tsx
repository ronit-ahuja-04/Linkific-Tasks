'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import Markdown from '@/components/Markdown';
import { apiFetch } from '@/lib/api-client';
import { toAppError } from '@/lib/errors';
import { SKILL_LABELS, type Difficulty, type Skill } from '@/lib/game';

export interface FeedItem {
  id: string;
  day: number;
  title: string;
  body: string;
  blockers: string;
  difficulty: Difficulty;
  skills: Skill[];
  handle: string;
  displayName: string;
  notes: { id: string; authorName: string; body: string }[];
}

const ICONS = ['🏅', '🚀', '🐞', '🧠', '🌟', '🛠️', '📚', '🎯'] as const;

/** The mentor's review feed: leave a note on a quest, or award a badge to its author. Uses the app's own API. */
export default function GuildFeed({ items }: { items: FeedItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<{ handle: string; displayName: string } | null>(null);
  const [badge, setBadge] = useState({ name: '', note: '', icon: '🏅' });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');

  // Before Day 23 a network failure here threw before any message was set: the mentor saw nothing at all
  async function addNote(id: string) {
    const body = (drafts[id] ?? '').trim();
    if (!body) return;
    try {
      await apiFetch(`/api/quests/${id}/notes`, { method: 'POST', body: { body } });
      setDrafts((d) => ({ ...d, [id]: '' }));
      setStatus('Note added.');
      router.refresh();
    } catch (caught) {
      setStatus(`Could not add the note (it is still in the box). ${toAppError(caught).messageWithReference}`);
    }
  }

  async function award() {
    if (!target) return;
    try {
      await apiFetch('/api/badges', { method: 'POST', body: { handle: target.handle, ...badge } });
      setStatus(`Badge “${badge.name}” awarded to ${target.displayName}.`);
      setBadge({ name: '', note: '', icon: '🏅' });
      router.refresh();
    } catch (caught) {
      // the badge stays filled in: "Award badge" again opens it as it was
      setStatus(`Could not award the badge. ${toAppError(caught).messageWithReference}`);
    } finally {
      dialog.current?.close();
    }
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {status && <p className="notice" aria-hidden="true">{status}</p>}
      <ol className="feed">
        {items.map((q) => (
          <li key={q.id} className="card feed-item">
            <div className="feed-head">
              <Link href={`/c/${q.handle}`} className="feed-who">{q.displayName} <span className="muted">@{q.handle}</span></Link>
              <span className="muted">Day {q.day}</span>
              <span className={`q-diff ${q.difficulty}`}>{q.difficulty}</span>
            </div>
            <h3>{q.title}</h3>
            {q.body && <div className="feed-body"><Markdown source={q.body} /></div>}
            {q.blockers && <p className="feed-blocker"><strong>Blocker:</strong> {q.blockers}</p>}
            <p className="qc-skills">{q.skills.map((s) => SKILL_LABELS[s]).join(' · ')}</p>
            {q.notes.length > 0 && (
              <ul className="notes">
                {q.notes.map((n) => <li key={n.id}><strong>{n.authorName}:</strong> {n.body}</li>)}
              </ul>
            )}
            <div className="feed-actions">
              <label className="sr-only" htmlFor={`note-${q.id}`}>Note for {q.displayName} on day {q.day}</label>
              <input id={`note-${q.id}`} placeholder="Leave a note…" value={drafts[q.id] ?? ''} maxLength={1000}
                onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') void addNote(q.id); }} />
              <button type="button" className="ghost-button" onClick={() => void addNote(q.id)}>Add note</button>
              <button type="button" className="ghost-button" onClick={() => { setTarget({ handle: q.handle, displayName: q.displayName }); dialog.current?.showModal(); }}>Award badge</button>
            </div>
          </li>
        ))}
      </ol>

      <dialog ref={dialog} className="confirm" aria-labelledby="award-title">
        <form method="dialog" onSubmit={(e) => { e.preventDefault(); void award(); }}>
          <h2 id="award-title">Award a badge{target ? ` to ${target.displayName}` : ''}</h2>
          <fieldset className="field">
            <legend>Icon</legend>
            <div className="skill-chips">
              {ICONS.map((icon) => <button key={icon} type="button" className="chip icon-chip" aria-pressed={badge.icon === icon} aria-label={`Icon ${icon}`} onClick={() => setBadge((b) => ({ ...b, icon }))}>{icon}</button>)}
            </div>
          </fieldset>
          <label className="field"><span>Name</span><input value={badge.name} onChange={(e) => setBadge((b) => ({ ...b, name: e.target.value }))} maxLength={40} required minLength={2} /></label>
          <label className="field"><span>Why <em>(optional)</em></span><input value={badge.note} onChange={(e) => setBadge((b) => ({ ...b, note: e.target.value }))} maxLength={280} /></label>
          <div className="confirm-actions">
            <button type="button" className="ghost-button" onClick={() => dialog.current?.close()}>Cancel</button>
            <button type="submit" className="big-button" disabled={badge.name.trim().length < 2}>Award</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
