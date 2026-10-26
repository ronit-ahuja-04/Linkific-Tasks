/**
 * state.js - Pure State Operations for Habit Tracker
 * All state modifications return new data structures immutably.
 */

import { toDateKey } from './dates.js';

/**
 * Validates and adds a new habit to the habits collection.
 * @param {Array<object>} habits
 * @param {string} name
 * @returns {{ habits: Array<object>, error: string | null, habit: object | null }}
 */
// CONCEPT: spread-operator
// CONCEPT: some
export function addHabit(habits, name = '') {
  const trimmed = name.trim();

  // HT-1: Validation checks
  if (trimmed.length === 0) {
    return { habits, error: 'Habit name cannot be empty.', habit: null };
  }

  if (trimmed.length > 40) {
    return { habits, error: 'Habit name cannot exceed 40 characters.', habit: null };
  }

  const isDuplicate = habits.some(
    (h) => h.name.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return {
      habits,
      error: `A habit named "${trimmed}" already exists (names are case-insensitive).`,
      habit: null,
    };
  }

  const newHabit = {
    id: `h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: trimmed,
    createdAt: toDateKey(),
    checkIns: [],
  };

  return {
    habits: [...habits, newHabit],
    error: null,
    habit: newHabit,
  };
}

/**
 * Toggles a check-in for a habit on a specific date.
 * If the date is present, it is removed; otherwise it is added and sorted.
 * @param {Array<object>} habits
 * @param {string} id
 * @param {string} [dateKey=toDateKey()]
 * @returns {Array<object>} New habits array
 */
// CONCEPT: map
export function toggleCheckIn(habits, id, dateKey = toDateKey()) {
  return habits.map((habit) => {
    if (habit.id !== id) {
      return habit;
    }

    const exists = habit.checkIns.includes(dateKey);
    let updatedCheckIns;

    if (exists) {
      // Uncheck today: remove dateKey
      updatedCheckIns = habit.checkIns.filter((d) => d !== dateKey);
    } else {
      // Check today: add dateKey and sort
      updatedCheckIns = [...new Set([...habit.checkIns, dateKey])].sort();
    }

    return {
      ...habit,
      checkIns: updatedCheckIns,
    };
  });
}

/**
 * Immutably deletes a habit by id.
 * @param {Array<object>} habits
 * @param {string} id
 * @returns {Array<object>}
 */
// CONCEPT: filter
export function deleteHabit(habits, id) {
  return habits.filter((h) => h.id !== id);
}

/**
 * Locates a single habit by id.
 * @param {Array<object>} habits
 * @param {string} id
 * @returns {object | undefined}
 */
// CONCEPT: find
export function findHabit(habits, id) {
  return habits.find((h) => h.id === id);
}
