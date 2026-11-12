import chunk from 'lodash/chunk';
import cloneDeep from 'lodash/cloneDeep';
import countBy from 'lodash/countBy';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import isEqual from 'lodash/isEqual';
import map from 'lodash/map';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import uniqBy from 'lodash/uniqBy';

/**
 * Lodash against plain JavaScript on the same data. Each suite has two functions that must return
 * the SAME result (a test checks it): a benchmark of two functions that disagree measures nothing.
 */
export const SUITES = [
  { id: 'groupBy', title: 'groupBy department', lodash: (u) => groupBy(u, 'department'),
    native: (u) => u.reduce((g, x) => ((g[x.department] ??= []).push(x), g), {}) },
  { id: 'sortBy', title: 'sort by salary', lodash: (u) => sortBy(u, 'salary'), native: (u) => [...u].sort((a, b) => a.salary - b.salary) },
  { id: 'orderBy', title: 'sort by department, then salary (desc)', lodash: (u) => orderBy(u, ['department', 'salary'], ['asc', 'desc']),
    native: (u) => [...u].sort((a, b) => (a.department < b.department ? -1 : a.department > b.department ? 1 : 0) || b.salary - a.salary || 0) },
  { id: 'filterMap', title: 'filter then map', lodash: (u) => map(filter(u, (x) => x.rating >= 4), 'email'), native: (u) => u.filter((x) => x.rating >= 4).map((x) => x.email) },
  { id: 'uniqBy', title: 'unique cities', lodash: (u) => map(uniqBy(u, 'city'), 'city'), native: (u) => [...new Set(u.map((x) => x.city))] },
  { id: 'countBy', title: 'count per country', lodash: (u) => countBy(u, 'country'), native: (u) => u.reduce((c, x) => ((c[x.country] = (c[x.country] ?? 0) + 1), c), {}) },
  { id: 'sumBy', title: 'total salary', lodash: (u) => sumBy(u, 'salary'), native: (u) => u.reduce((s, x) => s + x.salary, 0) },
  { id: 'flatMap', title: 'all skills in one list', lodash: (u) => flatMap(u, 'skills'), native: (u) => u.flatMap((x) => x.skills) },
  { id: 'chunk', title: 'pages of 50', lodash: (u) => chunk(u, 50),
    native: (u) => { const pages = []; for (let i = 0; i < u.length; i += 50) pages.push(u.slice(i, i + 50)); return pages; } },
  { id: 'get', title: 'safe deep read (address.geo.lat)', lodash: (u) => map(u, (x) => get(x, 'address.geo.lat', 0)), native: (u) => u.map((x) => x?.address?.geo?.lat ?? 0) },
  { id: 'cloneDeep', title: 'deep copy (cloneDeep vs structuredClone)', lodash: (u) => cloneDeep(u), native: (u) => structuredClone(u), sizeLimit: 20000 },
  { id: 'isEqual', title: 'deep compare two copies', prepare: (u) => [u, structuredClone(u)], lodash: ([a, b]) => isEqual(a, b), native: ([a, b]) => JSON.stringify(a) === JSON.stringify(b), sizeLimit: 20000 },
];

const median = (numbers) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const time = (fn, data, now) => {
  const start = now();
  const result = fn(data);
  return { ms: now() - start, result };
};

/**
 * Time one suite. Each side runs `warmup` times first (so the engine has optimised it), then
 * `iterations` times; the MEDIAN is reported because one slow run (garbage collection) should not
 * decide the answer. `now` is injectable so tests do not depend on a real clock.
 */
export function runSuite(suite, users, { iterations = 7, warmup = 2, now = () => performance.now() } = {}) {
  const input = suite.prepare ? suite.prepare(users) : users;
  const sample = (fn) => {
    for (let i = 0; i < warmup; i += 1) fn(input);
    const runs = [];
    for (let i = 0; i < iterations; i += 1) runs.push(time(fn, input, now).ms);
    return median(runs);
  };
  const lodashMs = sample(suite.lodash);
  const nativeMs = sample(suite.native);
  const winner = lodashMs === nativeMs ? 'tie' : lodashMs < nativeMs ? 'lodash' : 'native';
  // how many times faster the winner is
  const factor = winner === 'tie' ? 1 : Math.max(lodashMs, nativeMs) / Math.max(Math.min(lodashMs, nativeMs), 0.0001);
  return { id: suite.id, title: suite.title, lodashMs, nativeMs, winner, factor };
}

/** Suites that make sense for this many records (deep copies of 100,000 users would take seconds) */
export const suitesFor = (size) => SUITES.filter((suite) => !suite.sizeLimit || size <= suite.sizeLimit);
