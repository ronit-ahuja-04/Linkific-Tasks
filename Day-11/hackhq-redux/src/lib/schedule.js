/**
 * Pure schedule helpers. A session has a `day` ("2026-10-31") plus `start` and `end` ("09:30"),
 * all in the viewer's local time. Everything that depends on "the current time" takes it as a
 * parameter, so the logic stays testable and the page can preview any moment.
 */

export const TRACKS = ['Keynote', 'Workshop', 'Talk', 'Social'];

/** Badge tone per track, used by the session list. */
export const TRACK_TONES = {
  Keynote: 'brand',
  Workshop: 'accent',
  Talk: 'neutral',
  Social: 'good',
};

/** "09:30" -> 570 */
export function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimestamp(day, time) {
  const [year, month, date] = day.split('-').map(Number);
  const minutes = toMinutes(time);
  return new Date(year, month - 1, date, Math.floor(minutes / 60), minutes % 60).getTime();
}

export const startMs = (session) => toTimestamp(session.day, session.start);
export const endMs = (session) => toTimestamp(session.day, session.end);

/** Day first, then start time. Returns a new array. */
export function sortSessions(sessions) {
  return [...sessions].sort(
    (a, b) => a.day.localeCompare(b.day) || toMinutes(a.start) - toMinutes(b.start)
  );
}

export function getDays(sessions) {
  return [...new Set(sortSessions(sessions).map((session) => session.day))];
}

export function groupByDay(sessions) {
  const grouped = {};
  for (const session of sortSessions(sessions)) {
    (grouped[session.day] ??= []).push(session);
  }
  return grouped;
}

export function filterByTrack(sessions, track = 'all') {
  return track === 'all' ? sessions : sessions.filter((session) => session.track === track);
}

/** Back-to-back sessions (one ends exactly when the next starts) do not overlap. */
export function sessionsOverlap(a, b) {
  return startMs(a) < endMs(b) && startMs(b) < endMs(a);
}

/** Every overlapping pair, once, in time order. */
export function findClashes(sessions) {
  const sorted = sortSessions(sessions);
  const pairs = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      if (sessionsOverlap(sorted[i], sorted[j])) pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
}

export function findClashingIds(sessions) {
  return new Set(
    findClashes(sessions)
      .flat()
      .map((session) => session.id)
  );
}

export function toggleSaved(savedIds, id) {
  return savedIds.includes(id) ? savedIds.filter((saved) => saved !== id) : [...savedIds, id];
}

export function getSavedSessions(sessions, savedIds) {
  return sortSessions(sessions.filter((session) => savedIds.includes(session.id)));
}

/**
 * Sessions in progress at `now`, and the sessions that start next (all that share the earliest
 * upcoming start time, since sessions can run in parallel). Start is inclusive, end is exclusive.
 */
export function getNowAndNext(sessions, now) {
  const live = sessions.filter((session) => startMs(session) <= now && now < endMs(session));
  const upcoming = sessions.filter((session) => startMs(session) > now);

  if (upcoming.length === 0) return { now: sortSessions(live), next: [] };

  const nextStart = Math.min(...upcoming.map(startMs));
  const next = upcoming.filter((session) => startMs(session) === nextStart);
  return { now: sortSessions(live), next: sortSessions(next) };
}

export function formatTimeRange(session) {
  return `${session.start} – ${session.end}`;
}

export function formatDayLabel(day) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
