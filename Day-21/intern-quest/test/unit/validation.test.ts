import { describe, expect, it } from 'vitest';
import { isIsoDate, isUuid, parseBadge, parseCharacter, parseNote, parseQuest } from '@/lib/validation';

const goodQuest = { day: 3, date: '2026-11-21', title: 'Tame the API', skills: ['backend', 'testing'] };

describe('parseQuest', () => {
  it('accepts a minimal quest and fills in the defaults', () => {
    const parsed = parseQuest(goodQuest);
    expect(parsed).toEqual({
      ok: true,
      value: { ...goodQuest, body: '', blockers: '', difficulty: 'normal', prLinks: [], status: 'published', isPublic: true },
    });
  });

  it('trims text', () => {
    const parsed = parseQuest({ ...goodQuest, title: '   Spaced out   ' });
    expect(parsed.ok && parsed.value.title).toBe('Spaced out');
  });

  it('reports every problem at once, per field', () => {
    const parsed = parseQuest({ day: 0, date: '2026-02-30', title: 'no', skills: [], difficulty: 'legendary', prLinks: ['ftp://x'], isPublic: 'yes' });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(Object.keys(parsed.errors).sort()).toEqual(['date', 'day', 'difficulty', 'isPublic', 'prLinks', 'skills', 'title']);
  });

  it('checks skills: known, 1 to 4, no repeats', () => {
    const errorFor = (skills: unknown) => {
      const parsed = parseQuest({ ...goodQuest, skills });
      return parsed.ok ? null : parsed.errors.skills;
    };
    expect(errorFor(['cooking'])).toMatch(/unknown skill/);
    expect(errorFor(['react', 'state', 'routing', 'testing', 'auth'])).toMatch(/1 to 4/);
    expect(errorFor(['react', 'react'])).toMatch(/repeat/);
    expect(errorFor('react')).toMatch(/1 to 4/);
    expect(errorFor(['react'])).toBeNull();
  });

  it('allows at most five http(s) PR links', () => {
    const links = (n: number) => Array.from({ length: n }, (_, i) => `https://github.com/x/y/pull/${i}`);
    expect(parseQuest({ ...goodQuest, prLinks: links(5) }).ok).toBe(true);
    expect(parseQuest({ ...goodQuest, prLinks: links(6) }).ok).toBe(false);
    expect(parseQuest({ ...goodQuest, prLinks: ['javascript:alert(1)'] }).ok).toBe(false);
  });

  it('rejects anything that is not an object', () => {
    for (const input of [null, 'text', 42, [goodQuest]]) expect(parseQuest(input)).toEqual({ ok: false, errors: { body: 'The request body must be a JSON object' } });
  });
});

describe('parseCharacter', () => {
  const good = { handle: 'Ronit-2', displayName: 'Ronit', class: 'fullstack_ranger' };
  it('accepts a character, lower-cases the handle and fills the avatar', () => {
    expect(parseCharacter(good)).toEqual({
      ok: true,
      value: { handle: 'ronit-2', displayName: 'Ronit', bio: '', class: 'fullstack_ranger', avatar: { skin: 0, hair: 0, colour: 0, accessory: 0 }, isPublic: true },
    });
  });
  it('rejects bad handles, unknown classes and out-of-range avatar parts', () => {
    for (const handle of ['ab', '-ab', 'ab-', 'has space', 'a'.repeat(25)]) expect(parseCharacter({ ...good, handle }).ok, handle).toBe(false);
    expect(parseCharacter({ ...good, class: 'wizard' }).ok).toBe(false);
    expect(parseCharacter({ ...good, avatar: { hair: 9 } }).ok).toBe(false);
    expect(parseCharacter({ ...good, avatar: { hair: 2.5 } }).ok).toBe(false);
  });
});

describe('parseNote and parseBadge', () => {
  it('notes need 1 to 1000 characters', () => {
    expect(parseNote({ body: 'Nice work' }).ok).toBe(true);
    expect(parseNote({ body: '   ' }).ok).toBe(false);
    expect(parseNote({ body: 'x'.repeat(1001) }).ok).toBe(false);
  });
  it('badges need a handle and a name; the icon defaults to a medal', () => {
    expect(parseBadge({ handle: 'Ada', name: 'Night owl' })).toEqual({ ok: true, value: { handle: 'ada', name: 'Night owl', note: '', icon: '🏅' } });
    expect(parseBadge({ handle: 'ada', name: 'x' }).ok).toBe(false);
  });
});

describe('small checks', () => {
  it('isIsoDate accepts only real calendar dates', () => {
    expect(isIsoDate('2026-11-21')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('21/11/2026')).toBe(false);
    expect(isIsoDate(20261121)).toBe(false);
  });
  it('isUuid', () => {
    expect(isUuid('00000000-0000-4000-8000-000000000001')).toBe(true);
    expect(isUuid('1; drop table quests')).toBe(false);
  });
});
