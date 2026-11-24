import { Suspense } from 'react';
import AppShell from '@/components/shell/AppShell';

/**
 * The layout of the signed-in pages. The shell (top bar, navigation) is rendered here, ONCE, so it stays on screen
 * when a page fails: app/(game)/error.tsx replaces only what is inside <main>. It reads the session cookie (request
 * time), hence the Suspense boundary that Cache Components requires.
 */
export default function GameLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<div className="shell tone-violet" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
