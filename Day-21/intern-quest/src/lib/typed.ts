/**
 * Build an object with one key per name: `record(['a', 'b'], () => 0)` is `{ a: number; b: number }`.
 * `Object.fromEntries` only promises `{ [key: string]: V }`; here we know the keys are exactly `names`.
 * This is the one place the game code needs a type assertion, so it is small and named.
 */
export function record<K extends string, V>(names: readonly K[], valueOf: (name: K) => V): Record<K, V> {
  return Object.fromEntries(names.map((name) => [name, valueOf(name)])) as Record<K, V>;
}

/** `Object.entries` typed for a partial record whose keys are known */
export function entries<K extends string, V>(value: Partial<Record<K, V>>): [K, V][] {
  return Object.entries(value) as [K, V][];
}
