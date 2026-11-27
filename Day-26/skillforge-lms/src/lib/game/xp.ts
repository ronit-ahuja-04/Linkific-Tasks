import type { CharacterClass, Difficulty, PipStage, SkillTag } from '../../types/lms';
import { CLASS_INFO, DIFFICULTY_XP, GAME_RULES, TITLES } from './catalog';

export const STAGE_INFO: Record<PipStage, { name: string; from: number }> = {
  egg: { name: 'Egg', from: 1 },
  sprout: { name: 'Sprout', from: 3 },
  sprite: { name: 'Sprite', from: 6 },
  guardian: { name: 'Guardian', from: 10 },
};

export interface LevelProgress {
  level: number;
  into: number;
  span: number;
  fraction: number;
}

/** Integer XP threshold for the start of `level` (scale * L * (L - 1) / 2). */
export function levelStart(level: number, scale: number): number {
  return (scale * level * (level - 1)) / 2;
}

/** Computes level using integer arithmetic (never floats or square roots). */
export function levelFor(xp: number, scale: number): number {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while ((scale * (level + 1) * level) / 2 <= safeXp) {
    level += 1;
  }
  return level;
}

export function progressFor(xp: number, scale: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = levelFor(safeXp, scale);
  const start = levelStart(level, scale);
  const span = levelStart(level + 1, scale) - start;
  return {
    level,
    into: safeXp - start,
    span,
    fraction: span > 0 ? (safeXp - start) / span : 0,
  };
}

export function titleFor(level: number): string {
  let title = TITLES[0]?.title ?? 'Trainee';
  for (const step of TITLES) {
    if (level >= step.from) {
      title = step.title;
    }
  }
  return title;
}

export function stageFor(level: number): PipStage {
  if (level >= STAGE_INFO.guardian.from) return 'guardian';
  if (level >= STAGE_INFO.sprite.from) return 'sprite';
  if (level >= STAGE_INFO.sprout.from) return 'sprout';
  return 'egg';
}

/**
 * Anti-farming lesson XP calculation: only the first completion awards XP.
 * Home skills for the learner's character class gain +10% (rounded down).
 */
export function lessonXpFor(
  difficulty: Difficulty,
  skillTag: SkillTag,
  characterClass: CharacterClass,
  isFirstCompletion: boolean,
): number {
  if (!isFirstCompletion) return 0;
  const base = DIFFICULTY_XP[difficulty];
  const isHomeSkill = CLASS_INFO[characterClass].home.includes(skillTag);
  return isHomeSkill
    ? Math.floor((base * GAME_RULES.bonusNumerator) / GAME_RULES.bonusDenominator)
    : base;
}

/**
 * Anti-farming quiz XP calculation: first passing attempt grants base + score;
 * retakes only award improvement delta if the learner beats their previous best score.
 */
export function quizXpFor(
  baseXp: number,
  scorePercent: number,
  passingScore: number,
  previousBestScore: number,
  alreadyPassed: boolean,
): number {
  if (scorePercent < passingScore) return 0;
  if (!alreadyPassed) return baseXp + scorePercent;
  return scorePercent > previousBestScore ? scorePercent - previousBestScore : 0;
}
