import type { WispStage } from '../../components/characters/Wisp';

/** Light needed to reach each level grows gently: level n needs 100 * n * (n - 1) / 2 Light in total. */
export function levelForLight(light: number): number {
  let level = 1;
  while (lightForLevel(level + 1) <= light) level += 1;
  return level;
}

export function lightForLevel(level: number): number {
  return (100 * level * (level - 1)) / 2;
}

/** Progress (0–1) from the current level to the next. */
export function levelProgress(light: number): number {
  const level = levelForLight(light);
  const start = lightForLevel(level);
  const end = lightForLevel(level + 1);
  return (light - start) / (end - start);
}

/** Wisp's stage from the learner's level: Spark 1–4, Wisp 5–9, Lantern 10–19, Beacon 20+. */
export function stageForLevel(level: number): WispStage {
  if (level >= 20) return 'beacon';
  if (level >= 10) return 'lantern';
  if (level >= 5) return 'wisp';
  return 'spark';
}
