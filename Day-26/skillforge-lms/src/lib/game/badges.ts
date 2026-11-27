export const BADGE_IDS = [
  'first_quest',
  'streak_7',
  'boss_slayer',
  'polyglot',
  'course_conqueror',
  'trusted_critic',
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

export interface BadgeInfo {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Record<BadgeId, BadgeInfo> = {
  first_quest: {
    id: 'first_quest',
    name: 'First Quest',
    description: 'Completed your very first lesson quest.',
    icon: '🗡️',
  },
  streak_7: {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Maintained a seven-day learning streak.',
    icon: '🔥',
  },
  boss_slayer: {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeated a module Boss Quiz.',
    icon: '👑',
  },
  polyglot: {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Earned XP across three or more skill domains.',
    icon: '🧭',
  },
  course_conqueror: {
    id: 'course_conqueror',
    name: 'Realm Conqueror',
    description: 'Earned a verifiable course completion certificate.',
    icon: '🏆',
  },
  trusted_critic: {
    id: 'trusted_critic',
    name: 'Trusted Critic',
    description: 'Published a verified course review.',
    icon: '⭐',
  },
};

export interface BadgeInput {
  completedLessons: number;
  streakDays: number;
  passedQuizzes: number;
  distinctSkillsCount: number;
  certificatesEarned: number;
  reviewsCount: number;
}

export function earnedBadgesFor(input: BadgeInput): BadgeInfo[] {
  const earned: BadgeInfo[] = [];
  if (input.completedLessons >= 1) earned.push(BADGES.first_quest);
  if (input.streakDays >= 7) earned.push(BADGES.streak_7);
  if (input.passedQuizzes >= 1) earned.push(BADGES.boss_slayer);
  if (input.distinctSkillsCount >= 3) earned.push(BADGES.polyglot);
  if (input.certificatesEarned >= 1) earned.push(BADGES.course_conqueror);
  if (input.reviewsCount >= 1) earned.push(BADGES.trusted_critic);
  return earned;
}
