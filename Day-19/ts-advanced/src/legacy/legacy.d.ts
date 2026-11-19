/**
 * Hand-written types for legacy.js. A `.d.ts` file contains ONLY declarations: no function bodies, no values.
 * TypeScript pairs it with legacy.js because they share a name. Everything below describes what the JS really does.
 */

/** Overloads: the JS accepts an optional currency, but only these two make sense */
export function formatPrice(amount: number): string;
export function formatPrice(amount: number, currency: 'USD' | 'EUR'): string;

export function parseQuery(query: string): Record<string, string>;

export class Counter {
  constructor(start?: number);
  /** the current value (set in the constructor) */
  count: number;
  /** adds `by` (default 1) and returns the new count */
  inc(by?: number): number;
}

declare function greet(name?: string): string;
export default greet;
