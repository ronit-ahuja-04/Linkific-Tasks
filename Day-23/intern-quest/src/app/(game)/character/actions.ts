'use server';

import { updateSession } from '@/auth';
import { currentUser } from '@/lib/server/session';
import { redeemInviteCode } from '@/lib/server/users';

/**
 * Redeem a mentor invite code from the character page. A Server Action is a POST to this page, so it checks the
 * session itself (the proxy is not a lock for actions). After promotion it refreshes the session token, whose jwt
 * callback re-reads the role from the database: no need to sign out and in again.
 */
export interface MentorState {
  result?: 'promoted' | 'wrong' | 'missing' | 'signed-out';
}

export async function redeemMentorAction(_previous: MentorState, data: FormData): Promise<MentorState> {
  const user = await currentUser();
  if (!user) return { result: 'signed-out' };
  const code = data.get('code');
  const result = await redeemInviteCode(user, typeof code === 'string' ? code.trim() : '');
  if (result === 'promoted' || result === 'already-mentor') {
    await updateSession({ user: {} });
    return { result: 'promoted' };
  }
  return { result };
}

