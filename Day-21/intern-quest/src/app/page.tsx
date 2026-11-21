import { connection } from 'next/server';
import { Suspense } from 'react';
import QuestApp from '@/components/QuestApp';
import Account from '@/components/auth/Account';
import { computeStats } from '@/lib/game';
import { listCharacters, listMentorBadges, listQuests } from '@/lib/server/db';
import { buildCharacterView } from '@/lib/view';

/**
 * PROGRESS PREVIEW of the character screen: real database, real game rules, the new design.
 * The data is read and turned into plain view models on the server; QuestApp (a Client Component) only animates.
 */
export default function Home() {
  return (
    <Suspense fallback={<p style={{ padding: 24, fontFamily: 'system-ui' }}>Loading the guild…</p>}>
      <Characters />
    </Suspense>
  );
}

async function Characters() {
  await connection(); // read the database per request, so the preview always shows the current data
  const today = new Date().toISOString().slice(0, 10);
  const characters = await listCharacters();
  const views = await Promise.all(
    characters.map(async (c) => {
      const [quests, mentorBadges] = await Promise.all([listQuests(c.userId), listMentorBadges(c.userId)]);
      return { xp: computeStats(c.class, quests).totalXp, view: buildCharacterView(c, quests, mentorBadges, today) };
    }),
  );
  views.sort((a, b) => b.xp - a.xp); // highest level first
  return <QuestApp characters={views.map((v) => v.view)} account={<Account />} />;
}
