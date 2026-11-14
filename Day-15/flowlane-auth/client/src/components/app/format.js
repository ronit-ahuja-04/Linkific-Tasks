// Small display helpers for the security and admin pages.

export function formatDate(value) {
  if (value === null || value === undefined || value === '') return '-';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

// JWT dates (iat, exp) are in SECONDS since 1970, JavaScript wants milliseconds.
export const formatUnix = (seconds) => (typeof seconds === 'number' ? formatDate(seconds * 1000) : '-');

export function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// "Chrome on macOS" from a User-Agent string (good enough for a list; not a full parser).
export function shortUserAgent(ua) {
  if (!ua) return 'Unknown browser';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null;
  if (!browser && !os) return ua.slice(0, 40);
  return [browser ?? 'Browser', os && `on ${os}`].filter(Boolean).join(' ');
}
