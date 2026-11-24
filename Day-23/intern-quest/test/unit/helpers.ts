import type { QuestInput } from '@/lib/game';

/** A published normal quest on day `day`, with any fields overridden */
export const quest = (day: number, overrides: Partial<QuestInput> = {}): QuestInput => ({
  id: `q${day}`,
  day,
  date: `2026-11-${String(day).padStart(2, '0')}`,
  difficulty: 'normal',
  skills: ['javascript'],
  prLinks: [],
  blockers: '',
  status: 'published',
  ...overrides,
});

/** `days` consecutive quests from day 1 */
export const run = (days: number, overrides: Partial<QuestInput> = {}): QuestInput[] =>
  Array.from({ length: days }, (_, i) => quest(i + 1, overrides));
