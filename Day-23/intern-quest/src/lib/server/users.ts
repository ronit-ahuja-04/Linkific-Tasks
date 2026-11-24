import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './client';
import { DbError, fail } from './db';

/**
 * PEOPLE AND SIGN-IN. Two ways in:
 *   email + password   the password is stored only as a bcrypt hash (cost 10), checked with bcrypt.compare
 *   GitHub             the GitHub account id is linked to a user in the `accounts` table
 * The role (intern or mentor) lives in the database; the session carries a copy (see src/auth.ts).
 */
export type Role = 'intern' | 'mentor';
export interface AppUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: Role;
}

const USER_COLUMNS = 'id, email, name, image, role';
const BCRYPT_COST = 10;

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const { data, error } = await db().from('users').select(USER_COLUMNS).eq('email', email.toLowerCase()).maybeSingle();
  if (error) fail(error, 'Looking up the user');
  return data;
}

export async function getUser(id: string): Promise<AppUser | null> {
  const { data, error } = await db().from('users').select(USER_COLUMNS).eq('id', id).maybeSingle();
  if (error) fail(error, 'Loading the user');
  return data;
}

/** Register with email and password. Throws DbError('conflict') if the email is already registered. */
export async function createPasswordUser(email: string, password: string, name: string): Promise<AppUser> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const { data, error } = await db().from('users').insert({ email: email.toLowerCase(), name, password_hash: passwordHash }).select(USER_COLUMNS).single();
  if (error) fail(error, 'Registering');
  return data;
}

/**
 * Check an email and password. Returns the user, or null for ANY failure (unknown email, wrong password, a GitHub-only
 * account with no password), so a caller can not tell which: that would let an attacker find out who is registered.
 * An unknown email still runs a bcrypt comparison, so the answer takes about the same time either way.
 */
let dummyHash: string | null = null;
/** Made on first use, not at import: hashing uses random salt, and Next.js forbids randomness while prerendering */
const dummy = async (): Promise<string> => (dummyHash ??= await bcrypt.hash('not-a-real-password', BCRYPT_COST));
export async function verifyCredentials(email: string, password: string): Promise<AppUser | null> {
  const { data, error } = await db().from('users').select(`${USER_COLUMNS}, password_hash`).eq('email', email.toLowerCase()).maybeSingle();
  if (error) fail(error, 'Signing in');
  const matches = await bcrypt.compare(password, data?.password_hash ?? (await dummy()));
  if (!data || !data.password_hash || !matches) return null;
  const { password_hash: _hash, ...user } = data;
  return user;
}

export interface GithubIdentity {
  providerAccountId: string;
  email: string | null;
  name: string | null;
  image: string | null;
  login: string | null;
}

/**
 * Find or create the user behind a GitHub sign-in.
 *   1. this GitHub account is already linked        -> that user
 *   2. its email is not registered yet              -> a new user (no password), linked
 *   3. its email belongs to an existing user        -> REFUSED (DbError 'conflict')
 * Step 3 is deliberate: linking by email alone would let anyone who controls a GitHub account with your email take
 * over your password account. Merging accounts would need a signed-in confirmation, which is out of scope.
 */
export async function linkGithubAccount(identity: GithubIdentity): Promise<AppUser> {
  const linked = await db().from('accounts').select('user_id').eq('provider', 'github').eq('provider_account_id', identity.providerAccountId).maybeSingle();
  if (linked.error) fail(linked.error, 'Looking up the GitHub account');
  if (linked.data) {
    const user = await getUser(linked.data.user_id);
    if (user) return user;
  }

  // GitHub may hide the email; fall back to the no-reply address GitHub itself uses for that account
  const email = (identity.email ?? `${identity.providerAccountId}+${identity.login ?? 'user'}@users.noreply.github.com`).toLowerCase();
  if (await findUserByEmail(email)) throw new DbError('conflict', 'That email is already registered with a password. Sign in with your password instead.');

  const created = await db().from('users').insert({ email, name: identity.name ?? identity.login ?? '', image: identity.image }).select(USER_COLUMNS).single();
  if (created.error) fail(created.error, 'Creating the GitHub user');
  const link = await db().from('accounts').insert({ user_id: created.data.id, provider: 'github', provider_account_id: identity.providerAccountId });
  if (link.error) fail(link.error, 'Linking the GitHub account');
  return created.data;
}

/** Constant-time comparison for the mentor invite code (an early mismatch must not answer faster than a late one) */
export function inviteCodeMatches(given: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setRole(id: string, role: Role): Promise<void> {
  const { error } = await db().from('users').update({ role }).eq('id', id);
  if (error) fail(error, 'Changing the role');
}

export type RedeemResult = 'promoted' | 'already-mentor' | 'missing' | 'wrong';
/** Shared by POST /api/mentor and the character page's form: check the code, then promote */
export async function redeemInviteCode(user: { id: string; role: Role }, code: string): Promise<RedeemResult> {
  if (user.role === 'mentor') return 'already-mentor';
  if (!code) return 'missing';
  if (!inviteCodeMatches(code, process.env.MENTOR_INVITE_CODE)) return 'wrong';
  await setRole(user.id, 'mentor');
  return 'promoted';
}
