import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import QuestEditor from '@/components/game/QuestEditor';
import AppShell from '@/components/shell/AppShell';
import { getCharacterByUser, getQuest } from '@/lib/server/db';
import { requireUser } from '@/lib/server/guards';
import { isUuid } from '@/lib/validation';

export const metadata: Metadata = { title: 'Edit quest', robots: { index: false } };

export default function EditQuestPage(props: PageProps<'/journal/[id]'>) {
  return (
    <Suspense fallback={<div className="shell tone-violet" />}>
      <EditQuest params={props.params} />
    </Suspense>
  );
}

async function EditQuest({ params }: Pick<PageProps<'/journal/[id]'>, 'params'>) {
  const { id } = await params;
  const user = await requireUser(`/journal/${id}`);
  const character = await getCharacterByUser(user.id);
  const quest = isUuid(id) ? await getQuest(id) : null;
  if (!character || !quest || quest.userId !== user.id) notFound(); // someone else's quest is simply not found here
  const { userId: _userId, createdAt: _createdAt, updatedAt, ...initial } = quest;
  return (
    <AppShell user={user} handle={character.handle}>
      {/* keyed on the last save: after an edit, coming back shows what was saved, not a stale draft */}
      <QuestEditor key={`${quest.id}-${updatedAt}`} handle={character.handle} initial={initial} />
    </AppShell>
  );
}
