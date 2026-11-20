import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

export const metadata: Metadata = { title: 'A page that throws', robots: { index: false } };

/** Throws on purpose, at request time, so app/error.tsx has something to catch. Not in the sitemap, disallowed in robots. */
async function Explode(): Promise<never> {
  await connection();
  throw new Error('This page throws on purpose, to show error.tsx.');
}

export default function BrokenPage() {
  return (
    <>
      <h1>A page that throws</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Explode />
      </Suspense>
    </>
  );
}
