import {
  BADGES, CLASS_INFO, SKILL_LABELS, changeFrom, computeStats, earnedBadges, longestStreak, pipReaction, pipState, topSkills,
  type CharacterClass, type Difficulty, type PipMood, type PipStage, type QuestInput,
} from '@/lib/game';

/**
 * What the character screen needs, worked out on the SERVER from the database rows and the game rules.
 * Only plain, serialisable data crosses to the Client Component (no functions, no Maps, no secrets).
 */
export interface PipLine {
  day: number;
  title: string;
  line: string;
  mood: PipMood;
}
export interface CharacterView {
  handle: string;
  name: string;
  bio: string;
  classLabel: string;
  motto: string;
  level: number;
  title: string;
  totalXp: number;
  into: number;
  span: number;
  fraction: number;
  questCount: number;
  streak: number;
  skills: { label: string; level: number; xp: number; fraction: number }[];
  badges: { icon: string; name: string; description: string; day: number | null; mentor: boolean }[];
  pip: { stage: PipStage; mood: PipMood; lines: PipLine[]; tint: number; accessory: number };
  quests: { day: number; title: string; difficulty: Difficulty; xp: number; blockers: string }[];
}

export interface QuestWithTitle extends QuestInput {
  title: string;
}

export function buildCharacterView(
  character: { handle: string; displayName: string; bio: string; class: CharacterClass; avatar?: { colour: number; accessory: number } },
  quests: readonly (QuestWithTitle & { isPublic?: boolean })[],
  mentorBadges: readonly { icon: string; name: string; note: string }[],
  todayIso: string,
  /** for public pages: XP and badges still count private quests, but their titles and Pip's lines about them stay hidden */
  { publicOnly = false }: { publicOnly?: boolean } = {},
): CharacterView {
  const stats = computeStats(character.class, quests);
  const published = quests.filter((q) => q.status === 'published').sort((a, b) => a.day - b.day);
  const shown = publicOnly ? published.filter((q) => q.isPublic !== false) : published;
  const skills = topSkills(stats, 6);
  const top = skills[0]?.xp ?? 1;
  const pip = pipState(character.class, quests, stats, todayIso);
  // Pip's reaction to each of the last five quests, newest first (tapping Pip steps through them)
  const lines = shown.slice(-5).reverse().map((quest): PipLine => {
    const before = published.filter((q) => q.day < quest.day);
    const reaction = pipReaction(quest, changeFrom(character.class, before, quest));
    return { day: quest.day, title: quest.title, line: reaction.line, mood: reaction.mood };
  });
  return {
    handle: character.handle,
    name: character.displayName,
    bio: character.bio,
    classLabel: CLASS_INFO[character.class].label,
    motto: CLASS_INFO[character.class].motto,
    level: stats.progress.level,
    title: stats.title,
    totalXp: stats.totalXp,
    into: stats.progress.into,
    span: stats.progress.span,
    fraction: stats.progress.fraction,
    questCount: stats.publishedCount,
    streak: longestStreak(quests),
    skills: skills.map((s) => ({ label: SKILL_LABELS[s.skill], level: s.level, xp: s.xp, fraction: s.xp / top })),
    badges: [
      ...earnedBadges(quests).map((b) => ({ ...BADGES[b.id], day: b.day, mentor: false })),
      ...mentorBadges.map((b) => ({ icon: b.icon, name: b.name, description: b.note, day: null, mentor: true })),
    ],
    pip: { ...pip, lines, tint: character.avatar?.colour ?? 0, accessory: character.avatar?.accessory ?? 0 },
    quests: [...shown].reverse().map((q) => ({ day: q.day, title: q.title, difficulty: q.difficulty, xp: stats.quests.get(q.id)?.total ?? 0, blockers: q.blockers })),
  };
}
