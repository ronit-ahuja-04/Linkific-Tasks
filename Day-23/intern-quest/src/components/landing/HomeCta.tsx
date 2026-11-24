import Link from 'next/link';
import { connection } from 'next/server';
import { auth } from '@/auth';
import Account from '@/components/auth/Account';

/** The top-right of the home page: depends on the session, so it streams in after the (cached) rest of the page */
export default async function HomeCta() {
  await connection(); // per request: it reads the session cookie (and sign-out uses random values)
  const session = await auth();
  if (session) {
    return (
      <div className="home-cta">
        <Link href="/journal" className="pill pill-link pill-dark">Open my journal</Link>
        <Account />
      </div>
    );
  }
  return (
    <div className="home-cta">
      <Link href="/login" className="pill pill-link">Sign in</Link>
      <Link href="/register" className="pill pill-link pill-dark">Start your quest</Link>
    </div>
  );
}
