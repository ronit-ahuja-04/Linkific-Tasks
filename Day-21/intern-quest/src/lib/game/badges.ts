import type { QuestInput } from './xp';

/**
 * AUTOMATIC BADGES: worked out from the quests alone, never stored, so they can not drift from the data.
 * Each rule also says on which day the badge was earned, which is how Pip knows a quest just earned one.
 * (Badges a mentor awards are rows in the `badges` table instead.)
 */
export const BADGE_IDS = ['first_quest', 'streak_7', 'boss_defeated', 'polyglot', 'pr_machine', 'unblocked'] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export interface BadgeInfo {
  name: string;
  description: string;
  icon: string;
}
export const BADGES: Record<BadgeId, BadgeInfo> = {
  first_quest: { name: 'First Quest', description: 'Logged a first day.', icon: '🗡️' },
  streak_7: { name: '7-Day Streak', description: 'Logged seven days in a row.', icon: '🔥' },
  boss_defeated: { name: 'Boss Defeated', description: 'Completed a boss quest.', icon: '👑' },
  polyglot: { name: 'Polyglot', description: 'Earned XP in five different skills.', icon: '🧭' },
  pr_machine: { name: 'PR Machine', description: 'Linked ten pull requests.', icon: '⚙️' },
  unblocked: { name: 'Unblocked', description: 'Hit a blocker, then beat a hard quest in the same skill.', icon: '🔓' },
};

export interface EarnedBadge {
  id: BadgeId;
  /** the internship day on which it was earned */
  day: number;
}

/** Earned badges, in the order they were earned */
export function earnedBadges(quests: readonly QuestInput[]): EarnedBadge[] {
  const done = quests.filter((q) => q.status === 'published').sort((a, b) => a.day - b.day);
  const earned: EarnedBadge[] = [];
  const award = (id: BadgeId, day: number): void => {
    if (!earned.some((b) => b.id === id)) earned.push({ id, day });
  };

  const skillsSeen = new Set<string>();
  const blockedSkills = new Set<string>();
  let prs = 0;
  let run = 0;
  let previousDay: number | null = null;

  for (const quest of done) {
    award('first_quest', quest.day);

    run = previousDay !== null && quest.day === previousDay + 1 ? run + 1 : 1;
    previousDay = quest.day;
    if (run >= 7) award('streak_7', quest.day);

    if (quest.difficulty === 'boss') award('boss_defeated', quest.day);

    for (const skill of quest.skills) skillsSeen.add(skill);
    if (skillsSeen.size >= 5) award('polyglot', quest.day);

    prs += quest.prLinks.length;
    if (prs >= 10) award('pr_machine', quest.day);

    const hard = quest.difficulty === 'hard' || quest.difficulty === 'boss';
    if (hard && quest.skills.some((s) => blockedSkills.has(s))) award('unblocked', quest.day);
    if (quest.blockers.trim() !== '') for (const skill of quest.skills) blockedSkills.add(skill);
  }
  return earned.sort((a, b) => a.day - b.day || BADGE_IDS.indexOf(a.id) - BADGE_IDS.indexOf(b.id));
}

/** The longest run of consecutive logged days */
export function longestStreak(quests: readonly QuestInput[]): number {
  const days = [...new Set(quests.filter((q) => q.status === 'published').map((q) => q.day))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && day === (days[i - 1] ?? Number.NaN) + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}
