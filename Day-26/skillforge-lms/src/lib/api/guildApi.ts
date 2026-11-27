import type { CharacterClass, GuildEntry, UserProfile, UserRole } from '../../types/lms';
import { DEMO_GUILD_ENTRIES } from '../demoData';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import { normalizeApiError } from './authApi';

interface GuildViewRow {
  user_id: string;
  handle: string;
  full_name: string;
  role: UserRole;
  character_class: CharacterClass;
  pip_tint: number;
  pip_accessory: number;
  total_xp: number;
  completed_lessons: number;
  passed_quizzes: number;
  certificates_earned: number;
}

function mergeActiveDemoProfile(
  entries: GuildEntry[],
  activeProfile?: UserProfile | null,
): GuildEntry[] {
  if (!activeProfile) return entries;
  const idx = entries.findIndex((entry) => entry.userId === activeProfile.id);
  if (idx >= 0) {
    const existing = entries[idx];
    if (!existing) return entries;
    const updated = [...entries];
    updated[idx] = {
      ...existing,
      fullName: activeProfile.fullName,
      handle: activeProfile.handle,
      characterClass: activeProfile.characterClass,
      pipTint: activeProfile.pipTint,
      pipAccessory: activeProfile.pipAccessory,
    };
    return updated;
  }

  return [
    ...entries,
    {
      userId: activeProfile.id,
      handle: activeProfile.handle,
      fullName: activeProfile.fullName,
      role: activeProfile.role,
      characterClass: activeProfile.characterClass,
      pipTint: activeProfile.pipTint,
      pipAccessory: activeProfile.pipAccessory,
      totalXp: 0,
      completedLessons: 0,
      passedQuizzes: 0,
      certificatesEarned: 0,
      streakDays: 0,
      reviewsCount: 0,
      distinctSkillsCount: 0,
      skillXp: {},
    },
  ].sort((a, b) => b.totalXp - a.totalXp);
}

export async function fetchGuildBoard(
  activeDemoProfile?: UserProfile | null,
): Promise<GuildEntry[]> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return mergeActiveDemoProfile([...DEMO_GUILD_ENTRIES], activeDemoProfile).sort(
      (a, b) => b.totalXp - a.totalXp,
    );
  }

  const { data, error } = await client.from('guild_leaderboard').select('*').limit(50);
  if (error) throw normalizeApiError(error, 'Failed to load Guild Hall leaderboard');

  return (data as GuildViewRow[]).map((row) => ({
    userId: row.user_id,
    handle: row.handle,
    fullName: row.full_name,
    role: row.role,
    characterClass: row.character_class,
    pipTint: row.pip_tint,
    pipAccessory: row.pip_accessory,
    totalXp: row.total_xp,
    completedLessons: row.completed_lessons,
    passedQuizzes: row.passed_quizzes,
    certificatesEarned: row.certificates_earned,
    streakDays: row.completed_lessons > 0 ? Math.min(7, row.completed_lessons) : 0,
    reviewsCount: 0,
    distinctSkillsCount: row.completed_lessons > 0 ? 1 : 0,
    skillXp: {},
  }));
}
