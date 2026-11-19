/**
 * Exhaustive checking. Call this in the `default` branch of a switch over a union: if every member has
 * been handled, the value there has type `never` and the call compiles. Add a member to the union and
 * forget to handle it, and the value is no longer `never`, so the compiler points at this exact line.
 * (At run time it throws, in case data from outside the type system sneaks in.)
 */
export function assertNever(value: never, what = 'value'): never {
  throw new Error(`Unhandled ${what}: ${JSON.stringify(value)}`);
}
