/**
 * stats.js - Pure Aggregate Metrics for Habit Tracker
 * Zero DOM interactions. Demonstrates reduce, sort, computed properties,
 * and deliberate for...in aggregation.
 */

import { getCurrentStreak } from './streaks.js';
import { toDateKey } from './dates.js';

/**
 * Calculates total lifetime check-ins across all habits.
 * @param {Array<object>} habits
 * @returns {number}
 */
// CONCEPT: reduce
export function getTotalCheckIns(habits) {
  if (!Array.isArray(habits)) return 0;
  return habits.reduce((total, habit) => total + (habit.checkIns ? habit.checkIns.length : 0), 0);
}

/**
 * Ranks habits by their current streak in descending order.
 * @param {Array<object>} habits
 * @param {string} [todayKey=toDateKey()]
 * @returns {Array<object>}
 */
// CONCEPT: sort
export function rankByStreak(habits, todayKey = toDateKey()) {
  if (!Array.isArray(habits)) return [];

  return [...habits]
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      currentStreak: getCurrentStreak(habit.checkIns, todayKey),
      totalCheckIns: habit.checkIns.length,
    }))
    .sort((a, b) => b.currentStreak - a.currentStreak);
}

/**
 * Aggregates check-ins by date across all habits into a dictionary { [date]: count }.
 * Uses computed property names inside reduce.
 * @param {Array<object>} habits
 * @returns {Record<string, number>}
 */
// CONCEPT: computed-properties
export function checkInsByDate(habits) {
  if (!Array.isArray(habits)) return {};

  return habits.reduce((acc, habit) => {
    if (!Array.isArray(habit.checkIns)) return acc;

    habit.checkIns.forEach((dateKey) => {
      acc = {
        ...acc,
        [dateKey]: (acc[dateKey] ?? 0) + 1,
      };
    });

    return acc;
  }, {});
}

/**
 * Finds the single most active day across all habits.
 * Demonstrates a deliberate for...in loop on an aggregated object.
 * @param {Record<string, number>} dateCounts
 * @returns {{ date: string | null, count: number }}
 */
// CONCEPT: for-in
export function getMostActiveDate(dateCounts) {
  let topDate = null;
  let maxCount = 0;

  for (const date in dateCounts) {
    if (Object.hasOwn(dateCounts, date)) {
      if (dateCounts[date] > maxCount) {
        maxCount = dateCounts[date];
        topDate = date;
      }
    }
  }

  return { date: topDate, count: maxCount };
}
