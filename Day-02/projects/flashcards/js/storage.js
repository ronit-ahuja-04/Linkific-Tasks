/**
 * storage.js - LocalStorage Safe Wrapper for Flashcards
 * Key: 'day2.flashcards.v1'
 */
// CONCEPT: storage-wrapper

const STORAGE_KEY = 'day2.flashcards.v1';

/**
 * Loads and parses data from localStorage.
 * Falls back safely if data is missing, corrupted, or storage is blocked.
 * @template T
 * @param {string} [key=STORAGE_KEY]
 * @param {T} fallback - Default value if storage lookup fails
 * @returns {T}
 */
export function loadFromStorage(key = STORAGE_KEY, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[storage] Failed to load key "${key}", using fallback:`, err);
    return fallback;
  }
}

/**
 * Serializes and saves data to localStorage.
 * Never throws an error; returns a boolean indicating success.
 * @param {string} [key=STORAGE_KEY]
 * @param {any} value
 * @returns {boolean} True if saved successfully, false otherwise
 */
export function saveToStorage(key = STORAGE_KEY, value = null) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed to save key "${key}":`, err);
    return false;
  }
}

/**
 * Removes a specific key from localStorage.
 * @param {string} [key=STORAGE_KEY]
 */
export function clearStorageKey(key = STORAGE_KEY) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`[storage] Failed to remove key "${key}":`, err);
  }
}
