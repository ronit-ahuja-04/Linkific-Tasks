import 'server-only';
import { connection } from 'next/server';
import { auth } from '@/auth';

/** Who is making the request, as the API needs to know it */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'intern' | 'mentor';
}

/**
 * The signed-in user, or null. The API tests replace this one function.
 * `connection()` first: this is request-time work by nature (it reads the session cookie, and NextAuth uses random
 * values while handling it). Without it, Next.js logged "unstable value crypto.getRandomValues() while prerendering"
 * on every signed-in page in production (found in the Vercel logs, not in tests: the pages still rendered).
 */
export async function currentUser(): Promise<SessionUser | null> {
  await connection();
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { id: user.id, name: user.name ?? '', email: user.email ?? '', role: user.role };
}
