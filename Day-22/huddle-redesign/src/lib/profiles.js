/**
 * PROFILES + AUTH HELPERS: pure functions, the supabase client is always the FIRST argument so a test can
 * hand in a fake. Nothing here touches React.
 */

export const AVATAR_BUCKET = 'avatars';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // same limit as the bucket (see migration 5), checked here too for a quick answer
export const AVATAR_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
export const BIO_MAX = 280;
export const NAME_MAX = 80;

// ---- friendly messages --------------------------------------------------------------------------------
/** Turn a supabase-js Auth error into a sentence for a person. (Auth errors have `.code`, `.status`, `.message`.) */
export function friendlyAuthError(error) {
  if (!error) return '';
  const code = error.code ?? '';
  const message = error.message ?? '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return 'Email or password is incorrect.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) return 'Please confirm your email first: we sent you a link.';
  if (code === 'user_already_exists' || /already registered/i.test(message)) return 'An account with this email already exists. Try signing in.';
  if (code === 'weak_password' || /password should be at least/i.test(message)) return 'That password is too weak: use at least 6 characters.';
  if (code === 'same_password' || /different from the old password/i.test(message)) return 'Choose a password that is different from your current one.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (code === 'otp_expired' || (/expired|invalid/i.test(message) && /link|otp|token/i.test(message))) return 'This link is invalid or has expired.';
  if (code === 'validation_failed' || /unable to validate email/i.test(message)) return 'Please enter a valid email address.';
  if (code === 'signup_disabled') return 'Sign-ups are turned off.';
  if (code === 'session_not_found' || code === 'refresh_token_not_found') return 'Your session has ended. Please sign in again.';
  return message || 'Something went wrong. Please try again.';
}

/** Postgres errors from `.update()` on profiles: 23505 unique_violation, 23514 check_violation */
export function friendlyProfileError(error) {
  if (!error) return '';
  if (error.code === '23505') return 'That username is taken.';
  if (error.code === '23514') {
    if (/username/i.test(`${error.message} ${error.details ?? ''}`)) return USERNAME_RULE;
    if (/bio/i.test(`${error.message} ${error.details ?? ''}`)) return `Bio can be at most ${BIO_MAX} characters.`;
    return `Check your input: usernames are ${USERNAME_RULE_SHORT}; the name up to ${NAME_MAX} and the bio up to ${BIO_MAX} characters.`;
  }
  if (error.code === '42501') return 'You are not allowed to change this profile.';
  // PostgREST's "Cannot coerce the result to a single JSON object": the update matched no row, i.e. there is no
  // profile for this session any more (the account was deleted while you were signed in)
  if (error.code === 'PGRST116') return 'Your account could not be found on the server, so nothing was saved. Please sign in again.';
  return error.message || 'Could not save your profile.';
}

// ---- validation ---------------------------------------------------------------------------------------
const USERNAME_RULE_SHORT = '3 to 24 characters: a-z, 0-9 and _';
export const USERNAME_RULE = `Username must be ${USERNAME_RULE_SHORT}.`;
export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/; // the same rule as the CHECK constraint on profiles.username

/** '' means valid */
export function validateUsername(value, { required = false } = {}) {
  const v = (value ?? '').trim();
  if (!v) return required ? 'Username is required.' : '';
  return USERNAME_PATTERN.test(v) ? '' : USERNAME_RULE;
}
export function validateEmail(value) {
  const v = (value ?? '').trim();
  if (!v) return 'Email is required.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.';
}
export function validatePassword(value) {
  if (!value) return 'Password is required.';
  return value.length >= 6 ? '' : 'Password must be at least 6 characters.';
}

/** A rough hint, not a security rule: the only rule the server enforces is the minimum length */
export function passwordStrength(value) {
  const v = value ?? '';
  if (!v) return { score: 0, label: '' };
  let score = 0;
  if (v.length >= 6) score += 1;
  if (v.length >= 10) score += 1;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score += 1;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score += 1;
  if (v.length < 6) score = 0;
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
  return { score, label: labels[score] };
}

/** '' means valid. `file` is a File from <input type="file"> */
export function validateAvatarFile(file) {
  if (!file) return 'Choose an image first.';
  if (!AVATAR_TYPES[file.type]) return 'Use a PNG, JPEG, WebP or GIF image.';
  if (file.size > AVATAR_MAX_BYTES) return 'The image is larger than 2 MiB.';
  if (file.size === 0) return 'That file is empty.';
  return '';
}

// ---- Auth -----------------------------------------------------------------------------------------------
/** Where the app should go after the user signs in: only an in-app path (never an external URL) */
export function safeRedirect(from) {
  const path = typeof from === 'string' ? from : from?.pathname ? `${from.pathname}${from.search ?? ''}` : '/';
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}

/** The providers a user signed in with, e.g. ['email', 'github'] */
export function providersOf(user) {
  const list = user?.app_metadata?.providers;
  if (Array.isArray(list) && list.length) return list;
  return user?.app_metadata?.provider ? [user.app_metadata.provider] : [];
}

/** Sign out. scope 'local' = this browser only; 'global' = revokes EVERY refresh token of the user on every device */
export function signOutScope(client, scope = 'local') {
  return client.auth.signOut({ scope });
}

// ---- profile rows --------------------------------------------------------------------------------------
/**
 * Save my profile. SQL: update public.profiles set full_name=..., username=..., bio=... where id = <me>
 * Row Level Security adds "and id = auth.uid()" by itself, so even a wrong id could not touch someone else's row.
 * `.select().single()` asks Postgres to RETURN the updated row (otherwise an update returns nothing).
 */
export async function updateProfile(client, userId, { fullName, username, bio }) {
  const patch = {
    full_name: (fullName ?? '').trim() || null,
    bio: (bio ?? '').trim() || null,
  };
  // an empty username must not be sent: the column is NOT NULL, so leave it as it is
  if ((username ?? '').trim()) patch.username = username.trim();
  const { data, error } = await client.from('profiles').update(patch).eq('id', userId).select().single();
  return { data, error };
}

/** The storage path of a new avatar. A NEW name each time so the browser never shows a cached old picture */
export function avatarPathFor(userId, file, stamp) {
  return `${userId}/avatar-${stamp}.${AVATAR_TYPES[file.type] ?? 'png'}`;
}

/**
 * Upload a new picture: (1) put the file in the PUBLIC bucket under my own folder (the storage policy checks
 * the first folder is my id), (2) save the path on my profile row, (3) delete the old object.
 * If step 2 fails the new object is removed again so nothing is left behind.
 */
export async function uploadAvatar(client, { userId, file, oldPath, stamp }) {
  const problem = validateAvatarFile(file);
  if (problem) return { data: null, error: { message: problem, code: 'invalid_file' } };
  const path = avatarPathFor(userId, file, stamp);
  const bucket = client.storage.from(AVATAR_BUCKET);
  const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });
  if (uploadError) return { data: null, error: uploadError };
  const { data, error } = await client.from('profiles').update({ avatar_path: path }).eq('id', userId).select().single();
  if (error) {
    await bucket.remove([path]);
    return { data: null, error };
  }
  if (oldPath && oldPath !== path) await bucket.remove([oldPath]); // best effort: a leftover file is harmless
  return { data, error: null };
}

/** "Remove picture": clear the column first (so the app stops showing it), then delete the object */
export async function removeAvatar(client, { userId, path }) {
  const { data, error } = await client.from('profiles').update({ avatar_path: null }).eq('id', userId).select().single();
  if (error) return { data: null, error };
  if (path) await client.storage.from(AVATAR_BUCKET).remove([path]);
  return { data, error: null };
}
