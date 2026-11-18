/** 06. Generics: one piece of code that works for many types, without losing track of which. */

// A generic function: T is decided by the caller's argument
export function identity<T>(value: T): T {
  return value;
}

export function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

// A generic interface
export interface Box<T> {
  value: T;
  map<U>(fn: (value: T) => U): Box<U>;
}
export function box<T>(value: T): Box<T> {
  return { value, map: (fn) => box(fn(value)) };
}

// A constraint: T may be anything that has a numeric `length`
export function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

// `keyof`: K must be a real key of T, and the result type follows it
export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

// The use you will meet most in React work: a typed response. The caller says what it expects (T);
// the function can only promise the shape, because JSON from a server is never checked by TypeScript.
export async function fetchJson<T>(url: string, fetcher: typeof fetch = fetch): Promise<T> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}

/*
 * When NOT to use a generic: if a type parameter appears only once, it adds nothing.
 *   function print<T>(value: T): void      // T is used once: just write `value: unknown`
 *   function wrap<T>(value: T): T[]        // T links input and output: a real generic
 * Rule of thumb: a generic earns its place when it connects two or more positions.
 */
export function print(value: unknown): string {
  return String(value);
}
