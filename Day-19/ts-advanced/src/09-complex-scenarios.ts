/**
 * 09. Complex scenarios: problems where several advanced features combine.
 */

// ---- 1. A type-safe event emitter: the event MAP decides every method's types ----

export class Emitter<Events extends object> {
  // one list of listeners per event name; a mapped type ties each name to listeners of the right payload
  private listeners: { [K in keyof Events]?: Array<(payload: Events[K]) => void> } = {};

  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): () => void {
    const list = this.listeners[event] ?? [];
    list.push(listener);
    this.listeners[event] = list;
    return () => {
      this.listeners[event] = (this.listeners[event] ?? []).filter((l) => l !== listener);
    };
  }

  /** Events whose payload is `void` can be emitted with no argument: a rest tuple decides */
  emit<K extends keyof Events>(event: K, ...args: Events[K] extends void ? [] : [payload: Events[K]]): void {
    for (const listener of this.listeners[event] ?? []) listener(args[0] as Events[K]);
  }
}

// ---- 2. A fluent builder that ACCUMULATES types ----
// Each `.set()` returns a builder whose type remembers the new key, so `build()` is only callable when the required keys are in.

export class RequestBuilder<Fields extends object = object> {
  private constructor(private readonly fields: Fields) {}
  static create(): RequestBuilder {
    return new RequestBuilder({});
  }
  set<K extends string, V>(key: K, value: V): RequestBuilder<Fields & Record<K, V>> {
    return new RequestBuilder({ ...this.fields, [key]: value } as Fields & Record<K, V>);
  }
  /** `this:` parameter: build() exists only on builders that already have url and method */
  build<F extends { url: string; method: 'GET' | 'POST' }>(this: RequestBuilder<F>): F {
    return this.fields;
  }
}

// ---- 3. Path types: get(obj, 'a.b.c') ----

/** Every dotted path through an object type: 'a' | 'a.b' | 'a.b.c' | ... (stops at primitives and arrays) */
export type Paths<T> = T extends object
  ? T extends readonly unknown[]
    ? never
    : { [K in keyof T & string]: K | `${K}.${Paths<T[K]>}` }[keyof T & string]
  : never;

/** The type found at a path: split on the first dot and recurse */
export type PathValue<T, P extends string> = P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? PathValue<T[Head], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function getPath<T extends object, P extends Paths<T>>(obj: T, path: P): PathValue<T, P> {
  let current: unknown = obj;
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined as PathValue<T, P>;
    current = (current as Record<string, unknown>)[key];
  }
  return current as PathValue<T, P>; // the walk above matches the type-level walk, which the compiler can not verify
}

// ---- 4. A typed state machine: only legal transitions compile ----

export type TrafficLight = 'green' | 'yellow' | 'red';
export interface Transitions {
  green: 'yellow';
  yellow: 'red';
  red: 'green';
}

export class Machine<S extends TrafficLight> {
  constructor(readonly state: S) {}
  /** `Transitions[S]` is the ONE state reachable from S */
  next(): Machine<Transitions[S]> {
    const order: Record<TrafficLight, TrafficLight> = { green: 'yellow', yellow: 'red', red: 'green' };
    return new Machine(order[this.state] as Transitions[S]);
  }
}

/** A table of allowed moves, checked with `satisfies`, and the legal targets derived from it */
export const DOOR = {
  open: ['closed'],
  closed: ['open', 'locked'],
  locked: ['closed'],
} as const satisfies Record<string, readonly string[]>;
export type DoorState = keyof typeof DOOR;
export type DoorMove<From extends DoorState> = (typeof DOOR)[From][number];

export function moveDoor<From extends DoorState, To extends DoorMove<From>>(_from: From, to: To): To {
  return to;
}

// ---- 5. Overloads vs generics ----

/** Overloads: DIFFERENT result types for different input types, when no single generic expresses it */
export function parseId(value: string): number;
export function parseId(value: number): string;
export function parseId(value: string | number): number | string {
  return typeof value === 'string' ? Number.parseInt(value, 10) : String(value);
}

/** A generic is better when the output is "the same T as the input": one signature, no cases to list */
export function firstOr<T, D>(items: readonly T[], fallback: D): T | D {
  return items.length > 0 ? (items[0] as T) : fallback;
}

// ---- 6. Variadic tuples ----

/** Concatenate two tuples at the type level */
export function concat<A extends readonly unknown[], B extends readonly unknown[]>(a: readonly [...A], b: readonly [...B]): [...A, ...B] {
  return [...a, ...b];
}

/** Prepend an element and keep every position's type */
export function prepend<H, T extends readonly unknown[]>(head: H, tail: readonly [...T]): [H, ...T] {
  return [head, ...tail];
}

/** Partial application with tuples: fix the first arguments of ANY function, the rest keep their types */
export function partial<Fixed extends unknown[], Rest extends unknown[], R>(fn: (...args: [...Fixed, ...Rest]) => R, ...fixed: Fixed): (...rest: Rest) => R {
  return (...rest) => fn(...fixed, ...rest);
}
