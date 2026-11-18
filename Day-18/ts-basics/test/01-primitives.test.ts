import { describe, expect, expectTypeOf, it } from 'vitest';
import { distance, first, origin, parseNumber, scores, weekdays, type Point } from '../src/01-primitives-arrays-tuples';

describe('01 primitives, arrays, tuples', () => {
  it('computes with tuples', () => {
    expect(distance(origin, [3, 4])).toBe(5);
    expectTypeOf(origin).toEqualTypeOf<Point>();
    expectTypeOf<Point>().toEqualTypeOf<[x: number, y: number]>();
  });

  it('reports a possibly missing array element in the type', () => {
    expect(first(scores)).toBe(90);
    expect(first([])).toBeUndefined();
    expectTypeOf(first).returns.toEqualTypeOf<number | undefined>();
  });

  it('returns a tuple', () => {
    expect(parseNumber('12')).toEqual([true, 12]);
    expect(parseNumber('x')[0]).toBe(false);
    expectTypeOf(parseNumber).returns.toEqualTypeOf<[ok: boolean, value: number]>();
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    // @ts-expect-error  assigning a string to a number
    const count: number = 'three';
    // @ts-expect-error  a readonly array has no push
    weekdays.push('Sat');
    // @ts-expect-error  a tuple has a fixed length: this one is too long
    const bad: Point = [1, 2, 3];
    // @ts-expect-error  wrong type for a tuple position
    const bad2: Point = ['a', 2];
    // @ts-expect-error  a number is not a string
    const text: string = scores[0];
    expect([count, bad, bad2, text]).toHaveLength(4);
  });
});
