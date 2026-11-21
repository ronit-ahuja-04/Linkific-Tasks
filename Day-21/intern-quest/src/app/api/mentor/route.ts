import { forbidden, ok, problem, readJson, unauthorized } from '@/lib/server/http';
import { currentUser } from '@/lib/server/session';
import { inviteCodeMatches, setRole } from '@/lib/server/users';

/**
 * POST /api/mentor   { code }   become a mentor (guild master) with the invite code.
 * The code lives only in the server environment variable MENTOR_INVITE_CODE: it never appears in client code.
 * After a 200 the client refreshes its session (NextAuth `update()`), which re-reads the role from the database.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role === 'mentor') return ok({ role: 'mentor' });
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const code = typeof json.value === 'object' && json.value !== null && 'code' in json.value && typeof json.value.code === 'string' ? json.value.code : '';
  if (!code) return problem(400, 'Enter the invite code.', { code: 'code is required' });
  if (!inviteCodeMatches(code, process.env.MENTOR_INVITE_CODE)) return forbidden('That invite code is not right.');
  await setRole(user.id, 'mentor');
  return ok({ role: 'mentor' });
}
