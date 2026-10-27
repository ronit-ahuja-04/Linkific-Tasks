import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { groupByLanguage, sortRepos, summarise } from '../src/report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = resolve(__dirname, './fixtures/repos.json');
const sampleRepos = JSON.parse(readFileSync(fixturePath, 'utf-8'));

test('groupByLanguage() correctly categorizes repositories by language', () => {
  const grouped = groupByLanguage(sampleRepos);
  assert.ok(grouped.JavaScript, 'Should contain JavaScript group');
  assert.equal(grouped.JavaScript.length, 3);
  assert.equal(grouped.TypeScript.length, 1);
  assert.equal(grouped.Python.length, 1);
});

test('groupByLanguage() categorizes null or undefined languages as "Unknown"', () => {
  const grouped = groupByLanguage(sampleRepos);
  assert.ok(grouped.Unknown, 'Should contain Unknown group');
  assert.equal(grouped.Unknown.length, 1);
  assert.equal(grouped.Unknown[0].name, 'docs-site-generator');
});

test('groupByLanguage() returns empty object when passed non-array input', () => {
  assert.deepEqual(groupByLanguage(null), {});
  assert.deepEqual(groupByLanguage(undefined), {});
  assert.deepEqual(groupByLanguage([]), {});
});

test('sortRepos() sorts repositories primarily by star count descending', () => {
  const sorted = sortRepos(sampleRepos);
  assert.equal(sorted[0].stargazers_count, 500);
  assert.equal(sorted[1].stargazers_count, 210);
  assert.equal(sorted[2].stargazers_count, 142);
});

test('sortRepos() breaks star ties with pushed_at date descending', () => {
  const tieRepos = [
    { name: 'repo-older', stargazers_count: 50, pushed_at: '2026-01-01T00:00:00Z' },
    { name: 'repo-newer', stargazers_count: 50, pushed_at: '2026-05-01T00:00:00Z' },
  ];
  const sorted = sortRepos(tieRepos);
  assert.equal(sorted[0].name, 'repo-newer');
  assert.equal(sorted[1].name, 'repo-older');
});

test('summarise() accurately calculates total repositories, stars, and forks', () => {
  const activeRepos = sampleRepos.filter((r) => !r.fork && !r.archived);
  const summary = summarise(activeRepos);

  assert.equal(summary.totalRepos, 5);
  assert.equal(summary.totalStars, 142 + 89 + 55 + 210 + 12);
  assert.equal(summary.totalForks, 28 + 12 + 7 + 45 + 2);
});

test('summarise() handles empty or invalid inputs gracefully', () => {
  assert.deepEqual(summarise([]), { totalRepos: 0, totalStars: 0, totalForks: 0 });
  assert.deepEqual(summarise(null), { totalRepos: 0, totalStars: 0, totalForks: 0 });
});
