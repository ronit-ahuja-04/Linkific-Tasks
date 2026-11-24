'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import Markdown from '@/components/Markdown';
import FormMessage, { problemFrom, type FormProblem } from '@/components/errors/FormMessage';
import RewardBoundary from './RewardBoundary';
import { apiFetch } from '@/lib/api-client';
import { toAppError } from '@/lib/errors';
import { DIFFICULTIES, DIFFICULTY_XP, RULES, SKILL_LABELS, SKILLS, type Difficulty, type Skill } from '@/lib/game';
import type { Reward } from '@/lib/server/quests';

/**
 * The quest editor. It talks to the app's own API (POST /api/quests, PUT and DELETE /api/quests/:id), exactly as an
 * outside client would, and shows the API's per-field errors next to each field.
 * The reward screen is loaded only when a quest is actually published (next/dynamic): its animations stay out of the
 * editor's first download.
 */
const RewardOverlay = dynamic(() => import('./RewardOverlay'), { ssr: false });

export interface QuestDraft {
  id?: string;
  day: number;
  date: string;
  title: string;
  body: string;
  blockers: string;
  difficulty: Difficulty;
  skills: Skill[];
  prLinks: string[];
  isPublic: boolean;
  status: 'draft' | 'published';
}

const isSaved = (value: unknown): value is { quest: { id: string }; reward: Reward | null } =>
  typeof value === 'object' && value !== null && 'quest' in value && 'reward' in value;

