/** 05. Functions: parameter types, return types, optional and default parameters, function types. */

// Parameter types and a return type
export function add(a: number, b: number): number {
  return a + b;
}

// Optional parameter: `suffix` is `string | undefined` inside the function
export function label(text: string, suffix?: string): string {
  return suffix ? `${text} ${suffix}` : text;
}

// Default parameter: the type is inferred from the default, and callers may leave it out
export function repeat(text: string, times = 2): string {
  return text.repeat(times);
}

// Rest parameters are an array
export function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

// A function type expression: describes any function with this shape
export type Formatter = (value: number) => string;

export const asEuros: Formatter = (value) => `€${value.toFixed(2)}`; // `value` is typed by Formatter
export const asPercent: Formatter = (value) => `${Math.round(value * 100)}%`;

// A function that takes a function: the callback's type is part of the contract
export function formatAll(values: readonly number[], format: Formatter): string[] {
  return values.map(format);
}

// A typed arrow function
export const isEven = (n: number): boolean => n % 2 === 0;

// `void` means "the return value is not used"
export function log(message: string, sink: (line: string) => void): void {
  sink(`[log] ${message}`);
}

// Overloads: one function, several call shapes (use sparingly: a union parameter is often simpler)
export function toArray(value: string): string[];
export function toArray(value: number): number[];
export function toArray(value: string | number): string[] | number[] {
  return typeof value === 'string' ? [value] : [value];
}
