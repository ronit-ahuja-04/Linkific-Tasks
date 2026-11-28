import type { Session } from '@supabase/supabase-js';
import { toAppError } from '../errors';
import { supabase } from '../supabase';
import type { Profile } from '../types';

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  handle: string;
  timezone: string;
}

async function loadProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase().from('profiles').select('*').eq('id', userId).single();
  if (error) throw toAppError(error);
  return data as Profile;
}

export async function currentProfile(): Promise<Profile | null> {
  const { data, error } = await supabase().auth.getSession();
  if (error) throw toAppError(error);
  if (!data.session) return null;
  return loadProfile(data.session.user.id);
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw toAppError(error);
  return loadProfile(data.user.id);
}

/** Sign-up metadata never carries a role: the database makes every new account a learner. */
export async function signUp(input: SignUpInput): Promise<Profile | null> {
  const { data, error } = await supabase().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        display_name: input.displayName.trim(),
        handle: input.handle.trim().toLowerCase(),
        timezone: input.timezone,
      },
    },
  });
  if (error) throw toAppError(error);
  if (!data.session || !data.user) return null; // email confirmation required (cloud setting)
  return loadProfile(data.user.id);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase().auth.signOut();
  if (error) throw toAppError(error);
}

export function onAuthChange(listener: (session: Session | null) => void): () => void {
  const { data } = supabase().auth.onAuthStateChange((_event, session) => listener(session));
  return () => data.subscription.unsubscribe();
}

export { loadProfile };

/** Email a reset link that opens /reset-password, where the link's one-time session lets them pick a new password. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw toAppError(error);
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw toAppError(error);
}
