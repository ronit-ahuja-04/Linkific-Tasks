import Link from 'next/link';
import { auth } from '@/auth';
import { signOutAction } from '@/app/(auth)/actions';

/** The account chip in the top bar: a Server Component, passed into the client screen as a prop (composition) */
export default async function Account() {
  const session = await auth();
  if (!session) return <Link href="/login" className="pill pill-link">Sign in</Link>;
  return (
    <form action={signOutAction} className="account">
      <span className="pill account-name" title={session.user.email ?? undefined}>
        {session.user.role === 'mentor' ? '🛡️ ' : ''}{session.user.name || session.user.email}
      </span>
      <button type="submit" className="pill pill-link">Sign out</button>
    </form>
  );
}
