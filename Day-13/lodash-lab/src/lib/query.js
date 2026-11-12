import chunk from 'lodash/chunk';
import clamp from 'lodash/clamp';
import deburr from 'lodash/deburr';
import every from 'lodash/every';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import includes from 'lodash/includes';
import inRange from 'lodash/inRange';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import meanBy from 'lodash/meanBy';
import orderBy from 'lodash/orderBy';
import some from 'lodash/some';
import sumBy from 'lodash/sumBy';
import toLower from 'lodash/toLower';
import words from 'lodash/words';
import escapeRegExp from 'lodash/escapeRegExp';

/**
 * Searching, filtering, sorting, grouping and paging: the "user list" half of Day 13. Every
 * function is pure (data in, data out), so each can be tested without React.
 */

/** Lower-case and strip accents: "Zoë" and "José" are found by typing "zoe" and "jose" */
export const normalize = (text) => toLower(deburr(String(text ?? '')));

/** Split a search box value into words. words(text, /\S+/g) keeps things like "node.js" whole. */
export const tokenize = (query) => words(normalize(query), /\S+/g);

const searchableText = (user) =>
  normalize([user.firstName, user.lastName, user.email, user.city, user.country, user.department, user.role, ...user.skills].join(' '));

/**
 * Build the search index once per dataset. Normalising 10,000 users on every keystroke would be
 * wasteful, so the text is prepared up front and each search is a cheap `includes`.
 */
export function createIndex(users) {
  return map(users, (user) => ({ user, text: searchableText(user) }));
}

export const DEFAULT_FILTERS = { query: '', departments: [], countries: [], skills: [], minRating: 0, ageRange: [18, 70] };

/**
 * filter(): keep the entries for which the predicate is true.
 * every(): all search words must appear. some(): a user needs at least one of the chosen skills.
 * inRange(n, start, end): start <= n < end, which is why the upper age bound gets + 1.
 */
export function searchUsers(index, filters = DEFAULT_FILTERS) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const tokens = tokenize(f.query);
  const [minAge, maxAge] = f.ageRange;
  return map(
    filter(index, ({ user, text }) => {
      if (!every(tokens, (token) => includes(text, token))) return false;
      if (!isEmpty(f.departments) && !includes(f.departments, user.department)) return false;
      if (!isEmpty(f.countries) && !includes(f.countries, user.country)) return false;
      if (!isEmpty(f.skills) && !some(f.skills, (skill) => includes(user.skills, skill))) return false;
      if (user.rating < f.minRating) return false;
      return inRange(user.age, minAge, maxAge + 1);
    }),
    'user'
  );
}

/** Columns the directory can show and sort by. `value` is what is compared when sorting. */
export const COLUMNS = [
  { id: 'name', label: 'Name', value: (u) => [normalize(u.lastName), normalize(u.firstName)] },
  { id: 'department', label: 'Department', value: (u) => u.department },
  { id: 'role', label: 'Role', value: (u) => u.role },
  { id: 'country', label: 'Country', value: (u) => u.country },
  { id: 'age', label: 'Age', value: (u) => u.age },
  { id: 'salary', label: 'Salary', value: (u) => u.salary },
  { id: 'rating', label: 'Rating', value: (u) => u.rating },
  { id: 'joinedAt', label: 'Joined', value: (u) => u.joinedAt },
];

/**
 * orderBy(list, [iteratees], [directions]) sorts by several keys at once, each ascending or
 * descending. It never changes the original array (native Array.sort does).
 * `sorts` looks like [{ id: 'department', dir: 'asc' }, { id: 'salary', dir: 'desc' }].
 */
export function sortUsers(users, sorts = []) {
  if (isEmpty(sorts)) return users;
  const iteratees = map(sorts, ({ id }) => {
    const column = COLUMNS.find((c) => c.id === id);
    // the name column compares last name, then first name
    return id === 'name' ? (u) => column.value(u).join(' ') : column.value;
  });
  return orderBy(users, [...iteratees, 'id'], [...map(sorts, 'dir'), 'asc']);
}

/** Click a header: none -> ascending -> descending -> none. Returns the new `sorts` list. */
export function toggleSort(sorts, id, { additive = false } = {}) {
  const current = sorts.find((s) => s.id === id);
  const others = additive ? sorts.filter((s) => s.id !== id) : [];
  if (!current) return [...others, { id, dir: 'asc' }];
  if (current.dir === 'asc') return [...others, { id, dir: 'desc' }];
  return others;
}

/**
 * groupBy(list, key) turns a list into { key: [items...] }. Here each group also gets a count,
 * an average salary and an average rating (meanBy), and the biggest groups come first.
 */
export function groupUsers(users, key) {
  const groups = map(groupBy(users, key), (members, value) => ({
    key: value,
    count: members.length,
    totalSalary: sumBy(members, 'salary'),
    avgSalary: Math.round(meanBy(members, 'salary')),
    avgRating: Math.round(meanBy(members, 'rating') * 10) / 10,
    users: members,
  }));
  return orderBy(groups, ['count', 'key'], ['desc', 'asc']);
}

/** chunk(list, size): [1,2,3,4,5] with size 2 becomes [[1,2],[3,4],[5]]. That is pagination. */
export const paginate = (users, pageSize) => chunk(users, pageSize);

/** clamp(n, min, max) keeps a page number inside the range that exists */
export const clampPage = (page, pageCount) => clamp(page, 0, Math.max(pageCount - 1, 0));

/**
 * Split text into [{ text, match }] parts so the UI can wrap the matches in <mark>.
 * Matching runs on the accent-free lower-case copy ("zoe" finds "Zoë"), and the parts are cut from
 * the ORIGINAL text so the accents and capitals the user sees are kept. deburr can change the
 * length (æ becomes ae); when it does, the positions would not line up, so that text is not marked.
 */
export function highlightParts(text, query) {
  const tokens = tokenize(query);
  const plain = [{ text, match: false }];
  if (isEmpty(tokens) || !text) return plain;
  const folded = normalize(text);
  if (folded.length !== text.length) return plain;
  const pattern = new RegExp(map(tokens, escapeRegExp).join('|'), 'g'); // escapeRegExp: "node.js" must not mean "node any-char js"
  const parts = [];
  let cursor = 0;
  for (const found of folded.matchAll(pattern)) {
    if (found.index > cursor) parts.push({ text: text.slice(cursor, found.index), match: false });
    parts.push({ text: text.slice(found.index, found.index + found[0].length), match: true });
    cursor = found.index + found[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
  return parts.length ? parts : plain;
}
