import { describe, expect, expectTypeOf, it } from 'vitest';
import { assertNever, fail, isNamed, nameFromJson, parseJson, perimeter } from '../src/03-any-unknown-never';

describe('03 any, unknown, never', () => {
  it('parses unknown data safely', () => {
    expect(nameFromJson('{"name":"Ann"}')).toBe('Ann');
    expect(nameFromJson('{"nom":"Ann"}')).toBe('unknown');
    expect(nameFromJson('42')).toBe('unknown');
    expect(nameFromJson('null')).toBe('unknown');
    expectTypeOf(parseJson).returns.toBeUnknown();
  });

  it('isNamed is a type guard', () => {
    const value: unknown = { name: 'Bob' };
    if (isNamed(value)) expectTypeOf(value).toEqualTypeOf<{ name: string }>();
    expect(isNamed({ name: 1 })).toBe(false);
  });

  it('handles every shape', () => {
    expect(perimeter({ kind: 'rect', width: 1, height: 2 })).toBe(6);
    expect(perimeter({ kind: 'circle', radius: 1 })).toBeCloseTo(2 * Math.PI);
  });

  it('never: assertNever and fail do not return', () => {
    expectTypeOf(fail).returns.toBeNever();
    expect(() => fail('boom')).toThrow('boom');
    // @ts-expect-error  at run time we can still force a bad value in, but the type says it can't exist
    expect(() => assertNever({ kind: 'triangle' })).toThrow('Unhandled case');
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    const data = parseJson('{"a":1}');
    // @ts-expect-error  unknown can not be used until it is checked (with `any` this would compile and maybe crash)
    const a = data.a;
    // @ts-expect-error  nothing is assignable to never, so a forgotten case is caught
    const n: never = 'x';
    // @ts-expect-error  unknown can not be assigned to a string without a check
    const s: string = data;
    expect([a, n, s]).toHaveLength(3);
  });
});
