import { describe, it, expect } from 'vitest';
import {
  TRACKS,
  toMinutes,
  startMs,
  endMs,
  sortSessions,
  getDays,
  groupByDay,
  filterByTrack,
  sessionsOverlap,
  findClashes,
  findClashingIds,
  toggleSaved,
  getSavedSessions,
  getNowAndNext,
  formatTimeRange,
  formatDayLabel,
} from '../src/lib/schedule.js';

const session = (id, day, start, end, extra = {}) => ({
  id,
  day,
  start,
  end,
  title: `Session ${id}`,
  speaker: 'Speaker',
  room: 'Room A',
  track: 'Talk',
  description: 'Description',
  ...extra,
});

// Local-time helper: month is 1-based here to read like a calendar
const at = (month, day, hour, minute = 0) => new Date(2026, month - 1, day, hour, minute).getTime();

describe('Schedule pure logic (src/lib/schedule.js)', () => {
  describe('toMinutes', () => {
    it('converts HH:MM to minutes after midnight', () => {
      expect(toMinutes('00:00')).toBe(0);
      expect(toMinutes('09:30')).toBe(570);
      expect(toMinutes('23:59')).toBe(1439);
    });
  });

  describe('startMs and endMs', () => {
    it('build local timestamps from the day and time strings', () => {
      const s = session('a', '2026-10-31', '10:00', '11:30');
      expect(startMs(s)).toBe(at(10, 31, 10, 0));
      expect(endMs(s)).toBe(at(10, 31, 11, 30));
    });
  });

  describe('sortSessions, getDays and groupByDay', () => {
    const list = [
      session('c', '2026-11-01', '09:00', '10:00'),
      session('b', '2026-10-31', '11:00', '12:00'),
      session('a', '2026-10-31', '09:00', '10:00'),
      session('d', '2026-10-30', '18:00', '19:00'),
    ];

    it('sorts by day then start time without mutating the input', () => {
      expect(sortSessions(list).map((s) => s.id)).toEqual(['d', 'a', 'b', 'c']);
      expect(list.map((s) => s.id)).toEqual(['c', 'b', 'a', 'd']);
    });

    it('lists each day once, in order', () => {
      expect(getDays(list)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
    });

    it('groups sorted sessions by day', () => {
      const grouped = groupByDay(list);
      expect(Object.keys(grouped)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
      expect(grouped['2026-10-31'].map((s) => s.id)).toEqual(['a', 'b']);
    });

    it('returns empty results for an empty list', () => {
      expect(getDays([])).toEqual([]);
      expect(groupByDay([])).toEqual({});
    });
  });

  describe('filterByTrack', () => {
    const list = [
      session('a', '2026-10-31', '09:00', '10:00', { track: 'Talk' }),
      session('b', '2026-10-31', '10:00', '11:00', { track: 'Workshop' }),
    ];

    it('returns everything for "all" or no track', () => {
      expect(filterByTrack(list, 'all')).toHaveLength(2);
      expect(filterByTrack(list)).toHaveLength(2);
    });

    it('keeps only the chosen track', () => {
      expect(filterByTrack(list, 'Workshop').map((s) => s.id)).toEqual(['b']);
    });
  });

  describe('sessionsOverlap', () => {
    const base = session('a', '2026-10-31', '10:00', '11:00');

    it('is true when time ranges intersect on the same day', () => {
      expect(sessionsOverlap(base, session('b', '2026-10-31', '10:30', '11:30'))).toBe(true);
      expect(sessionsOverlap(base, session('b', '2026-10-31', '09:00', '10:15'))).toBe(true);
      expect(sessionsOverlap(base, session('b', '2026-10-31', '10:15', '10:45'))).toBe(true);
    });

    it('is false for back-to-back sessions', () => {
      expect(sessionsOverlap(base, session('b', '2026-10-31', '11:00', '12:00'))).toBe(false);
      expect(sessionsOverlap(base, session('b', '2026-10-31', '09:00', '10:00'))).toBe(false);
    });

    it('is false for the same time on different days', () => {
      expect(sessionsOverlap(base, session('b', '2026-11-01', '10:00', '11:00'))).toBe(false);
    });
  });

  describe('findClashes and findClashingIds', () => {
    const list = [
      session('a', '2026-10-31', '10:00', '11:00'),
      session('b', '2026-10-31', '10:30', '11:15'),
      session('c', '2026-10-31', '13:00', '14:00'),
      session('d', '2026-11-01', '10:00', '11:00'),
    ];

    it('returns each overlapping pair once', () => {
      const clashes = findClashes(list);
      expect(clashes).toHaveLength(1);
      expect(clashes[0].map((s) => s.id)).toEqual(['a', 'b']);
    });

    it('returns no pairs when nothing overlaps', () => {
      expect(findClashes([list[0], list[2], list[3]])).toEqual([]);
    });

    it('finds every pair when three sessions overlap', () => {
      const three = [
        session('x', '2026-10-31', '10:00', '12:00'),
        session('y', '2026-10-31', '10:30', '11:30'),
        session('z', '2026-10-31', '11:00', '12:30'),
      ];
      expect(findClashes(three)).toHaveLength(3);
    });

    it('collects the ids of sessions that clash with another', () => {
      expect([...findClashingIds(list)].sort()).toEqual(['a', 'b']);
      expect(findClashingIds([]).size).toBe(0);
    });
  });

  describe('toggleSaved and getSavedSessions', () => {
    it('adds an id that is missing and removes one that is present', () => {
      expect(toggleSaved([], 'a')).toEqual(['a']);
      expect(toggleSaved(['a', 'b'], 'a')).toEqual(['b']);
    });

    it('does not mutate the original list', () => {
      const saved = Object.freeze(['a']);
      expect(() => toggleSaved(saved, 'b')).not.toThrow();
    });

    it('returns saved sessions in time order and ignores unknown ids', () => {
      const list = [
        session('b', '2026-10-31', '11:00', '12:00'),
        session('a', '2026-10-31', '09:00', '10:00'),
        session('c', '2026-10-31', '13:00', '14:00'),
      ];
      expect(getSavedSessions(list, ['b', 'a', 'gone']).map((s) => s.id)).toEqual(['a', 'b']);
    });
  });

  describe('getNowAndNext', () => {
    const list = [
      session('a', '2026-10-31', '09:00', '10:00'),
      session('b', '2026-10-31', '10:00', '11:00'),
      session('c', '2026-10-31', '10:00', '10:30'),
      session('d', '2026-10-31', '13:00', '14:00'),
    ];

    it('reports nothing live and the first session as next before the event', () => {
      const { now, next } = getNowAndNext(list, at(10, 30, 12));
      expect(now).toEqual([]);
      expect(next.map((s) => s.id)).toEqual(['a']);
    });

    it('finds the session in progress and the one that follows', () => {
      const { now, next } = getNowAndNext(list, at(10, 31, 9, 30));
      expect(now.map((s) => s.id)).toEqual(['a']);
      expect(next.map((s) => s.id).sort()).toEqual(['b', 'c']);
    });

    it('includes parallel sessions in both groups', () => {
      const { now } = getNowAndNext(list, at(10, 31, 10, 15));
      expect(now.map((s) => s.id).sort()).toEqual(['b', 'c']);
    });

    it('treats the start as inclusive and the end as exclusive', () => {
      expect(getNowAndNext(list, at(10, 31, 9, 0)).now.map((s) => s.id)).toEqual(['a']);
      expect(getNowAndNext([list[0]], at(10, 31, 10, 0)).now).toEqual([]);
    });

    it('has no live session in a gap and points at the next one', () => {
      const { now, next } = getNowAndNext(list, at(10, 31, 12, 0));
      expect(now).toEqual([]);
      expect(next.map((s) => s.id)).toEqual(['d']);
    });

    it('has no next session after the last one ends', () => {
      const { now, next } = getNowAndNext(list, at(10, 31, 15, 0));
      expect(now).toEqual([]);
      expect(next).toEqual([]);
    });

    it('copes with an empty schedule', () => {
      expect(getNowAndNext([], at(10, 31, 9))).toEqual({ now: [], next: [] });
    });
  });

  describe('formatting', () => {
    it('formats a time range with an en dash', () => {
      expect(formatTimeRange(session('a', '2026-10-31', '09:00', '10:30'))).toBe('09:00 – 10:30');
    });

    it('formats a day key as a short weekday and date', () => {
      expect(formatDayLabel('2026-10-31')).toMatch(/^Sat,? 31 Oct$/);
    });
  });

  it('exposes the four tracks', () => {
    expect(TRACKS).toEqual(['Keynote', 'Workshop', 'Talk', 'Social']);
  });
});
