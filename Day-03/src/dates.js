import { parseISO, format, formatDistanceToNow } from 'date-fns';

/**
 * Formats an ISO 8601 date string into human-readable absolute and relative strings.
 *
 * @param {string} isoString - ISO date string (e.g., '2026-10-25T14:30:00Z')
 * @param {Date} [now=new Date()] - Reference date for relative distance
 * @returns {{ absolute: string, relative: string, formatted: string }}
 */
export function formatPushed(isoString, now = new Date()) {
  if (!isoString) {
    return {
      absolute: 'Unknown',
      relative: 'Never',
      formatted: 'Unknown',
    };
  }

  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) {
      return {
        absolute: 'Invalid date',
        relative: 'Invalid date',
        formatted: 'Invalid date',
      };
    }

    const absolute = format(date, 'yyyy-MM-dd');
    const relative = formatDistanceToNow(date, { addSuffix: true });
    return {
      absolute,
      relative,
      formatted: `${absolute} (${relative})`,
    };
  } catch {
    return {
      absolute: 'Unknown',
      relative: 'Never',
      formatted: 'Unknown',
    };
  }
}
