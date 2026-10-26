/**
 * storage.js - LocalStorage Safe Wrapper for Habit Tracker
 * Storage key: 'day2.habits.v1'
 */
// CONCEPT: storage-wrapper

const STORAGE_KEY = 'day2.habits.v1';

/**
 * Loads habit data safely from localStorage.
 * If data is corrupted, missing, or blocked, returns fallback without throwing.
 * @template T
 * @param {string} [key=STORAGE_KEY]
 * @param {T} fallback - Default fallback value
 * @returns {T}
 */
export function loadFromStorage(key = STORAGE_KEY, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[storage] Stored data for key "${key}" is not an array, using fallback.`);
      return fallback;
    }
    return parsed;
  } catch (err) {
    console.warn(`[storage] Failed to parse key "${key}" from localStorage, falling back:`, err);
    return fallback;
  }
}

/**
 * Saves habit data to localStorage safely.
 * @param {string} [key=STORAGE_KEY]
 * @param {any} value
 * @returns {boolean}
 */
export function saveToStorage(key = STORAGE_KEY, value = []) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed to write key "${key}" to localStorage:`, err);
    return false;
  }
}

/**
 * Clears habit data from storage.
 * @param {string} [key=STORAGE_KEY]
 */
export function clearStorageKey(key = STORAGE_KEY) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`[storage] Failed to remove key "${key}":`, err);
  }
}
