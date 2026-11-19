/**
 * 08. Type safety habits: avoid `any`, use `unknown`, guard, discriminate, check exhaustively, brand.
 */

// ---- 1. any vs unknown ----
//
//   | question                       | any                       | unknown                         |
//   |--------------------------------|---------------------------|---------------------------------|
//   | assign anything to it?         | yes                       | yes                             |
//   | read a property / call it?     | yes, unchecked (crashes)  | NO, until narrowed              |
//   | assign it to a typed variable? | yes (infects the target)  | NO, until narrowed              |
//   | spreads through the program?   | yes: results become any   | no                              |
//
// The workbook's ONLY explicit `any` annotations are the two below (demos 1 and 2; demo 3 shows the implicit `any` of JSON.parse), each switched on with a lint-disable comment so the
// ban stays on everywhere else.

/** DEMO 1 of 3 (explicit any): `any` accepts a wrong call, so the mistake is a run-time crash */
// oxlint-disable-next-line typescript/no-explicit-any
export function shout(value: any): string {
  return value.toUpperCase(); // compiles for a number, throws at run time
}
/** The fix: `unknown` plus a check */
export function shoutSafe(value: unknown): string {
  return typeof value === 'string' ? value.toUpperCase() : String(value);
}

/** DEMO 2 of 3 (explicit any): `any` is contagious: a value read out of it is any too, and nothing downstream is checked */
// oxlint-disable-next-line typescript/no-explicit-any
export function lengthOfAny(box: { payload: any }): number {
  const inner = box.payload; // any
  const wrong: number = inner.name; // compiles: any is assignable to number
  return wrong;
}

/** DEMO 3 of 3: JSON.parse returns `any` in lib.d.ts. Store it as `unknown` at once. */
export function parseSafely(text: string): unknown {
  const parsed: unknown = JSON.parse(text);
  return parsed;
}

// ---- 2. Type guard functions: `value is T` ----

export const isString = (v: unknown): v is string => typeof v === 'string';
export const isNumber = (v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v);
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export interface Cat { kind: 'cat'; meow(): string }
export interface Dog { kind: 'dog'; bark(): string }
export type Pet = Cat | Dog;

/** Narrowing by `in`: does the property exist? */
export function speak(pet: Pet): string {
  return 'meow' in pet ? pet.meow() : pet.bark();
}

/** Narrowing by `instanceof` */
export function message(thrown: unknown): string {
  if (thrown instanceof Error) return thrown.message;
  if (typeof thrown === 'string') return thrown;
  return 'unknown error';
}

/** A guard on a generic: filter an array to the items that pass, with the right result type */
export function keep<T, S extends T>(items: readonly T[], guard: (item: T) => item is S): S[] {
  return items.filter(guard);
}

// ---- 3. Assertion functions: `asserts value is T` throws if wrong, narrows if it returns ----

export function assertString(value: unknown, label = 'value'): asserts value is string {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string`);
}
export function assertDefined<T>(value: T, label = 'value'): asserts value is NonNullable<T> {
  if (value === null || value === undefined) throw new Error(`${label} is missing`);
}

// ---- 4. Discriminated unions + exhaustive checking ----

export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rect':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape); // delete a case above and THIS line stops compiling
  }
}

/** Payment state: each state carries only the data that exists in it. "paid without a receipt" can not be written. */
export type Payment =
  | { status: 'idle' }
  | { status: 'processing'; startedAt: number }
  | { status: 'paid'; receiptId: string; amount: number }
  | { status: 'failed'; reason: string; retryable: boolean };

export function paymentLabel(p: Payment): string {
  switch (p.status) {
    case 'idle':
      return 'Not started';
    case 'processing':
      return `Processing since ${p.startedAt}`;
    case 'paid':
      return `Paid ${p.amount} (receipt ${p.receiptId})`;
    case 'failed':
      return p.retryable ? `Failed: ${p.reason}. Try again.` : `Failed: ${p.reason}`;
  }
}

/** `satisfies` checks an object against a type but KEEPS its precise type */
export const COLORS = { red: '#f00', green: '#0f0', blue: '#00f' } satisfies Record<string, string>;
// COLORS.red is the literal-ish string key; `Record<string,string>` alone would allow COLORS.purple

/** An exhaustive lookup: a Record keyed by the union means a new Shape kind forces a new entry */
export const SIDES: Record<Shape['kind'], number> = { circle: 0, rect: 4, triangle: 3 };

// ---- 5. Branded types: same shape at run time, incompatible at compile time ----

declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };
export type UserId = Brand<string, 'UserId'>;
export type OrderId = Brand<string, 'OrderId'>;

/** The only way to MAKE a UserId is through a check */
export function toUserId(raw: string): UserId {
  if (!/^u_\d+$/.test(raw)) throw new Error(`not a user id: ${raw}`);
  return raw as UserId; // the one cast: we just proved it
}
export function toOrderId(raw: string): OrderId {
  if (!/^o_\d+$/.test(raw)) throw new Error(`not an order id: ${raw}`);
  return raw as OrderId;
}
export function loadUser(id: UserId): string {
  return `user:${id}`;
}

// ---- 6. A runtime validator built from a schema type ----
// Idea: describe the shape ONCE as data; derive both the validator and the TypeScript type from it.

export type Schema =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'boolean' }
  | { type: 'array'; items: Schema }
  | { type: 'object'; fields: Readonly<Record<string, Schema>> };

/** Turn a schema into the type it describes: a recursive conditional type */
export type Infer<S extends Schema> = S extends { type: 'string' }
  ? string
  : S extends { type: 'number' }
    ? number
    : S extends { type: 'boolean' }
      ? boolean
      : S extends { type: 'array'; items: infer I extends Schema }
        ? Infer<I>[]
        : S extends { type: 'object'; fields: infer F extends Readonly<Record<string, Schema>> }
          ? { -readonly [K in keyof F]: Infer<F[K] & Schema> }
          : never;

export function matches(schema: Schema, value: unknown): boolean {
  switch (schema.type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value) && value.every((v) => matches(schema.items, v));
    case 'object':
      return isRecord(value) && Object.entries(schema.fields).every(([key, field]) => matches(field, value[key]));
  }
}

/** The validator: returns the value typed as Infer<S> if it matches, otherwise throws */
export function validate<const S extends Schema>(schema: S, value: unknown): Infer<S> {
  if (!matches(schema, value)) throw new TypeError('value does not match the schema');
  return value as Infer<S>; // the runtime check above is the proof the compiler can not see
}

export const userSchema = {
  type: 'object',
  fields: { id: { type: 'number' }, name: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } },
} as const satisfies Schema;
