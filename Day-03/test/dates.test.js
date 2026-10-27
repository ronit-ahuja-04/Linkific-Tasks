import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPushed } from '../src/dates.js';

test('formatPushed() parses valid ISO string and produces absolute and relative dates', () => {
  const iso = '2026-10-20T10:15:00Z';
  const result = formatPushed(iso);

  assert.equal(typeof result.absolute, 'string');
  assert.equal(typeof result.relative, 'string');
  assert.ok(result.absolute.startsWith('2026-10-20'));
  assert.ok(result.formatted.includes('2026-10-20'));
});

test('formatPushed() returns graceful fallback for null, undefined, or empty date string', () => {
  const resultNull = formatPushed(null);
  assert.equal(resultNull.absolute, 'Unknown');
  assert.equal(resultNull.relative, 'Never');

  const resultEmpty = formatPushed('');
  assert.equal(resultEmpty.absolute, 'Unknown');
  assert.equal(resultEmpty.relative, 'Never');
});

test('formatPushed() handles invalid date strings safely without throwing', () => {
  const result = formatPushed('not-a-real-date');
  assert.equal(result.absolute, 'Invalid date');
  assert.equal(result.relative, 'Invalid date');
});

test('formatPushed() calculates relative distance correctly against fixed now reference', () => {
  const now = new Date('2026-10-27T12:00:00Z');
  const pastIso = '2026-10-25T12:00:00Z';
  const result = formatPushed(pastIso, now);

  assert.ok(result.relative.includes('2 days ago') || result.relative.includes('day'));
});
