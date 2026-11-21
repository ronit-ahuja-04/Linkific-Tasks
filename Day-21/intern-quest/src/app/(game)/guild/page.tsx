import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import GuildFeed from '@/components/game/GuildFeed';
import AppShell from '@/components/shell/AppShell';
import { computeStats } from '@/lib/game';
import { getCharacterByUser, listCharacters, listNotesFor, listQuests, listRecentPublicQuests } from '@/lib/server/db';
import { requireMentor } from '@/lib/server/guards';

export const metadata: Metadata = { title: 'Guild hall', robots: { index: false } };

export default function GuildPage() {
  return (
    <Suspense fallback={<div className="shell tone-sky" />}>
      <Guild />
    </Suspense>
  );
}

async function Guild() {
  const user = await requireMentor('/guild');
  const [own, feed, characters] = await Promise.all([getCharacterByUser(user.id), listRecentPublicQuests(30), listCharacters()]);
  const notes = await listNotesFor(feed.map((q) => q.id));
  const roster = await Promise.all(characters.map(async (c) => ({ c, stats: computeStats(c.class, await listQuests(c.userId, 'published')) })));
  roster.sort((a, b) => b.stats.totalXp - a.stats.totalXp);

  return (
    <AppShell user={user} handle={own?.handle ?? null} tone="sky">
      <div className="guild">
        <section>
          <h1>Guild hall</h1>
          <p className="lede">The newest public quests from every intern. Leave a note, or award a badge for something that deserves one.</p>
          {feed.length === 0 ? <p className="card empty">No public quests yet.</p> : (
            <GuildFeed items={feed.map((q) => ({ ...q, notes: (notes.get(q.id) ?? []).map((n) => ({ id: n.id, authorName: n.authorName, body: n.body })) }))} />
          )}
        </section>
        <aside className="card roster" aria-labelledby="roster-title">
          <h2 id="roster-title">Interns</h2>
          <ol>
            {roster.map(({ c, stats }) => (
              <li key={c.userId}>
                <Link href={`/c/${c.handle}`}>{c.displayName}</Link>
                <span className="muted">Lv {stats.progress.level} {stats.title}</span>
                <span className="roster-xp">{stats.totalXp.toLocaleString('en-US')} XP</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </AppShell>
  );
}
