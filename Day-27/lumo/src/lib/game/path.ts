/**
 * Where a learner is on an island's path. The path is linear from the unit Wisp placed them in: finished lessons
 * are "done", the first unfinished one is "current", later ones are "locked". Units before the placement are
 * "open" (skipped, but always playable). Locking is guidance, not security: nothing is awarded by opening a lesson.
 */
export type StoneState = 'done' | 'current' | 'open' | 'locked';

export interface PathUnit {
  position: number;
  lessons: { id: string }[];
}

export function pathState(
  units: PathUnit[],
  completed: ReadonlySet<string>,
  startUnit = 1,
): Map<string, StoneState> {
  const states = new Map<string, StoneState>();
  let currentFound = false;
  for (const unit of units) {
    const skipped = unit.position < startUnit;
    for (const lesson of unit.lessons) {
      if (completed.has(lesson.id)) states.set(lesson.id, 'done');
      else if (skipped) states.set(lesson.id, 'open');
      else if (!currentFound) {
        states.set(lesson.id, 'current');
        currentFound = true;
      } else states.set(lesson.id, 'locked');
    }
  }
  return states;
}

/** The learner's "today" in their own timezone, as YYYY-MM-DD (the server uses the same rule). */
export function todayIn(timezone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** Has today's flame been lit? */
export function litToday(lastGoalDate: string | null, timezone: string, now = new Date()): boolean {
  return lastGoalDate === todayIn(timezone, now);
}

function daysBetween(fromDay: string, toDay: string): number {
  return Math.round(
    (Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86400000,
  );
}

/** Whole days since the learner last lit their flame (null if never). */
export function daysAway(
  lastGoalDate: string | null,
  timezone: string,
  now = new Date(),
): number | null {
  return lastGoalDate ? daysBetween(lastGoalDate, todayIn(timezone, now)) : null;
}

/**
 * The flame as it really stands today. The stored number only changes when the learner next finishes something,
 * so a flame that has gone out would otherwise still show its old count. Same rule as the server: yesterday keeps
 * it alive; one missed day is covered by an Ember if there is one.
 */
export function effectiveFlame(
  p: { flame_days: number; last_goal_date: string | null; embers: number; timezone: string },
  now = new Date(),
): number {
  const away = daysAway(p.last_goal_date, p.timezone, now);
  if (away === null) return 0;
  if (away <= 1) return p.flame_days;
  if (away === 2 && p.embers > 0) return p.flame_days;
  return 0;
}
