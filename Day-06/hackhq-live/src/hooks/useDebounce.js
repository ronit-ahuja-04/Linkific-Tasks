import { useState, useEffect } from 'react';

/**
 * Custom hook that delays propagating a rapidly changing value until
 * a specified delay has elapsed since the last update.
 *
 * @param {any} value - The incoming value to debounce.
 * @param {number} [delay=300] - Delay period in milliseconds.
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay = 300) {
  // CONCEPT: useDebounce - timer-based rate limiting with clearTimeout cleanup
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [value, delay]);

  return debouncedValue;
}
