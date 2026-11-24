import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import GuildFeed from '@/components/game/GuildFeed';
import { GuildSkeleton } from '@/components/Skeletons';
import { computeStats } from '@/lib/game';
import { listCharacters, listNotesFor, listQuests, listRecentPublicQuests } from '@/lib/server/db';
import { requireMentor } from '@/lib/server/guards';

export const metadata: Metadata = { title: 'Guild hall', robots: { index: false } };

export default function GuildPage() {
  return (
    <Suspense fallback={<GuildSkeleton />}>
      <Guild />
    </Suspense>
  );
}

async function Guild() {
  const user = await requireMentor('/guild');
  const [feed, characters] = await Promise.all([listRecentPublicQuests(30), listCharacters()]);
  const notes = await listNotesFor(feed.map((q) => q.id));
  const roster = await Promise.all(characters.map(async (c) => ({ c, stats: computeStats(c.class, await listQuests(c.userId, 'published')) })));
  roster.sort((a, b) => b.stats.totalXp - a.stats.totalXp);

  return (
    <div className="guild">
      <section>
        <h1>Guild hall</h1>
        <p className="lede">The newest public quests from every intern. Leave a note, or award a badge for something that deserves one.</p>
        {feed.length === 0 ? <p className="card empty">No public quests yet.</p> : (
          <GuildFeed me={user.name || 'You'} items={feed.map((q) => ({ ...q, notes: (notes.get(q.id) ?? []).map((n) => ({ id: n.id, authorName: n.authorName, body: n.body })) }))} />
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
  );
}
