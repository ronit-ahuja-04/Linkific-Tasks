/**
 * Formats a duration in milliseconds into a mm:ss.t string.
 *
 * @param {number} ms - Total elapsed milliseconds.
 * @returns {string} Formatted string, e.g. "02:15.4"
 */
export function formatElapsed(ms = 0) {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${mm}:${ss}.${tenths}`;
}
