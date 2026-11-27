import type { ApiError, CharacterClass, UserProfile, UserRole } from '../../types/lms';
import { DEMO_EMAIL_TO_HANDLE, DEMO_PROFILES } from '../demoData';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';

const DEMO_STORAGE_KEY = 'skillforge_demo_profile';

export interface AuthPayload {
  userId: string;
  email: string;
  profile: UserProfile;
  mode: 'supabase' | 'demo';
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
  handle: string;
  characterClass: CharacterClass;
  pipTint: number;
  pipAccessory: number;
}

export interface UpdateCharacterParams {
  fullName: string;
  bio: string;
  characterClass: CharacterClass;
  pipTint: number;
  pipAccessory: number;
}

interface ProfileRow {
  id: string;
  handle: string;
  full_name: string;
  role: UserRole;
  character_class: CharacterClass;
  pip_tint: number;
  pip_accessory: number;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    handle: row.handle,
    fullName: row.full_name,
    role: row.role,
    characterClass: row.character_class,
    pipTint: row.pip_tint,
    pipAccessory: row.pip_accessory,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

function readDemoStorage(): { email: string; profile: UserProfile } | null {
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { email: string; profile: UserProfile };
  } catch {
    return null;
  }
}

function writeDemoStorage(data: { email: string; profile: UserProfile } | null): void {
  try {
    if (!data) {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // ignore storage errors in restricted contexts
  }
}

export function normalizeApiError(error: unknown, fallbackMessage: string): ApiError {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message);
    const code = 'code' in error ? String((error as { code: unknown }).code) : 'unknown_error';
    return { code, message };
  }
  return { code: 'unknown_error', message: fallbackMessage };
}

export async function fetchCurrentSession(): Promise<AuthPayload | null> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    const stored = readDemoStorage();
    if (!stored) return null;
    return {
      userId: stored.profile.id,
      email: stored.email,
      profile: stored.profile,
      mode: 'demo',
    };
  }

  const { data: sessionData, error: sessionErr } = await client.auth.getSession();
  if (sessionErr) throw normalizeApiError(sessionErr, 'Failed to read session');
  const user = sessionData.session?.user;
  if (!user) return null;

  const { data: profileRow, error: profileErr } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileErr) throw normalizeApiError(profileErr, 'Failed to load profile');

  return {
    userId: user.id,
    email: user.email ?? '',
    profile: mapProfileRow(profileRow as ProfileRow),
    mode: 'supabase',
  };
}

export async function signInWithEmail(params: SignInParams): Promise<AuthPayload> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    const normalizedEmail = params.email.trim().toLowerCase();
    const mappedHandle = DEMO_EMAIL_TO_HANDLE[normalizedEmail];
    const matched = DEMO_PROFILES.find((p) => p.handle === mappedHandle);
    if (!matched || params.password.length < 4) {
      throw {
        code: 'invalid_credentials',
        message:
          'Demo sign-in supports maya@skillforge.local, dev@skillforge.local, or admin@skillforge.local (any password >= 4 chars).',
      } satisfies ApiError;
    }
    writeDemoStorage({ email: normalizedEmail, profile: matched });
    return {
      userId: matched.id,
      email: normalizedEmail,
      profile: matched,
      mode: 'demo',
    };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: params.email.trim(),
    password: params.password,
  });
  if (error || !data.user) {
    throw normalizeApiError(error, 'Sign-in failed');
  }

  const { data: profileRow, error: profileErr } = await client
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileErr) throw normalizeApiError(profileErr, 'Failed to load profile');

  return {
    userId: data.user.id,
    email: data.user.email ?? params.email,
    profile: mapProfileRow(profileRow as ProfileRow),
    mode: 'supabase',
  };
}

export async function registerNewAccount(params: RegisterParams): Promise<AuthPayload> {
  const cleanHandle = params.handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');

  if (cleanHandle.length < 3) {
    throw {
      code: 'validation_error',
      message: 'Handle must be at least 3 characters (letters, numbers, _ or -).',
    } satisfies ApiError;
  }

  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    const profile: UserProfile = {
      id: `demo-${cleanHandle}`,
      handle: cleanHandle,
      fullName: params.fullName.trim() || cleanHandle,
      role: 'student',
      characterClass: params.characterClass,
      pipTint: params.pipTint,
      pipAccessory: params.pipAccessory,
      bio: 'New SkillForge adventurer ready for Day 1 quests.',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    const email = params.email.trim().toLowerCase();
    writeDemoStorage({ email, profile });
    return {
      userId: profile.id,
      email,
      profile,
      mode: 'demo',
    };
  }

  const { data, error } = await client.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        handle: cleanHandle,
        character_class: params.characterClass,
        pip_tint: params.pipTint,
        pip_accessory: params.pipAccessory,
      },
    },
  });
  if (error || !data.user) {
    throw normalizeApiError(error, 'Account creation failed');
  }

  const { data: profileRow, error: profileErr } = await client
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileErr) throw normalizeApiError(profileErr, 'Profile provisioning failed');

  return {
    userId: data.user.id,
    email: data.user.email ?? params.email,
    profile: mapProfileRow(profileRow as ProfileRow),
    mode: 'supabase',
  };
}

export async function startGithubOAuth(): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    throw {
      code: 'oauth_unavailable',
      message: 'GitHub OAuth requires a running Supabase stack (.env configured).',
    } satisfies ApiError;
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw normalizeApiError(error, 'GitHub OAuth redirect failed');
}

export async function updateCharacterCustomization(
  userId: string,
  params: UpdateCharacterParams,
): Promise<UserProfile> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    const stored = readDemoStorage();
    const base =
      stored?.profile ??
      DEMO_PROFILES.find((p) => p.id === userId) ??
      ({
        id: userId,
        handle: 'hero',
        fullName: params.fullName,
        role: 'student',
        characterClass: params.characterClass,
        pipTint: params.pipTint,
        pipAccessory: params.pipAccessory,
        bio: params.bio,
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      } satisfies UserProfile);

    const updated: UserProfile = {
      ...base,
      fullName: params.fullName.trim() || base.fullName,
      bio: params.bio.trim(),
      characterClass: params.characterClass,
      pipTint: params.pipTint,
      pipAccessory: params.pipAccessory,
    };
    writeDemoStorage({
      email: stored?.email ?? `${updated.handle}@skillforge.local`,
      profile: updated,
    });
    return updated;
  }

  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: params.fullName.trim(),
      bio: params.bio.trim(),
      character_class: params.characterClass,
      pip_tint: params.pipTint,
      pip_accessory: params.pipAccessory,
    })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw normalizeApiError(error, 'Could not update character');
  return mapProfileRow(data as ProfileRow);
}

export async function signOutCurrentUser(): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    writeDemoStorage(null);
    return;
  }
  const { error } = await client.auth.signOut();
  if (error) throw normalizeApiError(error, 'Failed to sign out');
}
