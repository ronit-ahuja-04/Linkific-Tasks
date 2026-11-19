import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  DOOR, Emitter, Machine, RequestBuilder, concat, firstOr, getPath, moveDoor, parseId, partial, prepend,
  type DoorMove, type Paths, type PathValue,
} from '../src/09-complex-scenarios';

interface Events {
  login: { user: string };
  tick: void;
  count: number;
}

describe('09 event emitter', () => {
  it('payload types follow the event name', () => {
    const bus = new Emitter<Events>();
    const seen: string[] = [];
    const off = bus.on('login', (p) => { expectTypeOf(p).toEqualTypeOf<{ user: string }>(); seen.push(p.user); });
    bus.on('count', (n) => seen.push(String(n * 2)));
    bus.on('tick', () => seen.push('tick'));
    bus.emit('login', { user: 'ann' });
    bus.emit('count', 21);
    bus.emit('tick');
    off();
    bus.emit('login', { user: 'bo' });
    expect(seen).toEqual(['ann', '42', 'tick']);
  });
  it('wrong events and payloads do not compile', () => {
    const bus = new Emitter<Events>();
    // @ts-expect-error  'logout' is not an event
    bus.on('logout', () => {});
    // @ts-expect-error  count carries a number
    bus.emit('count', 'x');
    // @ts-expect-error  login needs its payload
    bus.emit('login');
    // @ts-expect-error  the listener receives a number, not a string
    bus.on('count', (n: string) => n);
  });
});

describe('09 builder', () => {
  it('build() exists only once the required keys were set', () => {
    const req = RequestBuilder.create().set('url', '/x').set('method', 'GET' as const).set('retries', 3).build();
    expect(req).toEqual({ url: '/x', method: 'GET', retries: 3 });
    expectTypeOf(req.retries).toBeNumber();
    // @ts-expect-error  `method` was never set
    RequestBuilder.create().set('url', '/x').build();
  });
});

describe('09 path types', () => {
  const config = { db: { host: 'h', port: 5432, opts: { ssl: true } }, name: 'app', tags: ['a'] };
  it('Paths lists every dotted path', () => {
    expectTypeOf<Paths<typeof config>>().toEqualTypeOf<'db' | 'db.host' | 'db.port' | 'db.opts' | 'db.opts.ssl' | 'name' | 'tags'>();
    expectTypeOf<PathValue<typeof config, 'db.opts.ssl'>>().toEqualTypeOf<boolean>();
  });
  it('getPath returns the type at the path', () => {
    expect(getPath(config, 'db.port')).toBe(5432);
    expectTypeOf(getPath(config, 'db.port')).toBeNumber();
    expectTypeOf(getPath(config, 'db.opts')).toEqualTypeOf<{ ssl: boolean }>();
    expect(getPath(config, 'db.opts.ssl')).toBe(true);
    // @ts-expect-error  there is no `db.user`: autocomplete offers only real paths
    getPath(config, 'db.user');
  });
});

describe('09 state machine', () => {
  it('next() moves along the only legal transition', () => {
    const green = new Machine('green');
    const yellow = green.next();
    expectTypeOf(yellow).toEqualTypeOf<Machine<'yellow'>>();
    expect(yellow.state).toBe('yellow');
    expect(yellow.next().next().state).toBe('green');
    expectTypeOf(yellow.state).toEqualTypeOf<'yellow'>();
    // @ts-expect-error  after green comes yellow, never red
    const wrong: Machine<'red'> = green.next();
    expect(wrong).toBeDefined();
  });
  it('a transition table drives the legal moves', () => {
    expect(moveDoor('closed', 'locked')).toBe('locked');
    expectTypeOf<DoorMove<'closed'>>().toEqualTypeOf<'open' | 'locked'>();
    // @ts-expect-error  an open door cannot be locked directly
    moveDoor('open', 'locked');
    expect(Object.keys(DOOR)).toEqual(['open', 'closed', 'locked']);
  });
});

describe('09 overloads vs generics', () => {
  it('overloads pick the result type from the input type', () => {
    expect(parseId('42')).toBe(42);
    expect(parseId(42)).toBe('42');
    expectTypeOf(parseId('1')).toBeNumber();
    expectTypeOf(parseId(1)).toBeString();
    // @ts-expect-error  no overload takes a boolean
    parseId(true);
  });
  it('a generic keeps the element type', () => {
    expect(firstOr([1, 2], 0)).toBe(1);
    expect(firstOr([] as string[], null)).toBeNull();
    expectTypeOf(firstOr(['a'], null)).toEqualTypeOf<string | null>();
  });
});

describe('09 variadic tuples', () => {
  it('concat and prepend keep every position', () => {
    const joined = concat([1, 'a'] as const, [true] as const);
    expect(joined).toEqual([1, 'a', true]);
    expectTypeOf(joined).toEqualTypeOf<[1, 'a', true]>();
    const withHead = prepend('x', [1, 2] as const);
    expectTypeOf(withHead).toEqualTypeOf<[string, 1, 2]>();
    expect(withHead).toEqual(['x', 1, 2]);
  });
  it('partial fixes the leading arguments', () => {
    const add3 = (a: number, b: string, c: boolean): string => `${a}${b}${c}`;
    const fixed = partial(add3, 1, 'x');
    expect(fixed(true)).toBe('1xtrue');
    expectTypeOf(fixed).toEqualTypeOf<(c: boolean) => string>();
    // @ts-expect-error  the remaining parameter is a boolean
    fixed('no');
  });
});
