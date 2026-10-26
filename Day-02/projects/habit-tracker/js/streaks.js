/**
 * streaks.js - Pure Streak Computation Algorithms
 * Pure logic: Zero DOM interaction, takes data and returns data.
 */

import { addDays, toDateKey } from './dates.js';

/**
 * Checks whether a habit was completed on a specific local date.
 * @param {string[]} checkIns - Array of YYYY-MM-DD date strings
 * @param {string} dateKey - Target YYYY-MM-DD string
 * @returns {boolean}
 */
// CONCEPT: some
export function isDoneOn(checkIns, dateKey) {
  if (!Array.isArray(checkIns)) return false;
  return checkIns.some((d) => d === dateKey);
}

/**
 * Computes the current active streak.
 * Rule: Consecutive days with a check-in ending today.
 * If today is not checked yet, walk back from yesterday (streak is still alive until day ends).
 * If yesterday is also missing, streak is 0.
 * @param {string[]} checkIns
 * @param {string} [todayKey=toDateKey()]
 * @returns {number}
 */
// CONCEPT: while-loop
// CONCEPT: ternary
export function getCurrentStreak(checkIns, todayKey = toDateKey()) {
  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    return 0;
  }

  const daysSet = new Set(checkIns);

  // If today is checked, start cursor from today; otherwise start from yesterday
  let cursor = daysSet.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let streak = 0;

  // Walk back day by day while the cursor date exists in the check-ins set
  while (daysSet.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/**
 * Computes the longest historical streak in the check-ins array.
 * @param {string[]} checkIns
 * @returns {number}
 */
// CONCEPT: for-of
// CONCEPT: sort
export function getLongestStreak(checkIns) {
  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    return 0;
  }

  // Deduplicate and sort chronologically on a shallow copy
  const sorted = [...new Set(checkIns)].sort();

  let maxStreak = 0;
  let currentRun = 0;
  let previousDate = null;

  for (const date of sorted) {
    if (previousDate && addDays(previousDate, 1) === date) {
      currentRun++;
    } else {
      currentRun = 1;
    }

    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }

    previousDate = date;
  }

  return maxStreak;
}
