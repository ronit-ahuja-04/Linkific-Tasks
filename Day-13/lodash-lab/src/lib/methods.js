import camelCase from 'lodash/camelCase';
import capitalize from 'lodash/capitalize';
import chunk from 'lodash/chunk';
import clamp from 'lodash/clamp';
import clone from 'lodash/clone';
import cloneDeep from 'lodash/cloneDeep';
import compact from 'lodash/compact';
import countBy from 'lodash/countBy';
import deburr from 'lodash/deburr';
import difference from 'lodash/difference';
import escapeRegExp from 'lodash/escapeRegExp';
import every from 'lodash/every';
import filter from 'lodash/filter';
import find from 'lodash/find';
import flatMap from 'lodash/flatMap';
import flatten from 'lodash/flatten';
import flattenDeep from 'lodash/flattenDeep';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import has from 'lodash/has';
import inRange from 'lodash/inRange';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import kebabCase from 'lodash/kebabCase';
import map from 'lodash/map';
import maxBy from 'lodash/maxBy';
import meanBy from 'lodash/meanBy';
import memoize from 'lodash/memoize';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import orderBy from 'lodash/orderBy';
import partition from 'lodash/partition';
import pick from 'lodash/pick';
import random from 'lodash/random';
import range from 'lodash/range';
import reduce from 'lodash/reduce';
import sample from 'lodash/sample';
import set from 'lodash/set';
import shuffle from 'lodash/shuffle';
import some from 'lodash/some';
import sortBy from 'lodash/sortBy';
import startCase from 'lodash/startCase';
import sumBy from 'lodash/sumBy';
import times from 'lodash/times';
import truncate from 'lodash/truncate';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';

/**
 * The gallery's registry. Every entry is one Lodash method shown with a small input, the Lodash
 * call, and (when there is one) the native JavaScript way to get the same result.
 *
 *   input()        fresh sample data (a function, so one run can never change another)
 *   lodash(input)  the Lodash result
 *   native(input)  the plain JavaScript result, or null when JavaScript has no built-in equivalent
 *   random         true: the result changes every run, so only its shape is checked
 *   differs        true: the native version is NOT equivalent (the point of the entry)
 *   facts(input, result)  extra things worth noticing, as short sentences
 *   interactive    the method is shown live on the "Search lab" tab instead
 */
const people = () => [
  { name: 'Ana', age: 31, team: 'web', active: true },
  { name: 'Ben', age: 25, team: 'api', active: false },
  { name: 'Cleo', age: 31, team: 'web', active: true },
  { name: 'Dev', age: 42, team: 'api', active: true },
];

