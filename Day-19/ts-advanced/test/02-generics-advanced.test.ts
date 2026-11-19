import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  buildPath, get, longest, makeGetters, merge, pickKeys,
  type Box, type ElementOf, type EventName, type FirstArg, type Getters, type Handlers, type Head, type IsString, type KeysOfType, type Last,
  type MyParameters, type MyReturnType, type Nullable, type OnlyStrings, type Position, type RouteParams, type Shouting, type StripPrefix,
  type ToArray, type ToArrayNonDist, type Unwrap, type WithoutFunctions,
} from '../src/02-generics-advanced';

describe('02 constraints', () => {
  it('extends { length }', () => {
    expect(longest('ab', 'abc')).toBe('abc');
    expect(longest([1], [1, 2])).toEqual([1, 2]);
    // @ts-expect-error  a number has no length
    longest(1, 2);
  });
  it('K extends keyof T', () => {
    const user = { id: 1, name: 'Ann' };
    expect(get(user, 'name')).toBe('Ann');
    expectTypeOf(get(user, 'id')).toBeNumber();
    // @ts-expect-error  'age' is not a key of user
    get(user, 'age');
    expect(pickKeys(user, ['id'])).toEqual({ id: 1 });
    expectTypeOf(pickKeys(user, ['id'])).toEqualTypeOf<{ id: number }>();
  });
  it('merge returns the intersection; defaults on type parameters', () => {
    const m = merge({ a: 1 }, { b: 'x' });
    expectTypeOf(m).toEqualTypeOf<{ a: number } & { b: string }>();
    expect(m).toEqual({ a: 1, b: 'x' });
    expectTypeOf<Box>().toEqualTypeOf<{ value: string }>();
  });
});

describe('02 conditional types', () => {
  it('basics and distribution', () => {
    expectTypeOf<IsString<'a'>>().toEqualTypeOf<true>();
    expectTypeOf<IsString<1>>().toEqualTypeOf<false>();
    expectTypeOf<ToArray<string | number>>().toEqualTypeOf<string[] | number[]>();
    expectTypeOf<ToArrayNonDist<string | number>>().toEqualTypeOf<(string | number)[]>();
    expectTypeOf<OnlyStrings<'a' | 1 | 'b' | null>>().toEqualTypeOf<'a' | 'b'>();
  });
  it('KeysOfType', () => {
    interface Row { id: number; name: string; age: number; ok: boolean }
    expectTypeOf<KeysOfType<Row, number>>().toEqualTypeOf<'id' | 'age'>();
  });
});

describe('02 mapped types', () => {
  it('Nullable', () => {
    expectTypeOf<Nullable<{ a: number }>>().toEqualTypeOf<{ a: number | null }>();
  });
  it('Getters with key remapping', () => {
    const g = makeGetters({ name: 'Ann', age: 30 });
    expect(g.getName()).toBe('Ann');
    expect(g.getAge()).toBe(30);
    expectTypeOf(g).toEqualTypeOf<Getters<{ name: string; age: number }>>();
    expectTypeOf(g.getAge).returns.toBeNumber();
    // @ts-expect-error  there is no getEmail: the keys come from the object
    expect(() => g.getEmail()).toThrow();
  });
  it('filtering keys with as never', () => {
    interface Thing { id: number; run: () => void }
    expectTypeOf<WithoutFunctions<Thing>>().toEqualTypeOf<{ id: number }>();
  });
});

describe('02 template literal types', () => {
  it('names and unions', () => {
    expectTypeOf<EventName<'click'>>().toEqualTypeOf<'onClick'>();
    expectTypeOf<Shouting<'ab'>>().toEqualTypeOf<'AB'>();
    expectTypeOf<Position>().toEqualTypeOf<'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'>();
    const h: Handlers<{ open: boolean }> = { onOpen: (v) => expectTypeOf(v).toBeBoolean() };
    h.onOpen(true);
    // @ts-expect-error  'open' is not a handler name: it is 'onOpen'
    const wrong: Handlers<{ open: boolean }> = { open: () => {} };
    expect(wrong).toBeDefined();
  });
  it('route params are inferred from the path', () => {
    expectTypeOf<RouteParams<'/users/:id/posts/:postId'>>().toEqualTypeOf<'id' | 'postId'>();
    expect(buildPath('/users/:id/posts/:postId', { id: '7', postId: '9' })).toBe('/users/7/posts/9');
    // @ts-expect-error  postId is missing
    buildPath('/users/:id/posts/:postId', { id: '7' });
  });
});

describe('02 infer', () => {
  it('re-implemented ReturnType / Parameters / FirstArg', () => {
    const fn = (a: string, b: number): boolean => a.length > b;
    expectTypeOf<MyReturnType<typeof fn>>().toEqualTypeOf<boolean>();
    expectTypeOf<MyParameters<typeof fn>>().toEqualTypeOf<[a: string, b: number]>();
    expectTypeOf<FirstArg<typeof fn>>().toEqualTypeOf<string>();
    expect(fn('abc', 2)).toBe(true);
  });
  it('unwrap and element', () => {
    expectTypeOf<Unwrap<Promise<number>>>().toEqualTypeOf<number>();
    expectTypeOf<Unwrap<string>>().toEqualTypeOf<string>();
    expectTypeOf<ElementOf<string[]>>().toEqualTypeOf<string>();
    expectTypeOf<Head<[1, 2, 3]>>().toEqualTypeOf<1>();
    expectTypeOf<Last<[1, 2, 3]>>().toEqualTypeOf<3>();
    expectTypeOf<StripPrefix<'getName', 'get'>>().toEqualTypeOf<'Name'>();
  });
});
