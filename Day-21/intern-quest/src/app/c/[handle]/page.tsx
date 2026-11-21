import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import QuestApp from '@/components/QuestApp';
import Account from '@/components/auth/Account';
import { getCharacterByHandle, listMentorBadges, listQuests } from '@/lib/server/db';
import { todayIso } from '@/lib/today';
import { buildCharacterView } from '@/lib/view';

/**
 * A public character sheet. XP, level and badges count every published quest; only PUBLIC quests are listed, and
 * Pip only talks about those. A private character is simply not found. (Milestone 5 adds caching and SEO metadata.)
 */
export const metadata: Metadata = { title: 'Character sheet' };

export default function CharacterSheetPage(props: PageProps<'/c/[handle]'>) {
  return (
    <Suspense fallback={<div className="screen" style={{ background: '#6C4DF5' }} />}>
      <Sheet params={props.params} />
    </Suspense>
  );
}

async function Sheet({ params }: Pick<PageProps<'/c/[handle]'>, 'params'>) {
  await connection();
  const { handle } = await params;
  const character = await getCharacterByHandle(handle.toLowerCase());
  if (!character || !character.isPublic) notFound();
  const [quests, badges] = await Promise.all([listQuests(character.userId, 'published'), listMentorBadges(character.userId)]);
  const view = buildCharacterView(character, quests, badges, todayIso(), { publicOnly: true });
  return <QuestApp characters={[view]} account={<Account />} />;
}
