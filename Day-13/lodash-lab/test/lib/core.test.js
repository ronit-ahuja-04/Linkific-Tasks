import { describe, expect, it } from 'vitest';
import { DEPARTMENTS, generateUsers, getDataset, mulberry32 } from '../../src/data/generateUsers';
import { DEFAULT_FILTERS, clampPage, createIndex, groupUsers, highlightParts, paginate, searchUsers, sortUsers, toggleSort, tokenize } from '../../src/lib/query';
import { headcountBy, hiresByYear, salaryByDepartment, salaryHistogram, seniorSplit, summarize, topSkills } from '../../src/lib/stats';
import { changedPaths, coerce, createDraft, getField, isDirty, publicPayload, removeField, resetField, setField, toggleSkill, validate } from '../../src/lib/form';
import { csvFileName, labelFromKey, propertyName, shorten, slug } from '../../src/lib/strings';

const users = getDataset(2000);
const index = createIndex(users);

describe('generateUsers', () => {
  it('is deterministic for a seed', () => {
    expect(generateUsers(50, 7)).toEqual(generateUsers(50, 7));
    expect(generateUsers(50, 7)).not.toEqual(generateUsers(50, 8));
    const a = mulberry32(1); const b = mulberry32(1);
    expect([a(), a()]).toEqual([b(), b()]);
  });
  it('builds complete, valid users with unique ids', () => {
    const all = getDataset(10000);
    expect(all).toHaveLength(10000);
    expect(new Set(all.map((u) => u.id)).size).toBe(10000);
    for (const u of all.slice(0, 500)) {
      expect(u.age).toBeGreaterThanOrEqual(22); expect(u.age).toBeLessThanOrEqual(64);
      expect(u.rating).toBeGreaterThanOrEqual(1); expect(u.rating).toBeLessThanOrEqual(5);
      expect(DEPARTMENTS).toContain(u.department);
      expect(new Set(u.skills).size).toBe(u.skills.length);
      expect(u.skills.length).toBeGreaterThanOrEqual(3);
      expect(u.address.geo.lat).toBeTypeOf('number');
      expect(u.joinedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('memoizes datasets by size', () => {
    expect(getDataset(100)).toBe(getDataset(100));
  });
});

describe('query', () => {
  it('finds accented names without accents, all words required', () => {
    const zoe = users.find((u) => u.firstName === 'Zoë');
    expect(zoe).toBeTruthy();
    const hits = searchUsers(index, { query: `zoe ${zoe.lastName.toLowerCase()}` });
    expect(hits).toContain(zoe);
    hits.forEach((u) => expect(`${u.firstName} ${u.lastName}`.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()).toContain('zoe'));
  });
  it('matches a native implementation for combined filters', () => {
    const filters = { ...DEFAULT_FILTERS, departments: ['Engineering', 'Design'], skills: ['React', 'CSS'], minRating: 3.5, ageRange: [30, 45] };
    const expected = users.filter((u) => filters.departments.includes(u.department) && u.skills.some((s) => filters.skills.includes(s)) && u.rating >= 3.5 && u.age >= 30 && u.age <= 45);
    expect(searchUsers(index, filters).map((u) => u.id)).toEqual(expected.map((u) => u.id));
  });
  it('tokenizes with accents folded and dots kept', () => {
    expect(tokenize('  Node.js  JOSÉ ')).toEqual(['node.js', 'jose']);
  });
  it('sorts by several keys with a stable tiebreak and cycles toggleSort', () => {
    const sorted = sortUsers(users, [{ id: 'department', dir: 'asc' }, { id: 'salary', dir: 'desc' }]);
    for (let i = 1; i < sorted.length; i += 1) {
      const [a, b] = [sorted[i - 1], sorted[i]];
      expect(a.department <= b.department).toBe(true);
      if (a.department === b.department) expect(a.salary >= b.salary).toBe(true);
    }
    let s = toggleSort([], 'age');
    expect(s).toEqual([{ id: 'age', dir: 'asc' }]);
    s = toggleSort(s, 'age'); expect(s[0].dir).toBe('desc');
    s = toggleSort(s, 'age'); expect(s).toEqual([]);
    expect(toggleSort([{ id: 'age', dir: 'asc' }], 'salary', { additive: true })).toHaveLength(2);
  });
  it('groups with totals that add up', () => {
    const groups = groupUsers(users, 'department');
    expect(groups.reduce((n, g) => n + g.count, 0)).toBe(users.length);
    expect(groups[0].count).toBeGreaterThanOrEqual(groups.at(-1).count);
  });
  it('paginates and clamps', () => {
    const pages = paginate(users, 25);
    expect(pages).toHaveLength(80);
    expect(clampPage(99, 80)).toBe(79); expect(clampPage(-3, 80)).toBe(0); expect(clampPage(5, 0)).toBe(0);
  });
  it('highlights ignoring case and accents, keeping the original letters', () => {
    expect(highlightParts('Zoë Brown', 'zoe')).toEqual([{ text: 'Zoë', match: true }, { text: ' Brown', match: false }]);
    expect(highlightParts('node.js dev', 'node.js').map((p) => p.match)).toEqual([true, false]);
    expect(highlightParts('abc', '')).toEqual([{ text: 'abc', match: false }]);
    expect(highlightParts('a.b axb', 'a.b').filter((p) => p.match)).toHaveLength(1);
  });
});

describe('stats', () => {
  it('summarize agrees with native math', () => {
    const s = summarize(users);
    expect(s.total).toBe(users.length);
    expect(s.payroll).toBe(users.reduce((n, u) => n + u.salary, 0));
    expect(s.highestPaid.salary).toBe(Math.max(...users.map((u) => u.salary)));
  });
  it('headcount, histogram, hires and skills add up', () => {
    expect(headcountBy(users, 'department').reduce((n, r) => n + r.value, 0)).toBe(users.length);
    expect(salaryHistogram(users).reduce((n, b) => n + b.value, 0)).toBe(users.length);
    expect(hiresByYear(users).reduce((n, b) => n + b.value, 0)).toBe(users.length);
    expect(topSkills(users, 5)).toHaveLength(5);
    expect(seniorSplit(users).senior + seniorSplit(users).junior).toBe(users.length);
    expect(salaryByDepartment(users)).toHaveLength(8);
    expect(salaryHistogram([])).toEqual([]);
  });
});

describe('form', () => {
  const user = users[0];
  it('draft is a deep copy', () => {
    const draft = createDraft(user);
    draft.address.city = 'Changed';
    expect(user.address.city).not.toBe('Changed');
  });
  it('setField is immutable and creates missing parents', () => {
    const draft = createDraft(user);
    const next = setField(draft, 'address.geo.lat', 1.5);
    expect(next).not.toBe(draft);
    expect(draft.address.geo.lat).not.toBe(1.5);
    expect(getField(next, 'address.geo.lat')).toBe(1.5);
    expect(getField(next, 'contact.phone', 'n/a')).toBe('n/a');
    expect(removeField(next, 'address.geo.lat').address.geo).not.toHaveProperty('lat');
  });
  it('tracks changes, dirty state and resets one field', () => {
    const original = createDraft(user);
    let draft = setField(original, 'preferences.notifications.push', !original.preferences.notifications.push);
    draft = setField(draft, 'firstName', 'Zed');
    expect(isDirty(original, draft)).toBe(true);
    expect(changedPaths(original, draft).sort()).toEqual(['firstName', 'preferences.notifications.push']);
    draft = resetField(draft, original, 'firstName');
    expect(changedPaths(original, draft)).toEqual(['preferences.notifications.push']);
    expect(isDirty(original, original)).toBe(false);
  });
  it('toggles skills both ways', () => {
    const draft = createDraft(user);
    const skill = draft.skills[0];
    expect(toggleSkill(draft, skill).skills).not.toContain(skill);
    expect(toggleSkill(toggleSkill(draft, skill), skill).skills).toContain(skill);
  });
  it('validates and coerces', () => {
    const draft = createDraft(user);
    expect(validate(draft)).toEqual({});
    const bad = setField(setField(setField(draft, 'email', 'nope'), 'age', '12'), 'address.geo.lat', '95');
    expect(Object.keys(validate(bad)).sort()).toEqual(['address.geo.lat', 'age', 'email']);
    expect(coerce(setField(draft, 'age', '33')).age).toBe(33);
  });
  it('public payload hides private fields only', () => {
    const payload = publicPayload(createDraft(user));
    expect(payload).not.toHaveProperty('salary');
    expect(payload.preferences).not.toHaveProperty('privacy');
    expect(payload.address).not.toHaveProperty('street');
    expect(payload.address).toHaveProperty('city');
  });
});

describe('strings', () => {
  it('converts and shortens', () => {
    expect(slug('Engineering Manager')).toBe('engineering-manager');
    expect(propertyName('first name')).toBe('firstName');
    expect(labelFromKey('joinedAt')).toBe('Joined At');
    expect(csvFileName('Salary Report 2026')).toBe('salary_report_2026.csv');
    expect(csvFileName('Q3 Report')).toBe('q_3_report.csv'); // a Lodash quirk: letters and digits are split;
    const long = 'Spends weekends contributing to open source projects and mentoring';
    expect(shorten(long, 30).length).toBeLessThanOrEqual(30);
    expect(shorten(long, 30).endsWith('…')).toBe(true);
    expect(shorten('short', 30)).toBe('short');
  });
});
