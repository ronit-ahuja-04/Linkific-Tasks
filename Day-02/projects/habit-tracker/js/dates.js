/**
 * dates.js - Local Date Arithmetic Helpers
 * IMPORTANT: NEVER use UTC toISOString() because it shifts days based on timezones.
 * All functions operate strictly on local date components.
 */

// CONCEPT: default-parameters
// CONCEPT: template-literals

/**
 * Returns a zero-padded local date string in YYYY-MM-DD format.
 * @param {Date} [date=new Date()]
 * @returns {string} Local date string (e.g. "2026-10-26")
 */
export function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds (or subtracts) n calendar days to a YYYY-MM-DD date key in local time.
 * @param {string} dateKey - Format "YYYY-MM-DD"
 * @param {number} n - Number of days to offset
 * @returns {string} Offset date key in "YYYY-MM-DD" format
 */
export function addDays(dateKey, n) {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed month
  const day = parseInt(dayStr, 10);

  // Use local Date constructor
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + n);

  return toDateKey(date);
}

/**
 * Generates an array of the last N date keys ending on todayKey in chronological order.
 * @param {number} [daysCount=7]
 * @param {string} [todayKey=toDateKey()]
 * @returns {string[]}
 */
export function getLastNDays(daysCount = 7, todayKey = toDateKey()) {
  const result = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    result.push(addDays(todayKey, -i));
  }
  return result;
}

/**
 * Formats a YYYY-MM-DD key into a short display label (e.g., "Mon 26" or "Oct 26").
 * @param {string} dateKey
 * @returns {string}
 */
export function formatDisplayDate(dateKey) {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
