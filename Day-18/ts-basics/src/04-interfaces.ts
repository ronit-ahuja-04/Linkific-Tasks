/** 04. Interfaces: optional and readonly properties, extending, and interface vs type. */

export interface Person {
  readonly id: number; // can be set once, never reassigned
  name: string;
  nickname?: string; // optional
}

// An interface can extend another
export interface Employee extends Person {
  role: 'engineer' | 'designer' | 'manager';
  manager?: Employee;
}

export function greet(person: Person): string {
  return `Hi ${person.nickname ?? person.name}`;
}

// An interface can describe a function and an object with unknown keys
export interface Comparator<T> {
  (a: T, b: T): number;
}
export interface Dictionary<T> {
  [key: string]: T | undefined;
}

// Declaration merging: two interfaces with the same name become ONE.
// (This is how libraries let you add fields to their types. A `type` alias cannot do this.)
export interface Settings {
  theme: 'light' | 'dark';
}
export interface Settings {
  compact: boolean;
}

// A `type` alias can name things an interface cannot: unions, tuples, primitives
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type Pair = [string, number];

/*
 * Interface or type? A simple rule that works:
 *   - object shapes that other code will extend or implement: interface
 *   - unions, tuples, function types, utility-type results, anything else: type
 * Both can describe an object, and for plain objects either is fine. Pick one and stay consistent.
 */

export function unwrap<T>(result: Result<T>, fallback: T): T {
  return result.ok ? result.value : fallback;
}
