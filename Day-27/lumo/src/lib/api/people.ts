import { toAppError } from '../errors';
import { supabase } from '../supabase';
import type { Profile, Role } from '../types';

export async function listPeople(): Promise<Profile[]> {
  const { data, error } = await supabase()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw toAppError(error);
  return data as Profile[];
}

/** Admin only (checked in the database), logged in the audit log, refuses to remove the last admin. */
export async function setRole(userId: string, role: Role): Promise<void> {
  const { error } = await supabase().rpc('set_user_role', { p_user: userId, p_role: role });
  if (error) throw toAppError(error);
}
