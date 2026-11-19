/**
 * Typed versions of two things TypeScript cannot express on its own.
 * Each is the ONLY place in the app that needs a type assertion, so the unsafe spot is small and named.
 */

/**
 * Build an object with one key per name: `record(['a', 'b'], () => 0)` is `{ a: number; b: number }`.
 * `Object.fromEntries` only promises `{ [key: string]: V }`; here we know the keys are exactly `names`.
 */
export function record<K extends string, V>(names: readonly K[], valueOf: (name: K) => V): Record<K, V> {
  return Object.fromEntries(names.map((name) => [name, valueOf(name)])) as Record<K, V>;
}
