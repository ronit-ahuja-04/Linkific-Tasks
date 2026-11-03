import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  EMPTY_CHANGES,
  validateAnnouncement,
  createAnnouncement,
  applyChanges,
  addAnnouncement,
  editAnnouncement,
  removeAnnouncement,
  sortAnnouncements,
  filterAnnouncements,
  countUnread,
  getFeatured,
  formatPostDate,
} from '../src/lib/announcements.js';

const post = (id, createdAt, extra = {}) => ({
  id,
  title: `Title ${id}`,
  body: `Body text for post ${id}`,
  category: 'General',
  pinned: false,
  createdAt,
  ...extra,
});

describe('Announcements pure logic (src/lib/announcements.js)', () => {
  describe('validateAnnouncement', () => {
    const valid = { title: 'Lunch is ready', body: 'Pizza in the main hall.', category: 'Food' };

    it('returns no errors for a valid draft', () => {
      expect(validateAnnouncement(valid)).toEqual({});
    });

    it('requires a title of at least 3 characters after trimming', () => {
      expect(validateAnnouncement({ ...valid, title: '   ' }).title).toBeTruthy();
      expect(validateAnnouncement({ ...valid, title: 'ab' }).title).toBeTruthy();
      expect(validateAnnouncement({ ...valid, title: 'abc' }).title).toBeUndefined();
    });

    it('rejects titles over 80 characters', () => {
      expect(validateAnnouncement({ ...valid, title: 'x'.repeat(81) }).title).toBeTruthy();
      expect(validateAnnouncement({ ...valid, title: 'x'.repeat(80) }).title).toBeUndefined();
    });

    it('requires a body between 10 and 600 characters', () => {
      expect(validateAnnouncement({ ...valid, body: 'too short' }).body).toBeTruthy();
      expect(validateAnnouncement({ ...valid, body: 'x'.repeat(601) }).body).toBeTruthy();
      expect(validateAnnouncement({ ...valid, body: 'x'.repeat(10) }).body).toBeUndefined();
    });

    it('requires a known category', () => {
      expect(validateAnnouncement({ ...valid, category: 'Gossip' }).category).toBeTruthy();
      expect(validateAnnouncement({ ...valid, category: undefined }).category).toBeTruthy();
    });

    it('treats a missing draft as fully invalid', () => {
      expect(Object.keys(validateAnnouncement({})).sort()).toEqual(['body', 'category', 'title']);
    });
  });

  describe('createAnnouncement', () => {
    it('trims text, defaults pinned to false and stamps the time', () => {
      const created = createAnnouncement(
        { title: '  Doors open  ', body: '  Doors open at nine.  ', category: 'Schedule' },
        1000
      );
      expect(created.title).toBe('Doors open');
      expect(created.body).toBe('Doors open at nine.');
      expect(created.pinned).toBe(false);
      expect(created.createdAt).toBe(1000);
      expect(created.id).toMatch(/^ann-/);
    });

    it('gives different ids to posts created in the same millisecond', () => {
      const draft = { title: 'Same', body: 'Same body text.', category: 'General' };
      expect(createAnnouncement(draft, 5).id).not.toBe(createAnnouncement(draft, 5).id);
    });
  });

  describe('applyChanges, addAnnouncement, editAnnouncement, removeAnnouncement', () => {
    const seed = [post('a', 100), post('b', 200)];

    it('returns the seed untouched when there are no changes', () => {
      expect(applyChanges(seed, EMPTY_CHANGES)).toEqual(seed);
      expect(applyChanges(seed)).toEqual(seed);
    });

    it('appends added posts after the seed posts', () => {
      const changes = addAnnouncement(EMPTY_CHANGES, post('c', 300));
      expect(applyChanges(seed, changes).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    });

    it('stores an edit to a seed post separately and merges it by id', () => {
      const changes = editAnnouncement(EMPTY_CHANGES, 'a', { title: ' New title ', pinned: true });
      expect(changes.edited.a).toEqual({ title: 'New title', pinned: true });
      const merged = applyChanges(seed, changes);
      expect(merged[0].title).toBe('New title');
      expect(merged[0].pinned).toBe(true);
      expect(merged[0].body).toBe(seed[0].body);
      expect(seed[0].title).toBe('Title a');
    });

    it('edits an added post in place', () => {
      const added = addAnnouncement(EMPTY_CHANGES, post('c', 300));
      const changes = editAnnouncement(added, 'c', { body: 'Updated body text.' });
      expect(changes.edited.c).toBeUndefined();
      expect(changes.added[0].body).toBe('Updated body text.');
    });

    it('ignores fields that are not editable', () => {
      const changes = editAnnouncement(EMPTY_CHANGES, 'a', {
        id: 'zzz',
        createdAt: 1,
        title: 'Ok title',
      });
      expect(changes.edited.a).toEqual({ title: 'Ok title' });
    });

    it('hides a removed seed post without touching the seed', () => {
      const changes = removeAnnouncement(EMPTY_CHANGES, 'a');
      expect(changes.removed).toEqual(['a']);
      expect(applyChanges(seed, changes).map((p) => p.id)).toEqual(['b']);
    });

    it('drops a removed added post and any edits to a removed post', () => {
      const withAdded = addAnnouncement(EMPTY_CHANGES, post('c', 300));
      expect(removeAnnouncement(withAdded, 'c').added).toEqual([]);

      const edited = editAnnouncement(EMPTY_CHANGES, 'a', { title: 'Edited' });
      expect(removeAnnouncement(edited, 'a').edited.a).toBeUndefined();
    });

    it('does not record the same removal twice', () => {
      const once = removeAnnouncement(EMPTY_CHANGES, 'a');
      expect(removeAnnouncement(once, 'a').removed).toEqual(['a']);
    });

    it('never mutates the changes it is given', () => {
      const frozen = Object.freeze({
        added: Object.freeze([]),
        edited: Object.freeze({}),
        removed: Object.freeze([]),
      });
      expect(() => addAnnouncement(frozen, post('c', 1))).not.toThrow();
      expect(() => editAnnouncement(frozen, 'a', { title: 'Ok title' })).not.toThrow();
      expect(() => removeAnnouncement(frozen, 'a')).not.toThrow();
    });
  });

  describe('sortAnnouncements', () => {
    it('puts pinned posts first, then newest first, without mutating the input', () => {
      const list = [post('old', 100), post('pinnedOld', 50, { pinned: true }), post('new', 300)];
      const sorted = sortAnnouncements(list);
      expect(sorted.map((p) => p.id)).toEqual(['pinnedOld', 'new', 'old']);
      expect(list.map((p) => p.id)).toEqual(['old', 'pinnedOld', 'new']);
    });
  });

  describe('filterAnnouncements', () => {
    const list = [
      post('1', 1, { title: 'Lunch menu', body: 'Pizza and salad', category: 'Food' }),
      post('2', 2, {
        title: 'Keynote moved',
        body: 'Now at 10am in the hall',
        category: 'Schedule',
      }),
      post('3', 3, { title: 'Free hoodies', body: 'Swag desk opens at noon', category: 'Swag' }),
    ];

    it('returns everything for "all" with an empty query', () => {
      expect(filterAnnouncements(list, { category: 'all', query: '' })).toHaveLength(3);
      expect(filterAnnouncements(list)).toHaveLength(3);
    });

    it('filters by category', () => {
      expect(filterAnnouncements(list, { category: 'Food' }).map((p) => p.id)).toEqual(['1']);
    });

    it('searches title and body case-insensitively', () => {
      expect(filterAnnouncements(list, { query: 'LUNCH' }).map((p) => p.id)).toEqual(['1']);
      expect(filterAnnouncements(list, { query: 'in the hall' }).map((p) => p.id)).toEqual(['2']);
    });

    it('combines category and query, and trims the query', () => {
      expect(filterAnnouncements(list, { category: 'Swag', query: '  noon ' })).toHaveLength(1);
      expect(filterAnnouncements(list, { category: 'Food', query: 'noon' })).toHaveLength(0);
    });
  });

  describe('countUnread', () => {
    const list = [post('a', 100), post('b', 200), post('c', 300)];

    it('counts every post when nothing has been seen', () => {
      expect(countUnread(list, null)).toBe(3);
    });

    it('counts only posts newer than the last visit', () => {
      expect(countUnread(list, 150)).toBe(2);
      expect(countUnread(list, 300)).toBe(0);
    });
  });

  describe('getFeatured', () => {
    it('returns null for an empty list', () => {
      expect(getFeatured([])).toBeNull();
    });

    it('prefers the newest pinned post', () => {
      const list = [
        post('a', 500),
        post('b', 100, { pinned: true }),
        post('c', 200, { pinned: true }),
      ];
      expect(getFeatured(list).id).toBe('c');
    });

    it('falls back to the newest post when nothing is pinned', () => {
      expect(getFeatured([post('a', 100), post('b', 300)]).id).toBe('b');
    });
  });

  describe('formatPostDate', () => {
    const now = Date.UTC(2026, 10, 3, 12, 0, 0);

    it('describes recent posts relatively', () => {
      expect(formatPostDate(now - 20 * 1000, now)).toBe('Just now');
      expect(formatPostDate(now - 5 * 60 * 1000, now)).toBe('5 min ago');
      expect(formatPostDate(now - 3 * 60 * 60 * 1000, now)).toBe('3 h ago');
      expect(formatPostDate(now - 30 * 60 * 60 * 1000, now)).toBe('Yesterday');
    });

    it('falls back to a short date for older posts', () => {
      expect(formatPostDate(now - 10 * 24 * 60 * 60 * 1000, now)).toMatch(/^\d{1,2} [A-Z][a-z]{2}/);
    });
  });

  it('exposes the five categories', () => {
    expect(CATEGORIES).toEqual(['General', 'Schedule', 'Food', 'Swag', 'Urgent']);
  });
});
