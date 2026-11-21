import Link from 'next/link';
import type { ReactNode } from 'react';
import Account from '@/components/auth/Account';
import type { SessionUser } from '@/lib/server/session';
import NavLinks from './NavLinks';

const NOTICES: Record<string, string> = {
  'mentors-only': 'The Guild hall is for mentors. Have an invite code? Enter it on your character page.',
  deleted: 'Quest deleted.',
  saved: 'Character saved.',
  welcome: 'Welcome! First, create your character.',
  promoted: 'You are now a guild master. The Guild hall is open to you.',
};

/** The frame of every signed-in page: top bar, navigation, an optional notice, then the page */
export default function AppShell({ user, handle, notice, tone = 'violet', children }: {
  user: SessionUser;
  handle: string | null;
  notice?: string | undefined;
  tone?: 'violet' | 'sun' | 'sky';
  children: ReactNode;
}) {
  const links = [
    { href: '/journal', label: 'Journal' },
    { href: '/character', label: 'Character' },
    ...(handle ? [{ href: `/c/${handle}`, label: 'My sheet' }] : []),
    ...(user.role === 'mentor' ? [{ href: '/guild', label: 'Guild hall' }] : []),
  ];
  const message = notice ? NOTICES[notice] : undefined;
  return (
    <div className={`shell tone-${tone}`}>
      <header className="shell-bar">
        <Link href="/" className="wordmark">Intern Quest</Link>
        <NavLinks links={links} />
        <Account />
      </header>
      {message && <p className="notice" role="status">{message}</p>}
      <main className="shell-main">{children}</main>
    </div>
  );
}
