'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOptimistic, useRef, useState, useTransition } from 'react';
import Markdown from '@/components/Markdown';
import { apiFetch } from '@/lib/api-client';
import { toAppError } from '@/lib/errors';
import { toast } from '@/lib/toast';
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

/**
 * The mentor's review feed: leave a note on a quest, or award a badge to its author. Uses the app's own API.
 *
 * Notes are OPTIMISTIC (React's useOptimistic): a note appears at once, marked "Sending…", while the request runs.
 * When the server has it, the page data is refreshed and the note is simply there. If it fails, it stays in the list
 * as "Not sent", with Retry and Discard, so the text is never lost (and a toast says why).
 * Results go to toasts: the mentor has usually moved on to the next quest by the time the answer arrives.
 */
type Note = FeedItem['notes'][number] & { sending?: boolean };
interface FailedNote { key: string; body: string }

export default function GuildFeed({ items, me }: { items: FeedItem[]; me: string }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<{ handle: string; displayName: string } | null>(null);
  const [badge, setBadge] = useState({ name: '', note: '', icon: '🏅' });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<Record<string, FailedNote[]>>({});
  const [, startTransition] = useTransition();
  const [shown, addOptimistic] = useOptimistic(items, (state: FeedItem[], sent: { questId: string; note: Note }) =>
    state.map((q) => (q.id === sent.questId ? { ...q, notes: [...q.notes, sent.note] } : q)));

  function send(questId: string, body: string) {
    startTransition(async () => {
      addOptimistic({ questId, note: { id: `sending-${crypto.randomUUID()}`, authorName: me, body, sending: true } });
      try {
        await apiFetch(`/api/quests/${questId}/notes`, { method: 'POST', body: { body } });
        toast('Note added.', 'success');
        // still inside the transition: the optimistic note stays until the refreshed list (with the real note) arrives
        startTransition(() => router.refresh());
      } catch (caught) {
        setFailed((f) => ({ ...f, [questId]: [...(f[questId] ?? []), { key: crypto.randomUUID(), body }] }));
        toast(`Your note was not sent. ${toAppError(caught).messageWithReference}`, 'error');
      }
    });
  }

  function addNote(questId: string) {
    const body = (drafts[questId] ?? '').trim();
    if (!body) return;
    setDrafts((d) => ({ ...d, [questId]: '' })); // it is in the list now (sending), not lost
    send(questId, body);
  }

  const forget = (questId: string, key: string) => setFailed((f) => ({ ...f, [questId]: (f[questId] ?? []).filter((n) => n.key !== key) }));

  async function award() {
    if (!target) return;
    try {
      await apiFetch('/api/badges', { method: 'POST', body: { handle: target.handle, ...badge } });
      toast(`Badge “${badge.name}” awarded to ${target.displayName}.`, 'success');
      setBadge({ name: '', note: '', icon: '🏅' });
      router.refresh();
    } catch (caught) {
      // the badge stays filled in: "Award badge" again opens it as it was
      toast(`Could not award the badge. ${toAppError(caught).messageWithReference}`, 'error');
    } finally {
      dialog.current?.close();
    }
  }

  return (
    <>
      <ol className="feed">
        {shown.map((q) => (
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
            {(q.notes.length > 0 || (failed[q.id] ?? []).length > 0) && (
              <ul className="notes">
                {q.notes.map((n: Note) => (
                  <li key={n.id} className={n.sending ? 'note-pending' : undefined}>
                    <strong>{n.authorName}:</strong> {n.body}{n.sending && <em>Sending…</em>}
                  </li>
                ))}
                {(failed[q.id] ?? []).map((n) => (
                  <li key={n.key} className="note-failed">
                    <strong>{me}:</strong> {n.body}<em>Not sent.</em>
                    <button type="button" onClick={() => { forget(q.id, n.key); send(q.id, n.body); }} aria-label={`Retry sending your note: ${n.body}`}>Retry</button>
                    <button type="button" onClick={() => forget(q.id, n.key)} aria-label={`Discard your note: ${n.body}`}>Discard</button>
                  </li>
                ))}
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
