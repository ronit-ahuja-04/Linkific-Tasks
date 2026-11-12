import countBy from 'lodash/countBy';
import flatMap from 'lodash/flatMap';
import identity from 'lodash/identity';
import map from 'lodash/map';
import maxBy from 'lodash/maxBy';
import meanBy from 'lodash/meanBy';
import minBy from 'lodash/minBy';
import orderBy from 'lodash/orderBy';
import partition from 'lodash/partition';
import range from 'lodash/range';
import round from 'lodash/round';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import take from 'lodash/take';
import toPairs from 'lodash/toPairs';
import uniqBy from 'lodash/uniqBy';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';

/**
 * The dashboard half of Day 13: turning a long list into a few numbers and a few small tables.
 * Each function is a short chain of Lodash steps over the same list of users.
 */

/** Headline numbers. sumBy/meanBy take a property name or a function; maxBy finds the biggest item. */
export function summarize(users) {
  return {
    total: users.length,
    payroll: sumBy(users, 'salary'),
    avgSalary: round(meanBy(users, 'salary')),
    avgRating: round(meanBy(users, 'rating'), 2),
    avgAge: round(meanBy(users, 'age'), 1),
    countries: uniqBy(users, 'country').length, // uniqBy keeps the first item for each distinct value
    highestPaid: maxBy(users, 'salary'),
    topRated: maxBy(users, 'rating'),
    newestHire: maxBy(users, 'joinedAt'),
  };
}

/** countBy(list, key): { Engineering: 1250, Design: 980, ... }. toPairs + orderBy turns it into a ranked list. */
export function headcountBy(users, key) {
  return orderBy(map(toPairs(countBy(users, key)), ([label, value]) => ({ label, value })), ['value', 'label'], ['desc', 'asc']);
}

/**
 * Salary histogram. countBy groups people into buckets of `size` (60000, 80000, ...), and range()
 * lists every bucket so empty ones show as zero instead of disappearing.
 */
export function salaryHistogram(users, size = 20000) {
  if (users.length === 0) return [];
  const counts = countBy(users, (u) => Math.floor(u.salary / size) * size);
  const lowest = Math.min(...map(Object.keys(counts), Number));
  const highest = Math.max(...map(Object.keys(counts), Number));
  return map(range(lowest, highest + size, size), (start) => ({ start, end: start + size - 1, value: counts[start] ?? 0 }));
}

export function hiresByYear(users) {
  if (users.length === 0) return [];
  const counts = countBy(users, (u) => u.joinedAt.slice(0, 4));
  const years = map(Object.keys(counts), Number);
  return map(range(Math.min(...years), Math.max(...years) + 1), (year) => ({ label: String(year), value: counts[year] ?? 0 }));
}

/** flatMap(users, 'skills') joins everyone's skill lists into one long list, then countBy(identity) counts each skill. */
export function topSkills(users, limit = 10) {
  const counts = countBy(flatMap(users, 'skills'), identity);
  return take(orderBy(map(toPairs(counts), ([label, value]) => ({ label, value })), ['value', 'label'], ['desc', 'asc']), limit);
}

/** partition(list, predicate) splits into [matching, rest] in one pass */
export function seniorSplit(users, minAge = 40) {
  const [senior, junior] = partition(users, (u) => u.age >= minAge);
  return { senior: senior.length, junior: junior.length };
}

/** For each department: lowest, average and highest salary (minBy, meanBy, maxBy) */
export function salaryByDepartment(users) {
  return sortBy(
    map(groupBy(users, 'department'), (members, department) => ({
      department,
      count: members.length,
      min: minBy(members, 'salary').salary,
      avg: round(meanBy(members, 'salary')),
      max: maxBy(members, 'salary').salary,
    })),
    'department'
  );
}

/** mapValues keeps the keys and transforms each value: { Engineering: 3.9, Design: 4.1, ... } */
export const averageRatingBy = (users, key) => mapValues(groupBy(users, key), (members) => round(meanBy(members, 'rating'), 2));

export const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