export const METHODS = [
  // ---------------- Array ----------------
  { id: 'chunk', category: 'Array', summary: 'Split a list into groups of a given size (pagination).',
    input: () => [1, 2, 3, 4, 5, 6, 7], lodashCode: 'chunk(numbers, 3)', nativeCode: 'Array.from({ length: Math.ceil(n.length / 3) }, (_, i) => n.slice(i * 3, i * 3 + 3))',
    lodash: (a) => chunk(a, 3), native: (a) => Array.from({ length: Math.ceil(a.length / 3) }, (_, i) => a.slice(i * 3, i * 3 + 3)) },
  { id: 'flatten', category: 'Array', summary: 'Flatten one level of nesting.',
    input: () => [1, [2, 3], [4, [5, 6]]], lodashCode: 'flatten(nested)', nativeCode: 'nested.flat()',
    lodash: (a) => flatten(a), native: (a) => a.flat() },
  { id: 'flattenDeep', category: 'Array', summary: 'Flatten every level of nesting.',
    input: () => [1, [2, 3], [4, [5, [6]]]], lodashCode: 'flattenDeep(nested)', nativeCode: 'nested.flat(Infinity)',
    lodash: (a) => flattenDeep(a), native: (a) => a.flat(Infinity) },
  { id: 'uniq', category: 'Array', summary: 'Remove duplicates, keeping the first of each.',
    input: () => [3, 1, 3, 2, 1, 4], lodashCode: 'uniq(numbers)', nativeCode: '[...new Set(numbers)]',
    lodash: (a) => uniq(a), native: (a) => [...new Set(a)] },
  { id: 'uniqBy', category: 'Array', summary: 'Remove duplicates by a property or function.',
    input: people, lodashCode: "uniqBy(people, 'team')", nativeCode: '[...new Map(people.map((p) => [p.team, p])).values()] // keeps the LAST of each',
    lodash: (a) => uniqBy(a, 'team'), native: (a) => [...new Map(a.map((p) => [p.team, p])).values()], differs: true,
    facts: () => ['Lodash keeps the first person per team, the Map trick keeps the last.'] },
  { id: 'shuffle', category: 'Array', summary: 'Return the list in random order (a copy).',
    input: () => [1, 2, 3, 4, 5], lodashCode: 'shuffle(numbers)', nativeCode: '[...n].sort(() => Math.random() - 0.5) // biased! use Fisher-Yates',
    lodash: (a) => shuffle(a), native: null, random: true,
    facts: (input, result) => [`Same items, possibly new order: ${[...result].sort().join(',') === [...input].sort().join(',')}`, 'The original array is not changed.'] },
  { id: 'sample', category: 'Array', summary: 'Pick one random element.',
    input: () => ['red', 'green', 'blue'], lodashCode: 'sample(colors)', nativeCode: 'colors[Math.floor(Math.random() * colors.length)]',
    lodash: (a) => sample(a), native: null, random: true },
  { id: 'sortBy', category: 'Array', summary: 'Sort by a property or function; returns a new array and keeps ties in order.',
    input: people, lodashCode: "sortBy(people, 'age')", nativeCode: '[...people].sort((a, b) => a.age - b.age)',
    lodash: (a) => sortBy(a, 'age'), native: (a) => [...a].sort((x, y) => x.age - y.age) },
  { id: 'orderBy', category: 'Array', summary: 'Sort by several keys, each ascending or descending.',
    input: people, lodashCode: "orderBy(people, ['team', 'age'], ['asc', 'desc'])", nativeCode: '[...people].sort((a, b) => a.team.localeCompare(b.team) || b.age - a.age)',
    lodash: (a) => orderBy(a, ['team', 'age'], ['asc', 'desc']), native: (a) => [...a].sort((x, y) => x.team.localeCompare(y.team) || y.age - x.age) },
  { id: 'groupBy', category: 'Array', summary: 'Group items into { key: [items] }.',
    input: people, lodashCode: "groupBy(people, 'team')", nativeCode: 'people.reduce((groups, p) => ((groups[p.team] ??= []).push(p), groups), {})',
    lodash: (a) => groupBy(a, 'team'), native: (a) => a.reduce((groups, p) => ((groups[p.team] ??= []).push(p), groups), {}) },
  { id: 'countBy', category: 'Array', summary: 'Count items per key.',
    input: people, lodashCode: "countBy(people, 'team')", nativeCode: 'people.reduce((c, p) => ({ ...c, [p.team]: (c[p.team] ?? 0) + 1 }), {})',
    lodash: (a) => countBy(a, 'team'), native: (a) => a.reduce((c, p) => ({ ...c, [p.team]: (c[p.team] ?? 0) + 1 }), {}) },
  { id: 'compact', category: 'Array', summary: 'Drop falsy values (false, 0, "", null, undefined, NaN).',
    input: () => [0, 1, false, 2, '', 3, null, undefined, NaN], lodashCode: 'compact(values)', nativeCode: 'values.filter(Boolean)',
    lodash: (a) => compact(a), native: (a) => a.filter(Boolean) },
  { id: 'difference', category: 'Array', summary: 'Items in the first list that are not in the second.',
    input: () => [[1, 2, 3, 4], [2, 4]], lodashCode: 'difference(a, b)', nativeCode: 'a.filter((x) => !b.includes(x))',
    lodash: ([a, b]) => difference(a, b), native: ([a, b]) => a.filter((x) => !b.includes(x)) },
  { id: 'intersection', category: 'Array', summary: 'Items found in both lists.',
    input: () => [[1, 2, 3, 4], [2, 4, 6]], lodashCode: 'intersection(a, b)', nativeCode: 'a.filter((x) => b.includes(x))',
    lodash: ([a, b]) => intersection(a, b), native: ([a, b]) => a.filter((x) => b.includes(x)) },

  // ---------------- Object ----------------
  { id: 'pick', category: 'Object', summary: 'Copy only the listed properties.',
    input: () => ({ id: 1, name: 'Ana', password: 'secret', role: 'admin' }), lodashCode: "pick(user, ['id', 'name'])", nativeCode: "Object.fromEntries(['id', 'name'].map((k) => [k, user[k]]))",
    lodash: (o) => pick(o, ['id', 'name']), native: (o) => Object.fromEntries(['id', 'name'].map((k) => [k, o[k]])) },
  { id: 'omit', category: 'Object', summary: 'Copy everything except the listed properties (nested paths too).',
    input: () => ({ id: 1, name: 'Ana', password: 'secret', profile: { age: 31, ssn: '123' } }), lodashCode: "omit(user, ['password', 'profile.ssn'])",
    nativeCode: '// top level is easy; "profile.ssn" needs a manual deep copy',
    lodash: (o) => omit(o, ['password', 'profile.ssn']), native: null },
  { id: 'merge', category: 'Object', summary: 'Deep-merge objects: nested objects are combined, not replaced.',
    input: () => [{ theme: 'light', notifications: { email: true, push: false } }, { notifications: { push: true } }], lodashCode: 'merge({}, defaults, overrides)', nativeCode: '{ ...defaults, ...overrides } // SHALLOW: replaces notifications entirely',
    lodash: ([a, b]) => merge({}, a, b), native: ([a, b]) => ({ ...a, ...b }), differs: true,
    facts: () => ['Spread lost notifications.email, because it replaces the whole nested object.'] },
  { id: 'clone', category: 'Object', summary: 'Shallow copy: top level is new, nested objects are shared.',
    input: () => ({ name: 'Ana', address: { city: 'Pune' } }), lodashCode: 'clone(user)', nativeCode: '{ ...user }',
    lodash: (o) => clone(o), native: (o) => ({ ...o }),
    facts: (input, result) => [`copy.address === original.address: ${result.address === input.address}`, 'Changing copy.address.city would also change the original.'] },
  { id: 'cloneDeep', category: 'Object', summary: 'Deep copy: nothing is shared with the original.',
    input: () => ({ name: 'Ana', address: { city: 'Pune' }, tags: ['a', 'b'] }), lodashCode: 'cloneDeep(user)', nativeCode: 'structuredClone(user)',
    lodash: (o) => cloneDeep(o), native: (o) => structuredClone(o),
    facts: (input, result) => [`copy.address === original.address: ${result.address === input.address}`] },
  { id: 'get', category: 'Object', summary: 'Read a nested value safely, with a fallback.',
    input: () => ({ user: { address: { geo: { lat: 18.52 } } } }), lodashCode: "get(data, 'user.address.geo.lat', 0)", nativeCode: 'data?.user?.address?.geo?.lat ?? 0',
    lodash: (o) => [get(o, 'user.address.geo.lat', 0), get(o, 'user.contact.phone', 'n/a'), get(o, 'user.tags[0]', 'none')],
    native: (o) => [o?.user?.address?.geo?.lat ?? 0, o?.user?.contact?.phone ?? 'n/a', o?.user?.tags?.[0] ?? 'none'] },
  { id: 'set', category: 'Object', summary: 'Write a nested value by path, creating missing parents.',
    input: () => ({ name: 'Ana' }), lodashCode: "set(copy, 'address.geo.lat', 18.52)", nativeCode: '// no built-in: create address, then geo, then lat by hand',
    lodash: (o) => set(structuredClone(o), 'address.geo.lat', 18.52), native: null },
  { id: 'has', category: 'Object', summary: 'Does a nested path exist?',
    input: () => ({ a: { b: { c: 0 } } }), lodashCode: "has(obj, 'a.b.c')", nativeCode: 'obj?.a?.b !== undefined && Object.hasOwn(obj.a.b, "c")',
    lodash: (o) => [has(o, 'a.b.c'), has(o, 'a.x.c')], native: (o) => [o?.a?.b !== undefined && Object.hasOwn(o.a.b, 'c'), o?.a?.x !== undefined] },
  { id: 'isEqual', category: 'Object', summary: 'Deep comparison of values.',
    input: () => [{ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }], lodashCode: 'isEqual(first, second)', nativeCode: 'JSON.stringify(first) === JSON.stringify(second) // breaks on key order, undefined, Dates',
    lodash: ([a, b]) => isEqual(a, b), native: ([a, b]) => JSON.stringify(a) === JSON.stringify(b) },
  { id: 'isEmpty', category: 'Object', summary: 'Is it an empty array, object, string, Map or Set (or nullish)?',
    input: () => [[], {}, '', null, [0], { a: 1 }, 'x'], lodashCode: 'values.map(isEmpty)', nativeCode: '// a different check for each type',
    lodash: (a) => a.map((v) => isEmpty(v)), native: null },

  // ---------------- Collection ----------------
  { id: 'filter', category: 'Collection', summary: 'Keep matching items; accepts a shorthand object.',
    input: people, lodashCode: "filter(people, { team: 'web', active: true })", nativeCode: "people.filter((p) => p.team === 'web' && p.active)",
    lodash: (a) => filter(a, { team: 'web', active: true }), native: (a) => a.filter((p) => p.team === 'web' && p.active) },
  { id: 'map', category: 'Collection', summary: 'Transform every item; accepts a property name.',
    input: people, lodashCode: "map(people, 'name')", nativeCode: 'people.map((p) => p.name)',
    lodash: (a) => map(a, 'name'), native: (a) => a.map((p) => p.name) },
  { id: 'find', category: 'Collection', summary: 'First item that matches.',
    input: people, lodashCode: "find(people, { team: 'api', active: true })", nativeCode: "people.find((p) => p.team === 'api' && p.active)",
    lodash: (a) => find(a, { team: 'api', active: true }), native: (a) => a.find((p) => p.team === 'api' && p.active) },
  { id: 'reduce', category: 'Collection', summary: 'Fold a list into one value.',
    input: people, lodashCode: 'reduce(people, (sum, p) => sum + p.age, 0)', nativeCode: 'people.reduce((sum, p) => sum + p.age, 0)',
    lodash: (a) => reduce(a, (sum, p) => sum + p.age, 0), native: (a) => a.reduce((sum, p) => sum + p.age, 0) },
  { id: 'every', category: 'Collection', summary: 'Do ALL items match?',
    input: people, lodashCode: "every(people, (p) => p.age > 18)", nativeCode: 'people.every((p) => p.age > 18)',
    lodash: (a) => every(a, (p) => p.age > 18), native: (a) => a.every((p) => p.age > 18) },
  { id: 'some', category: 'Collection', summary: 'Does ANY item match?',
    input: people, lodashCode: "some(people, { active: false })", nativeCode: 'people.some((p) => !p.active)',
    lodash: (a) => some(a, { active: false }), native: (a) => a.some((p) => !p.active) },
  { id: 'partition', category: 'Collection', summary: 'Split into [matching, the rest] in one pass.',
    input: people, lodashCode: "partition(people, 'active')", nativeCode: 'people.reduce(([yes, no], p) => (p.active ? [[...yes, p], no] : [yes, [...no, p]]), [[], []])',
    lodash: (a) => partition(a, 'active'), native: (a) => a.reduce(([yes, no], p) => (p.active ? [[...yes, p], no] : [yes, [...no, p]]), [[], []]) },
  { id: 'sumBy', category: 'Collection', summary: 'Sum a property.',
    input: people, lodashCode: "sumBy(people, 'age')", nativeCode: 'people.reduce((s, p) => s + p.age, 0)',
    lodash: (a) => sumBy(a, 'age'), native: (a) => a.reduce((s, p) => s + p.age, 0) },
  { id: 'meanBy', category: 'Collection', summary: 'Average a property.',
    input: people, lodashCode: "meanBy(people, 'age')", nativeCode: 'people.reduce((s, p) => s + p.age, 0) / people.length',
    lodash: (a) => meanBy(a, 'age'), native: (a) => a.reduce((s, p) => s + p.age, 0) / a.length },
  { id: 'maxBy', category: 'Collection', summary: 'The item with the highest value.',
    input: people, lodashCode: "maxBy(people, 'age')", nativeCode: 'people.reduce((best, p) => (p.age > best.age ? p : best))',
    lodash: (a) => maxBy(a, 'age'), native: (a) => a.reduce((best, p) => (p.age > best.age ? p : best)) },
  { id: 'flatMap', category: 'Collection', summary: 'Map, then flatten one level.',
    input: () => [{ name: 'Ana', skills: ['React', 'CSS'] }, { name: 'Ben', skills: ['SQL'] }], lodashCode: "flatMap(people, 'skills')", nativeCode: 'people.flatMap((p) => p.skills)',
    lodash: (a) => flatMap(a, 'skills'), native: (a) => a.flatMap((p) => p.skills) },

  // ---------------- String ----------------
  { id: 'camelCase', category: 'String', summary: 'Convert to camelCase.',
    input: () => ['first name', 'Last-Name', 'JOINED_AT'], lodashCode: 'names.map(camelCase)', nativeCode: '// no built-in',
    lodash: (a) => a.map((s) => camelCase(s)), native: null },
  { id: 'kebabCase', category: 'String', summary: 'Convert to kebab-case (URLs, CSS classes, file names).',
    input: () => ['Engineering Manager', 'fooBar', 'Product_Analyst'], lodashCode: 'titles.map(kebabCase)', nativeCode: '// no built-in',
    lodash: (a) => a.map((s) => kebabCase(s)), native: null },
  { id: 'startCase', category: 'String', summary: 'Make a readable title from a code-style name.',
    input: () => ['joinedAt', 'first_name', 'show-email'], lodashCode: 'keys.map(startCase)', nativeCode: '// no built-in',
    lodash: (a) => a.map((s) => startCase(s)), native: null },
  { id: 'capitalize', category: 'String', summary: 'First letter upper case, the rest lower case.',
    input: () => ['mEI', 'JOSÉ', 'zoë'], lodashCode: 'names.map(capitalize)', nativeCode: 's.charAt(0).toUpperCase() + s.slice(1).toLowerCase()',
    lodash: (a) => a.map((s) => capitalize(s)), native: (a) => a.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) },
  { id: 'truncate', category: 'String', summary: 'Cut long text and add an ellipsis, optionally at a word boundary.',
    input: () => 'Spends weekends contributing to open source projects and mentoring', lodashCode: "truncate(bio, { length: 40, separator: ' ' })", nativeCode: "// find the last space before 40 characters by hand",
    lodash: (s) => truncate(s, { length: 40, separator: ' ' }), native: null },
  { id: 'deburr', category: 'String', summary: 'Remove accents so "José" matches "jose".',
    input: () => 'Zoë José Müller Ångström', lodashCode: 'deburr(text)', nativeCode: "text.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')",
    lodash: (s) => deburr(s), native: (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '') },
  { id: 'escapeRegExp', category: 'String', summary: 'Make user text safe to put inside a regular expression.',
    input: () => 'node.js (v20+) [lts]', lodashCode: 'escapeRegExp(text)', nativeCode: "text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')",
    lodash: (s) => escapeRegExp(s), native: (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },

  // ---------------- Function and utility ----------------
  { id: 'debounce', category: 'Function', summary: 'Wait until calls stop for N ms, then run once (search boxes).',
    input: () => null, lodashCode: 'debounce(search, 300)', nativeCode: '// a setTimeout you clear and restart on every call', lodash: () => null, native: null, interactive: 'Search lab' },
  { id: 'throttle', category: 'Function', summary: 'Run at most once per N ms (scroll, resize).',
    input: () => null, lodashCode: 'throttle(onScroll, 200)', nativeCode: '// track the last run time and skip calls that come too soon', lodash: () => null, native: null, interactive: 'Search lab' },
  { id: 'memoize', category: 'Function', summary: 'Cache a function result per argument.',
    input: () => [4, 4, 5, 4, 5], lodashCode: 'const slowSquare = memoize((n) => n * n)',
    nativeCode: 'const cache = new Map(); (n) => cache.get(n) ?? (cache.set(n, n * n), n * n)',
    lodash: (args) => { let calls = 0; const square = memoize((n) => { calls += 1; return n * n; }); return { results: args.map(square), realCalls: calls }; },
    native: (args) => { let calls = 0; const cache = new Map(); const square = (n) => { if (!cache.has(n)) { calls += 1; cache.set(n, n * n); } return cache.get(n); }; return { results: args.map(square), realCalls: calls }; } },
  { id: 'times', category: 'Function', summary: 'Call a function n times and collect the results.',
    input: () => 5, lodashCode: 'times(5, (i) => i * i)', nativeCode: 'Array.from({ length: 5 }, (_, i) => i * i)',
    lodash: (n) => times(n, (i) => i * i), native: (n) => Array.from({ length: n }, (_, i) => i * i) },
  { id: 'range', category: 'Function', summary: 'A list of numbers from start to end (exclusive).',
    input: () => [0, 20, 5], lodashCode: 'range(0, 20, 5)', nativeCode: 'Array.from({ length: 4 }, (_, i) => i * 5)',
    lodash: ([a, b, c]) => range(a, b, c), native: ([a, b, c]) => Array.from({ length: Math.ceil((b - a) / c) }, (_, i) => a + i * c) },
  { id: 'random', category: 'Function', summary: 'A random integer in a range (inclusive), or a float.',
    input: () => [1, 6], lodashCode: 'random(1, 6)', nativeCode: 'Math.floor(Math.random() * 6) + 1',
    lodash: ([a, b]) => random(a, b), native: null, random: true },
  { id: 'clamp', category: 'Function', summary: 'Keep a number between a minimum and a maximum.',
    input: () => [[-5, 0, 10], 0, 10], lodashCode: 'clamp(n, 0, 10)', nativeCode: 'Math.min(Math.max(n, 0), 10)',
    lodash: ([values, lo, hi]) => values.map((n) => clamp(n, lo, hi)), native: ([values, lo, hi]) => values.map((n) => Math.min(Math.max(n, lo), hi)) },
  { id: 'inRange', category: 'Function', summary: 'Is a number in [start, end)?',
    input: () => [[3, 4, 10], 4, 10], lodashCode: 'inRange(n, 4, 10)', nativeCode: 'n >= 4 && n < 10',
    lodash: ([values, a, b]) => values.map((n) => inRange(n, a, b)), native: ([values, a, b]) => values.map((n) => n >= a && n < b) },
];

export const CATEGORIES = ['Array', 'Object', 'Collection', 'String', 'Function'];

/** Run one entry and report what happened */
export function runMethod(entry) {
  const input = entry.input();
  if (entry.interactive) return { input, interactive: entry.interactive };
  const lodashResult = entry.lodash(structuredCloneSafe(input));
  const nativeResult = entry.native ? entry.native(structuredCloneSafe(input)) : undefined;
  return {
    input,
    lodashResult,
    nativeResult,
    hasNative: Boolean(entry.native),
    same: entry.native ? isEqual(lodashResult, nativeResult) : null,
    facts: entry.facts ? entry.facts(input, lodashResult) : [],
  };
}

const structuredCloneSafe = (value) => (value === undefined || value === null ? value : structuredClone(value));

/** Readable text for a result (undefined, NaN and functions do not survive JSON.stringify as-is) */
export function formatValue(value) {
  if (value === undefined) return 'undefined';
  return JSON.stringify(value, (key, v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v === undefined ? 'undefined' : v), 2);
}
