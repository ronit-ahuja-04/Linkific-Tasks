import 'server-only';
import { auth } from '@/auth';

/** Who is making the request, as the API needs to know it */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'intern' | 'mentor';
}

/**
 * The signed-in user, or null. Reads the NextAuth session cookie (which also makes every caller request-time work,
 * so a protected answer is never prerendered at build time). The API tests replace this one function.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return { id: user.id, name: user.name ?? '', email: user.email ?? '', role: user.role };
}
