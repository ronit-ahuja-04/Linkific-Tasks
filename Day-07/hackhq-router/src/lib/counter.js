/**
 * Pure functions for Check-in counter calculations and boundary guards (CI-1 to CI-4)
 */

/**
 * Clamp count between 0 and capacity
 * @param {number} value
 * @param {number} capacity
 * @returns {number}
 */
export function clampCount(value, capacity) {
  const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 1;
  const num = Number.isFinite(value) ? value : 0;
  if (num < 0) return 0;
  if (num > safeCapacity) return safeCapacity;
  return Math.floor(num);
}

/**
 * Calculate capacity fill percentage (0 to 100)
 * @param {number} count
 * @param {number} capacity
 * @returns {number}
 */
export function calculateCapacityPercentage(count, capacity) {
  if (!Number.isFinite(capacity) || capacity <= 0) return 0;
  if (!Number.isFinite(count) || count <= 0) return 0;
  const pct = (count / capacity) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/**
 * Get human-readable capacity status and design token tone
 * @param {number} count
 * @param {number} capacity
 * @returns {{ label: string, tone: 'normal' | 'warning' | 'alert' }}
 */
export function getCapacityStatus(count, capacity) {
  const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 1;
  const safeCount = clampCount(count, safeCapacity);

  if (safeCount >= safeCapacity) {
    return {
      label: 'Full',
      tone: 'alert',
    };
  }

  const warningThreshold = Math.round(safeCapacity * 0.8);
  if (safeCount >= warningThreshold) {
    return {
      label: 'Nearly full',
      tone: 'warning',
    };
  }

  return {
    label: 'Plenty of room',
    tone: 'normal',
  };
}

/**
 * Format a number into an array of single-character strings for the split-flap board
 * Minimum 3 digits (e.g. 5 -> ['0', '0', '5'], 127 -> ['1', '2', '7'])
 * @param {number} count
 * @returns {string[]}
 */
export function formatFlapDigits(count) {
  const safeNum = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const str = safeNum.toString();
  const padded = str.length < 3 ? str.padStart(3, '0') : str;
  return padded.split('');
}

/**
 * Parse capacity text input safely, ensuring values strictly between 1 and 1000
 * @param {string|number} rawValue
 * @param {number} fallback
 * @returns {{ value: number, isValid: boolean, message?: string }}
 */
export function parseCapacityInput(rawValue, fallback = 200) {
  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    return { value: fallback, isValid: false, message: 'Capacity cannot be empty.' };
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return { value: fallback, isValid: false, message: 'Please enter a valid number.' };
  }

  const intVal = Math.floor(parsed);

  if (intVal < 1) {
    return { value: 1, isValid: false, message: 'Capacity must be at least 1 person.' };
  }

  if (intVal > 1000) {
    return { value: 1000, isValid: false, message: 'Capacity cannot exceed 1,000 attendees.' };
  }

  return { value: intVal, isValid: true };
}
