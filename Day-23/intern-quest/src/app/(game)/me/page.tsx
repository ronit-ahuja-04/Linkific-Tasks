import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCharacterByUser } from '@/lib/server/db';
import { requireUser } from '@/lib/server/guards';

export const metadata: Metadata = { title: 'My sheet', robots: { index: false } };

/**
 * /me: "My sheet" in the navigation points here, and this sends you on to your public sheet (/c/<handle>), or to
 * character creation if you have none yet.
 *
 * Why not link to /c/<handle> directly: the handle needs a database read, and the shell (app/(game)/layout.tsx) must
 * need NONE, so that it stays up when the database is down. A layout is also not re-rendered when you move between
 * its pages, so a handle read there would stay stale after you create your character. A fixed link avoids both.
 */
export default function MyPage() {
  return (
    <Suspense fallback={null}>
      <ToMySheet />
    </Suspense>
  );
}

async function ToMySheet(): Promise<never> {
  const user = await requireUser('/me');
  const character = await getCharacterByUser(user.id);
  redirect(character ? `/c/${character.handle}` : '/character?notice=welcome');
}
