import type { Metadata } from 'next';
import { Suspense } from 'react';
import QuestEditor from '@/components/game/QuestEditor';
import CreateCharacterPrompt from '@/components/game/CreateCharacterPrompt';
import { EditorSkeleton } from '@/components/Skeletons';
import { getCharacterByUser, listQuests } from '@/lib/server/db';
import { requireUser } from '@/lib/server/guards';
import { todayIso } from '@/lib/today';

export const metadata: Metadata = { title: 'Log a quest', robots: { index: false } };

export default function NewQuestPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewQuest />
    </Suspense>
  );
}

async function NewQuest() {
  const user = await requireUser('/journal/new');
  const [character, quests] = await Promise.all([getCharacterByUser(user.id), listQuests(user.id)]);
  if (!character) return <CreateCharacterPrompt />;
  const day = quests.reduce((max, q) => Math.max(max, q.day), 0) + 1;
  return (
    <QuestEditor key={`new-${day}`} handle={character.handle}
        initial={{ day, date: todayIso(), title: '', body: '', blockers: '', difficulty: 'normal', skills: [], prLinks: [], isPublic: true, status: 'published' }} />
  );
}
