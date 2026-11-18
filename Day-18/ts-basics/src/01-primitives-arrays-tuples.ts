/**
 * 01. Primitives, arrays and tuples.
 * Every annotation below could be inferred; they are written out so you can see the types.
 */
export const title: string = 'FlowLane';
export const tasksDone: number = 12;
export const isOnline: boolean = true;

// Arrays: two spellings of the same thing
export const scores: number[] = [90, 72, 85];
export const names: Array<string> = ['Ann', 'Bob'];
// A readonly array cannot be pushed to or sorted in place: the compiler stops you
export const weekdays: readonly string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// A tuple is an array with a fixed length and a type per position (the labels are only documentation)
export type Point = [x: number, y: number];
export const origin: Point = [0, 0];

export function distance(a: Point, b: Point): number {
  const [ax, ay] = a;
  const [bx, by] = b;
  return Math.hypot(bx - ax, by - ay);
}

// With `noUncheckedIndexedAccess` an index read might be missing, so the result says so
export function first(numbers: readonly number[]): number | undefined {
  return numbers[0];
}

// A tuple as a return type: a value and a flag, like React's useState returns [value, setter]
export function parseNumber(text: string): [ok: boolean, value: number] {
  const value = Number(text);
  return [!Number.isNaN(value), value];
}
