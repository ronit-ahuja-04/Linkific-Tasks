'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { DbError } from '@/lib/server/db';
import { createPasswordUser } from '@/lib/server/users';
import { parseRegistration, safeNext } from '@/lib/validation';

/**
 * SERVER ACTIONS for the sign-in forms. They run on the server, called straight from a <form action>.
 * NextAuth's `signIn` ends a successful sign-in by THROWING a redirect: only AuthErrors are caught here, the
 * redirect must be re-thrown so Next.js can perform it.
 */
export interface FormState {
  error?: string;
  fields?: Record<string, string>;
  values?: { email?: string; name?: string };
}

const SIGN_IN_UNAVAILABLE = 'Signing in is not working right now: the problem is on our side, not your password. Try again in a moment.';

const field = (data: FormData, name: string): string => {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
};

export async function loginAction(_previous: FormState, data: FormData): Promise<FormState> {
  const email = field(data, 'email');
  try {
    await signIn('credentials', { email, password: field(data, 'password'), redirectTo: safeNext(field(data, 'next')) });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // anything but a wrong password is OUR problem (e.g. the database did not answer): say so, so nobody retypes a
      // correct password (Day 23 copy review)
      return { error: error.type === 'CredentialsSignin' ? 'That email and password do not match.' : SIGN_IN_UNAVAILABLE, values: { email } };
    }
    throw error; // the success redirect
  }
}

export async function registerAction(_previous: FormState, data: FormData): Promise<FormState> {
  const parsed = parseRegistration({ email: field(data, 'email'), password: field(data, 'password'), name: field(data, 'name') });
  const values = { email: field(data, 'email'), name: field(data, 'name') };
  if (!parsed.ok) return { error: 'Check the highlighted fields.', fields: parsed.errors, values };
  try {
    await createPasswordUser(parsed.value.email, parsed.value.password, parsed.value.name);
  } catch (error) {
    if (error instanceof DbError && error.kind === 'conflict') return { error: 'That email is already registered. Sign in instead.', values };
    // the database did not answer: keep the form and say so, instead of replacing the page with an error screen
    if (error instanceof DbError && error.kind === 'unavailable') return { error: 'Your account could not be created right now: the problem is on our side. Nothing was saved; try again in a moment.', values };
    throw error;
  }
  try {
    await signIn('credentials', { email: parsed.value.email, password: parsed.value.password, redirectTo: safeNext(field(data, 'next')) });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: 'Your account was created, but signing in failed. Try signing in.', values };
    throw error;
  }
}

export async function githubAction(data: FormData): Promise<void> {
  await signIn('github', { redirectTo: safeNext(field(data, 'next')) });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
