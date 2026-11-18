import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  greet, unwrap, type Comparator, type Employee, type Person, type Result, type Settings,
} from '../src/04-interfaces';

describe('04 interfaces', () => {
  it('uses optional properties', () => {
    expect(greet({ id: 1, name: 'Robert' })).toBe('Hi Robert');
    expect(greet({ id: 1, name: 'Robert', nickname: 'Bob' })).toBe('Hi Bob');
  });

  it('an Employee is a Person, so it can be passed where a Person is expected', () => {
    const ann: Employee = { id: 1, name: 'Ann', role: 'engineer' };
    expect(greet(ann)).toBe('Hi Ann');
    expectTypeOf<Employee>().toExtend<Person>();
  });

  it('merges two Settings declarations into one', () => {
    const settings: Settings = { theme: 'dark', compact: true };
    expect(settings.compact).toBe(true);
    expectTypeOf<Settings>().toEqualTypeOf<{ theme: 'light' | 'dark'; compact: boolean }>();
  });

  it('describes functions and results', () => {
    const byLength: Comparator<string> = (a, b) => a.length - b.length;
    expect(['ccc', 'a', 'bb'].sort(byLength)).toEqual(['a', 'bb', 'ccc']);
    const ok: Result<number> = { ok: true, value: 3 };
    const err: Result<number> = { ok: false, error: 'nope' };
    expect(unwrap(ok, 0)).toBe(3);
    expect(unwrap(err, 0)).toBe(0);
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    const person: Person = { id: 1, name: 'Ann' };
    // @ts-expect-error  `id` is readonly
    person.id = 2;
    // @ts-expect-error  an Employee needs a role
    const e: Employee = { id: 1, name: 'Ann' };
    // @ts-expect-error  'intern' is not one of the roles
    const e2: Employee = { id: 1, name: 'Ann', role: 'intern' };
    // @ts-expect-error  after checking `ok`, a failed result has no `value`
    const bad = (r: Result<number>) => (r.ok ? r.error : r.value);
    expect([e, e2, bad]).toHaveLength(3);
  });
});
