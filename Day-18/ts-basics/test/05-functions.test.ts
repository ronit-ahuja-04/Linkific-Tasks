import { describe, expect, expectTypeOf, it } from 'vitest';
import { add, asEuros, asPercent, formatAll, isEven, label, log, repeat, sum, toArray, type Formatter } from '../src/05-functions';

describe('05 functions', () => {
  it('handles optional, default and rest parameters', () => {
    expect(add(1, 2)).toBe(3);
    expect(label('Tasks')).toBe('Tasks');
    expect(label('Tasks', 'done')).toBe('Tasks done');
    expect(repeat('ab')).toBe('abab');
    expect(repeat('ab', 3)).toBe('ababab');
    expect(sum()).toBe(0);
    expect(sum(1, 2, 3)).toBe(6);
  });

  it('types function values', () => {
    expect(formatAll([1.5, 2], asEuros)).toEqual(['€1.50', '€2.00']);
    expect(formatAll([0.256], asPercent)).toEqual(['26%']);
    expectTypeOf(asEuros).toEqualTypeOf<Formatter>();
    expectTypeOf(isEven).toEqualTypeOf<(n: number) => boolean>();
  });

  it('uses void callbacks and overloads', () => {
    const lines: string[] = [];
    log('hello', (line) => lines.push(line));
    expect(lines).toEqual(['[log] hello']);
    expect(toArray('a')).toEqual(['a']);
    expect(toArray(1)).toEqual([1]);
    expectTypeOf(toArray('a')).toEqualTypeOf<string[]>();
    expectTypeOf(toArray(1)).toEqualTypeOf<number[]>();
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    // @ts-expect-error  a string where a number is expected
    add('1', 2);
    // @ts-expect-error  too few arguments
    add(1);
    // @ts-expect-error  too many arguments
    add(1, 2, 3);
    // @ts-expect-error  the Formatter must return a string, not a number
    const bad: Formatter = (value) => value * 2;
    // @ts-expect-error  there is no overload for a boolean
    toArray(true);
    expect(bad).toBeTypeOf('function');
  });
});
