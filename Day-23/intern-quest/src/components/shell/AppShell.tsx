import Link from 'next/link';
import type { ReactNode } from 'react';
import Account from '@/components/auth/Account';
import { currentUser } from '@/lib/server/session';
import NavLinks from './NavLinks';
import ShellFrame from './ShellFrame';

/**
 * The frame of every signed-in page: top bar, navigation, then the page. Rendered ONCE by app/(game)/layout.tsx
 * (before Day 23 every page rendered it itself, after its own database reads, so a failed read took the navigation
 * down with the page).
 *
 * It needs NO database: the user, name and role come from the session cookie, and "My sheet" points to /me, which
 * finds your handle when you click it (app/(game)/me/page.tsx). So the shell stays up when the database is down.
 * The page's error boundary (app/(game)/error.tsx) sits inside <main>, under this frame.
 */
export default async function AppShell({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) return <>{children}</>; // the page itself redirects to sign-in (requireUser)
  return (
    <ShellFrame>
      <header className="shell-bar">
        <Link href="/" className="wordmark">Intern Quest</Link>
        <NavLinks links={[
          { href: '/journal', label: 'Journal' },
          { href: '/character', label: 'Character' },
          { href: '/me', label: 'My sheet' },
          ...(user.role === 'mentor' ? [{ href: '/guild', label: 'Guild hall' }] : []),
        ]} />
        <Account />
      </header>
      <main className="shell-main">{children}</main>
    </ShellFrame>
  );
}