export default function QuestEditor({ initial, handle }: { initial: QuestDraft; handle: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<QuestDraft>(initial);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<FormProblem | null>(null);
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const editing = Boolean(initial.id);

  // Next.js keeps a page you leave alive but hidden (React <Activity>), so its state survives. A finished reward,
  // an old error or the Preview tab must not greet you next time: clear them when this page is hidden.
  // (A fresh form for the next day comes from the page keying this component on the day.)
  useLayoutEffect(() => () => {
    setReward(null);
    setErrors({});
    setProblem(null);
    setTab('write');
  }, []);

  const set = <K extends keyof QuestDraft>(key: K, value: QuestDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    // editing a field clears its old error message (it described the previous value)
    setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([field]) => field !== key)) : e));
  };
  const toggleSkill = (skill: Skill) =>
    set('skills', draft.skills.includes(skill) ? draft.skills.filter((s) => s !== skill) : draft.skills.length < RULES.maxSkills ? [...draft.skills, skill] : draft.skills);

  async function save(status: 'draft' | 'published', event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setErrors({});
    setProblem(null);
    const body = { ...draft, status, prLinks: draft.prLinks.map((l) => l.trim()).filter(Boolean) };
    // apiFetch never leaves this hanging: it has a deadline, and every failure arrives here as an AppError with a
    // message for people (offline, timeout, the API's own field errors, our outage with a reference)
    try {
      const result = await apiFetch(editing ? `/api/quests/${initial.id}` : '/api/quests', { method: editing ? 'PUT' : 'POST', body });
      if (isSaved(result) && result.reward) {
        setReward(result.reward); // the celebration; it navigates on close
        return;
      }
      router.push('/journal'); // the destination renders per request, so it is fresh (a refresh() here would re-render THIS page instead)
    } catch (caught) {
      const error = toAppError(caught);
      setErrors(error.fields ?? {});
      setProblem(problemFrom(error));
    } finally {
      setBusy(false); // always: before Day 23 a network failure skipped this line and "Saving…" stayed forever
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await apiFetch(`/api/quests/${initial.id}`, { method: 'DELETE' });
      router.push('/journal?notice=deleted'); // the destination renders per request, so it is fresh
    } catch (caught) {
      const error = toAppError(caught);
      setProblem({ message: `Could not delete the quest. ${error.messageWithReference}`, kind: error.kind });
    } finally {
      setBusy(false);
      dialog.current?.close();
    }
  }

  const err = (field: string) => (errors[field] ? <small className="field-error" id={`${field}-error`}>{errors[field]}</small> : null);
  const described = (field: string) => (errors[field] ? `${field}-error` : undefined);

  return (
    <>
      <form className="editor" onSubmit={(e) => void save('published', e)} noValidate>
        <div className="editor-head">
          <h1>{editing ? `Edit day ${initial.day}` : `Log day ${draft.day}`}</h1>
          <p className="muted">Base XP {DIFFICULTY_XP[draft.difficulty]} · +{RULES.prBonus} per PR link (up to {RULES.prBonusCap}) · +10% for a streak</p>
        </div>
        <FormMessage problem={problem} />

        <div className="editor-grid">
          <div className="card editor-main">
            <label className="field">
              <span>Title</span>
              <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Tame the App Router" maxLength={80}
                aria-invalid={Boolean(errors.title)} aria-describedby={described('title')} />
              {err('title')}
            </label>

            <div className="field">
              <div className="tabs" role="tablist" aria-label="What I did">
                <span className="field-label">What I did</span>
                <button type="button" role="tab" aria-selected={tab === 'write'} onClick={() => setTab('write')}>Write</button>
                <button type="button" role="tab" aria-selected={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button>
              </div>
              {tab === 'write' ? (
                <textarea value={draft.body} onChange={(e) => set('body', e.target.value)} rows={9} aria-label="What I did (Markdown)"
                  placeholder={'Markdown works: ## headings, - lists, `code`, **bold**'} aria-invalid={Boolean(errors.body)} aria-describedby={described('body')} />
              ) : (
                <div className="preview" aria-label="Preview">{draft.body.trim() ? <Markdown source={draft.body} /> : <p className="muted">Nothing to preview yet.</p>}</div>
              )}
              {err('body')}
            </div>

            <label className="field">
              <span>Blockers <em>(optional: Pip worries, and a later hard quest in the same skill earns “Unblocked”)</em></span>
              <textarea value={draft.blockers} onChange={(e) => set('blockers', e.target.value)} rows={2} maxLength={1000} />
              {err('blockers')}
            </label>

            <fieldset className="field">
              <legend>Pull requests <em>(up to {RULES.maxPrLinks})</em></legend>
              {draft.prLinks.map((link, i) => (
                <div className="pr-row" key={i}>
                  <input value={link} type="url" inputMode="url" placeholder="https://github.com/…/pull/12" aria-label={`Pull request link ${i + 1}`}
                    onChange={(e) => set('prLinks', draft.prLinks.map((l, j) => (j === i ? e.target.value : l)))} />
                  <button type="button" className="chip" onClick={() => set('prLinks', draft.prLinks.filter((_, j) => j !== i))} aria-label={`Remove link ${i + 1}`}>✕</button>
                </div>
              ))}
              {draft.prLinks.length < RULES.maxPrLinks && <button type="button" className="chip" onClick={() => set('prLinks', [...draft.prLinks, ''])}>+ Add a PR link</button>}
              {err('prLinks')}
            </fieldset>
          </div>

          <div className="card editor-side">
            <div className="two">
              <label className="field">
                <span>Day</span>
                <input type="number" min={1} max={366} value={draft.day} onChange={(e) => set('day', Number(e.target.value))} aria-invalid={Boolean(errors.day)} aria-describedby={described('day')} />
                {err('day')}
              </label>
              <label className="field">
                <span>Date</span>
                <input type="date" value={draft.date} onChange={(e) => set('date', e.target.value)} aria-invalid={Boolean(errors.date)} aria-describedby={described('date')} />
                {err('date')}
              </label>
            </div>

            <fieldset className="field">
              <legend>Difficulty</legend>
              <div className="segmented">
                {DIFFICULTIES.map((d) => (
                  <button key={d} type="button" aria-pressed={draft.difficulty === d} onClick={() => set('difficulty', d)} className={`seg-${d}`}>{d}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Skills <em>({draft.skills.length}/{RULES.maxSkills})</em></legend>
              <div className="skill-chips">
                {SKILLS.map((s) => (
                  <button key={s} type="button" className="chip" aria-pressed={draft.skills.includes(s)} onClick={() => toggleSkill(s)}
                    disabled={!draft.skills.includes(s) && draft.skills.length >= RULES.maxSkills}>
                    {SKILL_LABELS[s]}
                  </button>
                ))}
              </div>
              {err('skills')}
            </fieldset>

            <label className="toggle">
              <input type="checkbox" checked={draft.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />
              <span>Show on my public sheet</span>
            </label>

            <div className="editor-actions">
              <button type="submit" className="big-button" disabled={busy}>{busy ? 'Saving…' : editing && initial.status === 'published' ? 'Save changes' : 'Publish quest'}</button>
              {(!editing || initial.status === 'draft') && (
                <button type="button" className="ghost-button" disabled={busy} onClick={() => void save('draft')}>Save as draft</button>
              )}
              {editing && <button type="button" className="danger-link" onClick={() => dialog.current?.showModal()}>Delete quest</button>}
            </div>
          </div>
        </div>
      </form>

      <dialog ref={dialog} className="confirm" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Delete day {initial.day}?</h2>
        <p>Its XP comes off your character, and Pip forgets it. This can not be undone.</p>
        <div className="confirm-actions">
          <button type="button" className="ghost-button" onClick={() => dialog.current?.close()} autoFocus>Keep it</button>
          <button type="button" className="danger-button" disabled={busy} onClick={() => void remove()}>Delete</button>
        </div>
      </dialog>

      {reward && (
        <RewardBoundary reward={reward} onDone={() => router.push('/journal')}>
          <RewardOverlay reward={reward} handle={handle} onDone={() => router.push('/journal')} />
        </RewardBoundary>
      )}
    </>
  );
}
