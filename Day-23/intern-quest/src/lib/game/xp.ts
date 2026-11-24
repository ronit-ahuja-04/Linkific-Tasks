import { entries, record } from '../typed';
import { CLASS_INFO, DIFFICULTY_XP, RULES, SKILLS, TITLES, type CharacterClass, type Difficulty, type Skill } from './catalog';

/** What the rules need to know about a quest (a subset of the database row, so tests can build one in a line) */
export interface QuestInput {
  id: string;
  /** Day N of the internship: the streak bonus looks at day N-1 */
  day: number;
  /** ISO date, YYYY-MM-DD */
  date: string;
  difficulty: Difficulty;
  skills: readonly Skill[];
  prLinks: readonly string[];
  blockers: string;
  status: 'draft' | 'published';
}

export interface QuestXp {
  base: number;
  prBonus: number;
  /** true when day N-1 was also logged (published) */
  streak: boolean;
  /** base + PR bonus, then the streak bonus */
  raw: number;
  /** XP per skill, after the class bonus on home skills */
  shares: Partial<Record<Skill, number>>;
  /** what the quest adds to the character: the sum of its shares */
  total: number;
}

const bonus = (n: number): number => Math.floor((n * RULES.bonusNumerator) / RULES.bonusDenominator);

/**
 * XP for one quest. Integer arithmetic only (×11/10 rounded down, not ×1.1), so TypeScript and the SQL view in
 * the database give exactly the same numbers; a test checks they do.
 */
export function questXp(quest: QuestInput, characterClass: CharacterClass, loggedDays: ReadonlySet<number>): QuestXp {
  const base = DIFFICULTY_XP[quest.difficulty];
  const prBonus = RULES.prBonus * Math.min(quest.prLinks.length, RULES.prBonusCap);
  const streak = loggedDays.has(quest.day - 1);
  const raw = streak ? bonus(base + prBonus) : base + prBonus;
  const share = quest.skills.length > 0 ? Math.floor(raw / quest.skills.length) : 0;
  const home = CLASS_INFO[characterClass].home;
  const shares: Partial<Record<Skill, number>> = {};
  for (const skill of quest.skills) shares[skill] = home.includes(skill) ? bonus(share) : share;
  const total = Object.values(shares).reduce((sum, xp) => sum + xp, 0);
  return { base, prBonus, streak, raw, shares, total };
}

/** The level for an amount of XP: level L starts at scale × L(L-1)/2. Counted up in integers (no square roots). */
export function levelFor(xp: number, scale: number): number {
  let level = 1;
  while ((scale * (level + 1) * level) / 2 <= xp) level += 1;
  return level;
}

/** The XP at which a level starts */
export const levelStart = (level: number, scale: number): number => (scale * level * (level - 1)) / 2;

export interface LevelProgress {
  level: number;
  /** XP into the current level */
  into: number;
  /** XP the current level spans */
  span: number;
  /** 0 to 1 */
  fraction: number;
}
export function progressFor(xp: number, scale: number): LevelProgress {
  const level = levelFor(xp, scale);
  const start = levelStart(level, scale);
  const span = levelStart(level + 1, scale) - start;
  return { level, into: xp - start, span, fraction: (xp - start) / span };
}

export function titleFor(level: number): string {
  let title = TITLES[0]?.title ?? 'Trainee';
  for (const step of TITLES) if (level >= step.from) title = step.title;
  return title;
}

export interface SkillStat {
  xp: number;
  level: number;
}
export interface CharacterStats {
  totalXp: number;
  progress: LevelProgress;
  title: string;
  skills: Record<Skill, SkillStat>;
  /** per published quest id */
  quests: Map<string, QuestXp>;
  publishedCount: number;
}

/** Everything the character sheet shows, from the class and the quests. Drafts earn nothing. */
export function computeStats(characterClass: CharacterClass, quests: readonly QuestInput[]): CharacterStats {
  const published = quests.filter((q) => q.status === 'published');
  const loggedDays = new Set(published.map((q) => q.day));
  const skillXp = record(SKILLS, () => 0);
  const perQuest = new Map<string, QuestXp>();
  for (const quest of published) {
    const xp = questXp(quest, characterClass, loggedDays);
    perQuest.set(quest.id, xp);
    for (const [skill, amount] of entries(xp.shares)) skillXp[skill] += amount;
  }
  const totalXp = Object.values(skillXp).reduce((sum, xp) => sum + xp, 0);
  const progress = progressFor(totalXp, RULES.characterLevelScale);
  const skills = record(SKILLS, (s): SkillStat => ({ xp: skillXp[s], level: levelFor(skillXp[s], RULES.skillLevelScale) }));
  return { totalXp, progress, title: titleFor(progress.level), skills, quests: perQuest, publishedCount: published.length };
}

/** The skills ordered by XP, highest first (ties alphabetical), only those with any XP */
export function topSkills(stats: CharacterStats, limit: number = SKILLS.length): { skill: Skill; xp: number; level: number }[] {
  return SKILLS.map((skill) => ({ skill, ...stats.skills[skill] }))
    .filter((s) => s.xp > 0)
    .sort((a, b) => b.xp - a.xp || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}
