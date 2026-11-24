'use client';

import ErrorPanel from '@/components/errors/ErrorPanel';

/**
 * The boundary for everything under the root layout that has no closer one: the home page, public character
 * sheets, sign-in and registration. It replaces the page (the root layout, with fonts and styles, stays), and is
 * branded like the not-found page. Before Day 23 these errors showed Next's unbranded "This page couldn't load".
 */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel variant="screen" error={error} retry={retry} exit={{ href: '/', label: 'Home' }} />;
}
