import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { SheetSkeleton } from '@/components/Skeletons';
import QuestApp from '@/components/QuestApp';
import Account from '@/components/auth/Account';
import { computeStats, topSkills, SKILL_LABELS } from '@/lib/game';
import { getPublicSheet } from '@/lib/server/public';
import { todayIso } from '@/lib/today';
import { buildCharacterView } from '@/lib/view';

/**
 * A public character sheet. The data comes from a cached read (getPublicSheet, tagged `character:<handle>`), so it
 * is computed once per change, not per visitor. XP, level and badges count every published quest; only PUBLIC quests
 * are listed, and Pip only talks about those. A private or unknown character is not found.
 */
export async function generateMetadata(props: PageProps<'/c/[handle]'>): Promise<Metadata> {
  const { handle } = await props.params;
  const sheet = await getPublicSheet(handle.toLowerCase());
  if (!sheet) return { title: 'Character not found', robots: { index: false } };
  const { character, quests } = sheet;
  const stats = computeStats(character.class, quests);
  const top = topSkills(stats, 3).map((s) => SKILL_LABELS[s.skill]);
  const title = `${character.displayName} · Level ${stats.progress.level} ${stats.title}`;
  const description = `${character.displayName} has completed ${stats.publishedCount} quests and earned ${stats.totalXp.toLocaleString('en-US')} XP${top.length ? `, strongest in ${top.join(', ')}` : ''}.`;
  return {
    title,
    description,
    alternates: { canonical: `/c/${character.handle}` },
    openGraph: { type: 'profile', title, description, url: `/c/${character.handle}`, username: character.handle },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/**
 * Unknown or private handles show the not-found page with `noindex` but keep HTTP status 200 (a "soft 404"): with
 * Cache Components the page shell has started streaming before the lookup finishes. I tried `instant = false` to make
 * the page block for a real 404; the shell still streams first, so it bought nothing and was removed (see README).
 */
export default function CharacterSheetPage(props: PageProps<'/c/[handle]'>) {
  return (
    <Suspense fallback={<SheetSkeleton />}>
      <Sheet params={props.params} />
    </Suspense>
  );
}

async function Sheet({ params }: Pick<PageProps<'/c/[handle]'>, 'params'>) {
  const { handle } = await params;
  const sheet = await getPublicSheet(handle.toLowerCase());
  if (!sheet) notFound();
  await connection(); // Pip's mood depends on today's date: the rest renders at request time
  const view = buildCharacterView(sheet.character, sheet.quests, sheet.badges, todayIso(), { publicOnly: true });
  return <QuestApp characters={[view]} account={<Suspense fallback={null}><Account /></Suspense>} />;
}
