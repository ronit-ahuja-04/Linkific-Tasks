import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { computeStats, stageFor, topSkills, SKILL_LABELS } from '@/lib/game';
import { getCharacterByHandle, listCharacters, listMentorBadges, listQuests, type Character, type MentorBadge, type Quest } from './db';
import { tags } from './revalidate';

/**
 * CACHED PUBLIC DATA (`use cache`). These reads are shared by every visitor, so they are computed once and reused:
 * the Guild hall board and each public character sheet. Every write expires the matching tag (revalidate.ts), and
 * `cacheLife('hours')` is the safety net if a tag were ever missed.
 * Only plain data is returned (no class instances, no functions), because cached results are serialised.
 */
export interface PublicSheet {
  character: Character;
  quests: Quest[];
  badges: MentorBadge[];
}

export async function getPublicSheet(handle: string): Promise<PublicSheet | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.character(handle));
  const character = await getCharacterByHandle(handle);
  if (!character || !character.isPublic) return null;
  const [quests, badges] = await Promise.all([listQuests(character.userId, 'published'), listMentorBadges(character.userId)]);
  return { character, quests, badges };
}

export interface BoardEntry {
  handle: string;
  displayName: string;
  classLabel: string;
  level: number;
  title: string;
  totalXp: number;
  questCount: number;
  topSkill: string | null;
  stage: ReturnType<typeof stageFor>;
  tint: number;
  accessory: number;
}

const CLASS_LABELS = { frontend_mage: 'Frontend Mage', backend_knight: 'Backend Knight', fullstack_ranger: 'Full-stack Ranger', design_bard: 'Design Bard' } as const;

/** Every public character with a level, highest first: the leaderboard on the home page */
export async function getGuildBoard(): Promise<BoardEntry[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.guild);
  const characters = await listCharacters();
  const entries = await Promise.all(
    characters.map(async (c): Promise<BoardEntry> => {
      const stats = computeStats(c.class, await listQuests(c.userId, 'published'));
      const top = topSkills(stats, 1)[0];
      return {
        handle: c.handle, displayName: c.displayName, classLabel: CLASS_LABELS[c.class], level: stats.progress.level, title: stats.title,
        totalXp: stats.totalXp, questCount: stats.publishedCount, topSkill: top ? SKILL_LABELS[top.skill] : null,
        stage: stageFor(stats.progress.level), tint: c.avatar.colour, accessory: c.avatar.accessory,
      };
    }),
  );
  return entries.filter((e) => e.questCount > 0).sort((a, b) => b.totalXp - a.totalXp || a.handle.localeCompare(b.handle));
}

/** For the sitemap: the handles of public characters */
export async function listPublicHandles(): Promise<string[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(tags.guild);
  return (await listCharacters()).map((c) => c.handle);
}
