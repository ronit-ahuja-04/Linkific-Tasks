import { describe, expect, expectTypeOf, it } from 'vitest';
import { box, fetchJson, first, identity, longest, pluck, print } from '../src/06-generics';

interface Todo {
  id: number;
  title: string;
}
const todos: Todo[] = [{ id: 1, title: 'a' }, { id: 2, title: 'b' }];

describe('06 generics', () => {
  it('keeps track of the type that went in', () => {
    expect(identity('x')).toBe('x');
    expectTypeOf(identity('x')).toEqualTypeOf<string>();
    expectTypeOf(identity(5)).toEqualTypeOf<number>();
    expect(first(todos)?.title).toBe('a');
    expectTypeOf(first(todos)).toEqualTypeOf<Todo | undefined>();
    expect(print(3)).toBe('3');
  });

  it('maps through a generic Box', () => {
    const b = box(2).map((n) => n * 10).map((n) => `${n}!`);
    expect(b.value).toBe('20!');
    expectTypeOf(b.value).toEqualTypeOf<string>();
  });

  it('constrains and links types', () => {
    expect(longest('ab', 'abc')).toBe('abc');
    expect(longest([1], [1, 2])).toEqual([1, 2]);
    expect(pluck(todos, 'title')).toEqual(['a', 'b']);
    expectTypeOf(pluck(todos, 'id')).toEqualTypeOf<number[]>();
    expectTypeOf(pluck(todos, 'title')).toEqualTypeOf<string[]>();
  });

  it('types a response', async () => {
    const fake = (async () => ({ ok: true, status: 200, json: async () => todos })) as unknown as typeof fetch;
    const result = await fetchJson<Todo[]>('/todos', fake);
    expectTypeOf(result).toEqualTypeOf<Todo[]>();
    expect(result[0]?.title).toBe('a');
    const broken = (async () => ({ ok: false, status: 500, json: async () => ({}) })) as unknown as typeof fetch;
    await expect(fetchJson('/x', broken)).rejects.toThrow('Request failed: 500');
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    // @ts-expect-error  a number has no `length`, so it does not satisfy the constraint
    longest(1, 2);
    // @ts-expect-error  'name' is not a key of Todo
    pluck(todos, 'name');
    // @ts-expect-error  `identity` returned a string, so it can not be used as a number
    const n: number = identity('x');
    // @ts-expect-error  the Box holds a number, so map's callback gets a number, and a number has no toUpperCase
    const shout = () => box(1).map((v) => v.toUpperCase());
    expect([n, shout]).toHaveLength(2);
  });
});
