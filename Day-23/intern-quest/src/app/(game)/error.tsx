'use client';

import ErrorPanel from '@/components/errors/ErrorPanel';

/**
 * The boundary for the signed-in pages (journal, editor, character, guild hall). It sits INSIDE app/(game)/layout.tsx,
 * so when a page fails, only the page is replaced: the top bar and navigation keep working, and moving to another
 * page clears the error. "Try again" re-fetches the page from the server (Next 16's retry()).
 */
export default function GameError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel variant="page" error={error} retry={retry} exit={{ href: '/journal', label: 'Back to my journal' }} />;
}
