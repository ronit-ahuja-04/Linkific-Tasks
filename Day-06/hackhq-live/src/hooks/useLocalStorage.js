import { useState, useEffect } from 'react';

/**
 * Custom hook that synchronizes state with browser localStorage.
 * Provides the identical tuple API as useState ([value, setValue]),
 * supporting functional updates, resilient corrupt-data fallback,
 * and cross-tab synchronization.
 *
 * @template T
 * @param {string} key - Storage key identifier.
 * @param {T} initialValue - Default value if storage is empty or corrupt.
 * @returns {[T, (val: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue) {
  // CONCEPT: useLocalStorage - Web Storage synchronization with lazy init and try/catch
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Safe fallback on corrupt JSON string (complies with LS-2)
      console.warn(`[useLocalStorage] Safe fallback for key "${key}":`, error);
      return initialValue;
    }
  });

  // Write changes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || storedValue === undefined) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`[useLocalStorage] Failed writing key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Synchronize state across browser tabs via storage event (LS-3)
  useEffect(() => {
    function handleStorageChange(event) {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.warn(`[useLocalStorage] Parse error on cross-tab event for key "${key}":`, error);
        }
      }
    }

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setStoredValue];
}

