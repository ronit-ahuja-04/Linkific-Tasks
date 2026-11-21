import 'server-only';
import { connection } from 'next/server';

/** Who is making the request, as the API needs to know it */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'intern' | 'mentor';
}

/**
 * The signed-in user, or null.
 *
 * MILESTONE 2: there is no sign-in yet, so this always answers null and every protected route answers 401.
 * The API tests replace this function with a fake user. MILESTONE 3 makes it read the NextAuth session.
 * `connection()` marks every caller as request-time work, so a protected answer is never prerendered at build time.
 */
export async function currentUser(): Promise<SessionUser | null> {
  await connection();
  return null;
}
