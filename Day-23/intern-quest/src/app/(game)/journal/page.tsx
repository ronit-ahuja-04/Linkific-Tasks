import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import PipCorner from '@/components/game/PipCorner';
import CreateCharacterPrompt from '@/components/game/CreateCharacterPrompt';
import AppShell from '@/components/shell/AppShell';
import { SKILL_LABELS } from '@/lib/game';
import { getCharacterByUser, listMentorBadges, listQuests } from '@/lib/server/db';
import { requireUser } from '@/lib/server/guards';
import { todayIso } from '@/lib/today';
import { buildCharacterView } from '@/lib/view';

export const metadata: Metadata = { title: 'Journal', robots: { index: false } };

export default function JournalPage(props: PageProps<'/journal'>) {
  return (
    <Suspense fallback={<div className="shell tone-violet" />}>
      <Journal searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Journal({ searchParams }: Pick<PageProps<'/journal'>, 'searchParams'>) {
  const user = await requireUser('/journal');
  const character = await getCharacterByUser(user.id);
  const { notice } = await searchParams;
  if (!character) return <AppShell user={user} handle={null}><CreateCharacterPrompt /></AppShell>;
  const [quests, badges] = await Promise.all([listQuests(user.id), listMentorBadges(user.id)]);
  const view = buildCharacterView(character, quests, badges, todayIso());
  const nextDay = quests.reduce((max, q) => Math.max(max, q.day), 0) + 1;
  const xpById = new Map(view.quests.map((q) => [q.day, q.xp]));

  return (
    <AppShell user={user} handle={character.handle} notice={typeof notice === 'string' ? notice : undefined}>
      <div className="journal">
        <section className="journal-hero">
          <p className="eyebrow">{view.classLabel} · level {view.level} {view.title}</p>
          <h1>Day {nextDay} <span>awaits.</span></h1>
          <div className="mini-level">
            <div className="xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={view.span} aria-valuenow={view.into} aria-label="XP to the next level">
              <div className="xpfill" style={{ width: `${Math.round(view.fraction * 100)}%` }} />
            </div>
            <span>{view.into} / {view.span} XP to level {view.level + 1} · 🔥 {view.streak}-day best streak</span>
          </div>
          <Link href="/journal/new" className="big-button">+ Log day {nextDay}</Link>
          <PipCorner pip={view.pip} />
        </section>

        <section className="card journal-list" aria-labelledby="quests-title">
          <h2 id="quests-title">Your quests <span className="count">{quests.length}</span></h2>
          {quests.length === 0 ? (
            <p className="empty">No quests yet. Every day you log gives XP to the skills you used. Start with today.</p>
          ) : (
            <ol className="quest-cards">
              {[...quests].reverse().map((q) => (
                <li key={q.id}>
                  <Link href={`/journal/${q.id}`} className="quest-card">
                    <span className="qc-day">Day {q.day}</span>
                    <span className="qc-main">
                      <strong>{q.title}</strong>
                      <span className="qc-skills">{q.skills.map((s) => SKILL_LABELS[s]).join(' · ')}</span>
                    </span>
                    <span className="qc-tags">
                      {q.status === 'draft' && <span className="tag tag-draft">draft</span>}
                      {!q.isPublic && <span className="tag">private</span>}
                      {q.blockers && <span className="tag tag-blocked">blocked</span>}
                      <span className={`q-diff ${q.difficulty}`}>{q.difficulty}</span>
                    </span>
                    <span className="qc-xp">{q.status === 'published' ? `+${xpById.get(q.day) ?? 0}` : '—'}</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </AppShell>
  );
}
