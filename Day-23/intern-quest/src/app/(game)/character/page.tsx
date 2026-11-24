import type { Metadata } from 'next';
import { Suspense } from 'react';
import CharacterEditor from '@/components/game/CharacterEditor';
import AppShell from '@/components/shell/AppShell';
import { getCharacterByUser } from '@/lib/server/db';
import { requireUser } from '@/lib/server/guards';

export const metadata: Metadata = { title: 'Your character', robots: { index: false } };

export default function CharacterPage(props: PageProps<'/character'>) {
  return (
    <Suspense fallback={<div className="shell tone-violet" />}>
      <Character searchParams={props.searchParams} />
    </Suspense>
  );
}

/** A handle suggestion for a new character: the name, lower-cased, letters and digits only */
const suggestHandle = (name: string): string => (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'adventurer').padEnd(3, '0');

async function Character({ searchParams }: Pick<PageProps<'/character'>, 'searchParams'>) {
  const user = await requireUser('/character');
  const character = await getCharacterByUser(user.id);
  const { notice } = await searchParams;
  const initial = character ?? {
    handle: suggestHandle(user.name), displayName: user.name || 'Adventurer', bio: '', class: 'fullstack_ranger' as const,
    avatar: { skin: 0, hair: 0, colour: 0, accessory: 0 }, isPublic: true,
  };
  return (
    <AppShell user={user} handle={character?.handle ?? null} notice={typeof notice === 'string' ? notice : undefined}>
      <CharacterEditor isNew={!character} role={user.role}
        initial={{ handle: initial.handle, displayName: initial.displayName, bio: initial.bio, class: initial.class, avatar: initial.avatar, isPublic: initial.isPublic }} />
    </AppShell>
  );
}
