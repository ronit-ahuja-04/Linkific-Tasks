import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  COLORS, SIDES, area, assertDefined, assertNever, assertString, isNumber, isRecord, isString, keep, lengthOfAny, loadUser, matches, message,
  parseSafely, paymentLabel, shout, shoutSafe, speak, toOrderId, toUserId, userSchema, validate,
  type Cat, type Dog, type Infer, type Payment, type Pet, type Shape,
} from '../src/08-guards-unions';

describe('08 any vs unknown', () => {
  it('any lets a bad call through; unknown does not', () => {
    expect(() => shout(42)).toThrow(); // compiles, crashes: that is the problem with any
    expect(shoutSafe(42)).toBe('42');
    expect(shoutSafe('a')).toBe('A');
    expect(lengthOfAny({ payload: { name: 'x' } })).toBe('x'); // typed number, really a string
  });
  it('unknown must be narrowed first', () => {
    const data = parseSafely('{"a":1}');
    expectTypeOf(data).toBeUnknown();
    // @ts-expect-error  `data` is unknown: reading a property needs a check first
    expect(() => data.a).not.toThrow();
    const n: unknown = 5;
    // @ts-expect-error  unknown is not assignable to number without a check
    const m: number = n;
    expect(m).toBe(5);
    if (isRecord(data)) expect(data['a']).toBe(1);
  });
});

describe('08 guards and narrowing', () => {
  it('user-defined guards narrow', () => {
    const values: unknown[] = [1, 'a', NaN, null, 'b'];
    expect(keep(values, isString)).toEqual(['a', 'b']);
    expectTypeOf(keep(values, isString)).toEqualTypeOf<string[]>();
    expect(keep(values, isNumber)).toEqual([1]);
    const x: unknown = 'hi';
    // @ts-expect-error  before the guard, x is unknown and has no length
    void x.length;
    if (isString(x)) expectTypeOf(x).toBeString();
  });
  it('in and instanceof narrow', () => {
    const cat: Cat = { kind: 'cat', meow: () => 'meow' };
    const dog: Dog = { kind: 'dog', bark: () => 'woof' };
    const pets: Pet[] = [cat, dog];
    expect(pets.map(speak)).toEqual(['meow', 'woof']);
    expect(message(new Error('e'))).toBe('e');
    expect(message('s')).toBe('s');
    expect(message(5)).toBe('unknown error');
  });
  it('assertion functions narrow after they return', () => {
    const v: unknown = 'abc';
    assertString(v);
    expectTypeOf(v).toBeString();
    expect(v.length).toBe(3);
    expect(() => assertString(5, 'age')).toThrow('age must be a string');
    const maybe: string | undefined = 'x' as string | undefined;
    assertDefined(maybe);
    expectTypeOf(maybe).toBeString();
    expect(() => assertDefined(null, 'user')).toThrow('user is missing');
  });
});

describe('08 discriminated unions', () => {
  it('area is exhaustive', () => {
    expect(area({ kind: 'rect', width: 2, height: 3 })).toBe(6);
    expect(area({ kind: 'triangle', base: 4, height: 3 })).toBe(6);
    expect(area({ kind: 'circle', radius: 1 })).toBeCloseTo(Math.PI);
    // @ts-expect-error  a hexagon is not a Shape (this is what assertNever guards at run time)
    expect(() => assertNever({ kind: 'hexagon' })).toThrow('Unhandled case');
  });
  it('mixing fields from different members is an error', () => {
    // @ts-expect-error  a circle has `radius`, not `width`
    const bad: Shape = { kind: 'circle', width: 3 };
    expect(bad).toBeDefined();
    const s = { kind: 'rect', width: 1, height: 2 } as Shape;
    // @ts-expect-error  `radius` only exists after narrowing to circle
    void s.radius;
  });
  it('payment states carry only their own data', () => {
    expect(paymentLabel({ status: 'idle' })).toBe('Not started');
    expect(paymentLabel({ status: 'paid', receiptId: 'r1', amount: 9 })).toBe('Paid 9 (receipt r1)');
    expect(paymentLabel({ status: 'failed', reason: 'card', retryable: true })).toBe('Failed: card. Try again.');
    expect(paymentLabel({ status: 'processing', startedAt: 5 })).toBe('Processing since 5');
    // @ts-expect-error  'paid' without a receipt is an impossible state, and the compiler refuses to build it
    const bad: Payment = { status: 'paid', amount: 5 };
    expect(bad).toBeDefined();
  });
  it('satisfies keeps precise keys; Record<union> forces every key', () => {
    expect(COLORS.red).toBe('#f00');
    // @ts-expect-error  `purple` is not a key: with `: Record<string, string>` this would compile
    expect(COLORS.purple).toBeUndefined();
    expect(SIDES.rect).toBe(4);
    expectTypeOf<keyof typeof SIDES>().toEqualTypeOf<Shape['kind']>();
  });
});

describe('08 branded types', () => {
  it('a UserId is a string, but a plain string or an OrderId is not a UserId', () => {
    const uid = toUserId('u_1');
    const oid = toOrderId('o_1');
    expect(loadUser(uid)).toBe('user:u_1');
    const asString: string = uid; // a brand is still a string, going the other way
    expect(asString).toBe('u_1');
    // @ts-expect-error  a raw string has not been checked
    loadUser('u_1');
    // @ts-expect-error  an OrderId must not be used where a UserId is wanted
    loadUser(oid);
    expect(() => toUserId('nope')).toThrow('not a user id');
  });
});

describe('08 a validator derived from a schema', () => {
  it('Infer builds the type, validate checks the data', () => {
    expectTypeOf<Infer<typeof userSchema>>().toEqualTypeOf<{ id: number; name: string; tags: string[] }>();
    const user = validate(userSchema, { id: 1, name: 'Ann', tags: ['a'] });
    expect(user.name).toBe('Ann');
    expectTypeOf(user.tags).toEqualTypeOf<string[]>();
    expect(() => validate(userSchema, { id: '1', name: 'Ann', tags: [] })).toThrow('does not match');
    expect(matches({ type: 'array', items: { type: 'number' } }, [1, 2])).toBe(true);
    expect(matches({ type: 'array', items: { type: 'number' } }, [1, 'x'])).toBe(false);
    // @ts-expect-error  the inferred type has no `email`
    void user.email;
  });
});
