import { forbidden, ok, problem, readJson, unauthorized } from '@/lib/server/http';
import { currentUser } from '@/lib/server/session';
import { redeemInviteCode } from '@/lib/server/users';

/**
 * POST /api/mentor   { code }   become a mentor (guild master) with the invite code.
 * The code lives only in the server environment variable MENTOR_INVITE_CODE: it never appears in client code.
 * The session picks up the new role on its next update (the character page's form does that for you) or sign-in.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const code = typeof json.value === 'object' && json.value !== null && 'code' in json.value && typeof json.value.code === 'string' ? json.value.code : '';
  switch (await redeemInviteCode(user, code)) {
    case 'already-mentor':
    case 'promoted':
      return ok({ role: 'mentor' });
    case 'missing':
      return problem(400, 'Enter the invite code.', { code: 'code is required' });
    case 'wrong':
      return forbidden('That invite code is not right.');
  }
}
