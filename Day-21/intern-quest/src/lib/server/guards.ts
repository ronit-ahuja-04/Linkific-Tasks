import 'server-only';
import { redirect } from 'next/navigation';
import { currentUser, type SessionUser } from './session';

/**
 * Page guards. The proxy already redirects signed-out visitors (fast, from the cookie), but every page checks again
 * here: the proxy is an optimisation, never the only lock (a matcher change could silently skip it).
 */
export async function requireUser(path: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}

export async function requireMentor(path: string): Promise<SessionUser> {
  const user = await requireUser(path);
  if (user.role !== 'mentor') redirect('/journal?notice=mentors-only');
  return user;
}
