'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useLayoutEffect, useState, type FormEvent } from 'react';
import { redeemMentorAction, type MentorState } from '@/app/(game)/character/actions';
import FormMessage, { problemFrom, type FormProblem } from '@/components/errors/FormMessage';
import { guardAction } from '@/lib/action-guard';
import { apiFetch } from '@/lib/api-client';
import { toAppError } from '@/lib/errors';
import { CLASS_INFO, CLASSES, SKILL_LABELS, type CharacterClass } from '@/lib/game';

/** Lazy: the customiser and its live Pip are downloaded only when this page is opened, not with the rest of the app */
const PipCustomizer = dynamic(() => import('./PipCustomizer'), { ssr: false, loading: () => <div className="customizer-loading">Loading Pip…</div> });

export interface CharacterDraft {
  handle: string;
  displayName: string;
  bio: string;
  class: CharacterClass;
  avatar: { skin: number; hair: number; colour: number; accessory: number };
  isPublic: boolean;
}


export default function CharacterEditor({ initial, isNew, role }: { initial: CharacterDraft; isNew: boolean; role: 'intern' | 'mentor' }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<FormProblem | null>(null);
  const [busy, setBusy] = useState(false);
  // guarded: offline, the server action's failure becomes a message here instead of an error page
  const [mentor, mentorAction, mentorPending] = useActionState<MentorState, FormData>(guardAction(redeemMentorAction, (error) => ({ error: error.message })), {});
  const set = <K extends keyof CharacterDraft>(key: K, value: CharacterDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([field]) => field !== key)) : e));
  };
  // clear stale messages when Next.js hides this page (it stays alive in an <Activity>)
  useLayoutEffect(() => () => {
    setErrors({});
    setProblem(null);
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return; // focusable while busy (aria-disabled): ignore a second press
    setBusy(true);
    setErrors({});
    setProblem(null);
    try {
      await apiFetch('/api/character', { method: 'PUT', body: draft });
      router.push(isNew ? '/journal' : '/character?notice=saved');
    } catch (caught) {
      const error = toAppError(caught);
      setErrors(error.fields ?? {});
      setProblem(problemFrom(error));
    } finally {
      setBusy(false);
    }
  }

  const err = (field: string) => (errors[field] ? <small className="field-error" id={`${field}-error`}>{errors[field]}</small> : null);

  return (
    <div className="character-page">
      <form className="editor" onSubmit={(e) => void save(e)} noValidate>
        <div className="editor-head">
          <h1>{isNew ? 'Create your character' : 'Your character'}</h1>
          <p className="muted">{isNew ? 'Pick a class and dress up Pip. You can change all of it later.' : 'Your handle is your public address: /c/your-handle'}</p>
        </div>
        <FormMessage problem={problem} />
        <div className="editor-grid">
          <div className="card editor-main">
            <div className="two">
              <label className="field">
                <span>Display name</span>
                <input value={draft.displayName} onChange={(e) => set('displayName', e.target.value)} maxLength={40} aria-invalid={Boolean(errors.displayName)} aria-describedby={errors.displayName ? 'displayName-error' : undefined} />
                {err('displayName')}
              </label>
              <label className="field">
                <span>Handle</span>
                <input value={draft.handle} onChange={(e) => set('handle', e.target.value.toLowerCase())} maxLength={24} autoCapitalize="none" spellCheck={false}
                  aria-invalid={Boolean(errors.handle)} aria-describedby={errors.handle ? 'handle-error' : 'handle-hint'} />
                {errors.handle ? err('handle') : <small className="hint-text" id="handle-hint">3 to 24 lowercase letters, digits or hyphens</small>}
              </label>
            </div>
            <label className="field">
              <span>Bio <em>(optional)</em></span>
              <textarea value={draft.bio} onChange={(e) => set('bio', e.target.value)} rows={2} maxLength={280} />
            </label>
            <fieldset className="field">
              <legend>Class <em>(+10% XP on its home skills)</em></legend>
              <div className="class-cards" role="radiogroup" aria-label="Class">
                {CLASSES.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={draft.class === c} className="class-card" onClick={() => set('class', c)}>
                    <strong>{CLASS_INFO[c].label}</strong>
                    <span>{CLASS_INFO[c].motto}</span>
                    <small>{CLASS_INFO[c].home.map((s) => SKILL_LABELS[s]).join(' · ')}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="toggle">
              <input type="checkbox" checked={draft.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />
              <span>Public character sheet (others can see your level, badges and public quests)</span>
            </label>
          </div>
          <div className="card editor-side">
            <h2>Pip</h2>
            <PipCustomizer tint={draft.avatar.colour} accessory={draft.avatar.accessory}
              onChange={({ tint, accessory }) => set('avatar', { ...draft.avatar, colour: tint, accessory })} />
            <div className="editor-actions">
              <button type="submit" className="big-button" aria-disabled={busy}>{busy ? (isNew ? 'Creating…' : 'Saving…') : isNew ? 'Create character' : 'Save character'}</button>
            </div>
          </div>
        </div>
      </form>

      {!isNew && (
        <section className="card mentor-card" aria-labelledby="mentor-title">
          <h2 id="mentor-title">{role === 'mentor' ? '🛡️ You are a guild master' : 'Are you a mentor?'}</h2>
          {role === 'mentor' ? (
            <p>You can review interns’ quests, leave notes and award badges in the <Link href="/guild">Guild hall</Link>.</p>
          ) : (
            <form action={mentorAction} className="mentor-form">
              <label className="field">
                <span>Mentor invite code</span>
                <input name="code" autoComplete="off" spellCheck={false} />
              </label>
              <button type="submit" className="ghost-button" aria-disabled={mentorPending}>{mentorPending ? 'Checking…' : 'Become a guild master'}</button>
              {mentor.error && <p className="form-error" role="alert">{mentor.error}</p>}
              {mentor.result === 'wrong' && <p className="form-error" role="alert">That invite code is not right.</p>}
              {mentor.result === 'missing' && <p className="form-error" role="alert">Enter the invite code.</p>}
              {mentor.result === 'promoted' && <p className="form-ok" role="status">Done! Open the <Link href="/guild">Guild hall</Link>.</p>}
            </form>
          )}
        </section>
      )}
    </div>
  );
}
