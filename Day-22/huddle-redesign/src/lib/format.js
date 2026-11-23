/**
 * Friendly dates for people, exact dates for machines and on hover.
 * "2 days ago" is quicker to read than "17/11/2026"; the full date stays one hover (and one screen-reader
 * title) away, and <time dateTime> keeps the precise value in the markup.
 */
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "just now", "5 minutes ago", "yesterday", "in 2 hours", "3 weeks ago" */
export function relativeTime(date, now = new Date(), locale = undefined) {
  const then = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(then.getTime())) return '';
  const seconds = Math.round((then.getTime() - now.getTime()) / 1000);
  if (Math.abs(seconds) < 45) return 'just now';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(Math.round(seconds / 60), 'minute');
}

/** "Tue, 17 Nov 2026, 14:05" in the reader's own locale */
export function fullDateTime(date, locale = undefined) {
  const then = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(then.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(then);
}

/** A chat timestamp: "15:59" today, "22 Nov, 15:59" this year, "22 Nov 2025, 15:59" before that */
export function messageTime(date, now = new Date(), locale = undefined) {
  const then = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(then.getTime())) return '';
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(then);
  if (then.toDateString() === now.toDateString()) return time;
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', ...(then.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }) }).format(then);
  return `${day}, ${time}`;
}

/** Messages from the same person within this window are shown as one group (one name, one avatar) */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Is `message` a continuation of `previous`: same author, a few minutes apart */
export function continuesGroup(message, previous) {
  if (!previous || previous.user_id !== message.user_id) return false;
  const gap = new Date(message.created_at) - new Date(previous.created_at);
  return gap >= 0 && gap < GROUP_WINDOW_MS;
}
