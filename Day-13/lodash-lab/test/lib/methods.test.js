import { describe, expect, it } from 'vitest';
import { CATEGORIES, METHODS, runMethod } from '../../src/lib/methods';
import { SUITES, runSuite, suitesFor } from '../../src/lib/benchmarks';
import { getDataset } from '../../src/data/generateUsers';

describe('methods registry', () => {
  it('has unique ids and known categories', () => {
    const ids = METHODS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    METHODS.forEach((m) => expect(CATEGORIES).toContain(m.category));
    expect(METHODS.length).toBeGreaterThanOrEqual(35);
  });

  it.each(METHODS.filter((m) => !m.interactive))('$id runs, and matches native unless it differs on purpose', (entry) => {
    const out = runMethod(entry);
    expect(out.lodashResult).not.toBeUndefined();
    if (out.hasNative && !entry.random) {
      expect(out.same).toBe(!entry.differs);
    }
  });

  it('does not mutate shared input between runs', () => {
    const a = runMethod(METHODS.find((m) => m.id === 'shuffle'));
    expect([...a.lodashResult].sort()).toEqual([...a.input].sort());
  });
});

describe('benchmarks', () => {
  const users = getDataset(300);
  it.each(SUITES)('$id: lodash and native return the same thing', (suite) => {
    const input = suite.prepare ? suite.prepare(users) : users;
    expect(suite.native(input)).toEqual(suite.lodash(input));
  });

  it('runSuite reports a winner using an injected clock', () => {
    let t = 0;
    const result = runSuite(SUITES[0], users, { iterations: 3, warmup: 0, now: () => (t += 1) });
    expect(result.winner).toBe('tie');
    expect(result.lodashMs).toBe(1);
  });

  it('skips deep-copy suites on huge data', () => {
    expect(suitesFor(100000).some((s) => s.id === 'cloneDeep')).toBe(false);
    expect(suitesFor(10000).some((s) => s.id === 'cloneDeep')).toBe(true);
  });
});
