import type { Shape } from './02-objects-unions-literals';

/**
 * 03. `any`, `unknown` and `never`.
 *
 *  any      turns the checker OFF for a value. Everything is allowed, so mistakes appear at run time.
 *           This project never uses it (the linter forbids it).
 *  unknown  "something, but I have not checked what". You must narrow it before using it.
 *  never    "this can not happen": the type of a function that never returns, and of a value left
 *           over after every case of a union has been handled.
 */

// Data that comes from outside (JSON, an API, localStorage) is `unknown`, not `any`
export function parseJson(text: string): unknown {
  return JSON.parse(text);
}

// A type guard: a function whose `value is X` return type narrows the caller's variable
export function isNamed(value: unknown): value is { name: string } {
  return typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string';
}

export function nameFromJson(text: string): string {
  const data = parseJson(text);
  return isNamed(data) ? data.name : 'unknown';
}

// `never` as a safety net: if someone adds a new Shape and forgets to handle it here,
// `shape` is no longer `never` at the call and the build fails
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function perimeter(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return 2 * Math.PI * shape.radius;
    case 'rect':
      return 2 * (shape.width + shape.height);
    default:
      return assertNever(shape);
  }
}

// A function that always throws returns `never`
export function fail(message: string): never {
  throw new Error(message);
}
