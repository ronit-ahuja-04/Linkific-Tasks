import { Suspense } from 'react';
import { ShellSkeleton } from '@/components/Skeletons';
import AppShell from '@/components/shell/AppShell';

/**
 * The layout of the signed-in pages. The shell (top bar, navigation) is rendered here, ONCE, so it stays on screen
 * when a page fails: app/(game)/error.tsx replaces only what is inside <main>. It reads the session cookie (request
 * time), hence the Suspense boundary that Cache Components requires.
 */
export default function GameLayout({ children }: LayoutProps<'/'>) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
