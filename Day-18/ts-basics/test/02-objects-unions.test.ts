import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  area, contactLine, describeId, statusLabel, type Id, type Shape, type Status, type User,
} from '../src/02-objects-unions-literals';

describe('02 objects, unions, literals', () => {
  it('narrows a union', () => {
    expect(describeId(7)).toBe('#7');
    expect(describeId('ab')).toBe('AB');
    expectTypeOf<Id>().toEqualTypeOf<string | number>();
  });

  it('treats an optional property as possibly missing', () => {
    expect(contactLine({ id: 1, name: 'Ann' })).toBe('Ann');
    expect(contactLine({ id: 1, name: 'Ann', email: 'a@x.com' })).toBe('Ann <a@x.com>');
    expectTypeOf<User['email']>().toEqualTypeOf<string | undefined>();
  });

  it('covers every literal', () => {
    const all: Status[] = ['idle', 'loading', 'done', 'failed'];
    expect(all.map(statusLabel)).toEqual(['Not started', 'Loading...', 'Finished', 'Something went wrong']);
    expectTypeOf(statusLabel).parameter(0).toEqualTypeOf<Status>();
  });

  it('computes areas of a discriminated union', () => {
    expect(area({ kind: 'rect', width: 2, height: 3 })).toBe(6);
    expect(area({ kind: 'circle', radius: 1 })).toBeCloseTo(Math.PI);
  });

  it('the compiler rejects these mistakes (each line below must fail to compile)', () => {
    // @ts-expect-error  'pending' is not one of the four allowed statuses
    const status: Status = 'pending';
    // @ts-expect-error  a required property is missing
    const user: User = { id: 1 };
    // @ts-expect-error  an unknown property (a typo for `email`)
    const typo: User = { id: 1, name: 'Ann', emial: 'a@x.com' };
    // @ts-expect-error  a circle has a radius, not a width
    const shape: Shape = { kind: 'circle', width: 3 };
    // @ts-expect-error  `id` could be a number: toUpperCase only exists on strings
    const shout = (id: Id) => id.toUpperCase();
    expect([status, user, typo, shape, shout]).toHaveLength(5);
  });
});
