/**
 * 02. Advanced generics: constraints, conditional types, mapped types, template literal types, `infer`.
 */

// ---- 1. Constraints ----

/** `T extends { length: number }`: any T, as long as it has a numeric length (string, array, ...) */
export function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

/** `K extends keyof T`: the key must really exist on the object, and the result type follows the key */
export function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

/** Several keys at once: the result is Pick<T, K> */
export function pickKeys<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>; // the one place a cast is honest: we fill it in on the next lines
  for (const key of keys) out[key] = obj[key];
  return out;
}

/** A constraint can mention another type parameter */
export function merge<A extends object, B extends object>(a: A, b: B): A & B {
  return { ...a, ...b };
}

/** A default type parameter: `Box` alone means `Box<string>` */
export interface Box<T = string> {
  value: T;
}

// ---- 2. Conditional types: `T extends U ? X : Y` ----

export type IsString<T> = T extends string ? true : false;

/** Distributive: when T is a naked union, the check runs on EACH member and the results are unioned */
export type ToArray<T> = T extends unknown ? T[] : never;
// ToArray<string | number> = string[] | number[]  (not (string | number)[])

/** Wrapping T in a tuple turns distribution OFF */
export type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;
// ToArrayNonDist<string | number> = (string | number)[]

/** `never` in a conditional is how members are filtered out of a union */
export type OnlyStrings<T> = T extends string ? T : never;

/** Keys of T whose value is of type V */
export type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

// ---- 3. Mapped types ----

/** Nullable<T>: every property may also be null */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/** Modifiers: `-?` removes optional, `+readonly` adds readonly */
export type StrictFrozen<T> = { +readonly [K in keyof T]-?: T[K] };

/** Key remapping with `as`: build a getters type: { name: string } -> { getName: () => string } */
export type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };

/** `as` can also FILTER: remapping a key to `never` drops it */
export type WithoutFunctions<T> = { [K in keyof T as T[K] extends (...args: never[]) => unknown ? never : K]: T[K] };

export function makeGetters<T extends object>(obj: T): Getters<T> {
  const out: Record<string, () => unknown> = {};
  for (const key of Object.keys(obj)) {
    out[`get${key.charAt(0).toUpperCase()}${key.slice(1)}`] = () => (obj as Record<string, unknown>)[key];
  }
  return out as Getters<T>; // the mapped type is too clever for the compiler to see through; one honest cast at the edge
}

// ---- 4. Template literal types ----

export type Greeting = `Hello, ${string}`;
export type EventName<K extends string> = `on${Capitalize<K>}`;
export type Handlers<T> = { [K in keyof T & string as EventName<K>]: (value: T[K]) => void };

/** Unions inside a template multiply: 2 x 3 = 6 strings */
type Side = 'top' | 'bottom';
type Axis = 'left' | 'center' | 'right';
export type Position = `${Side}-${Axis}`;

export type Shouting<S extends string> = Uppercase<S>;

/** Pull `:params` out of a route string, using `infer` INSIDE a template literal */
export type RouteParams<Path extends string> = Path extends `${string}:${infer Param}/${infer Rest}`
  ? Param | RouteParams<`/${Rest}`>
  : Path extends `${string}:${infer Param}`
    ? Param
    : never;

export type ParamsObject<Path extends string> = Record<RouteParams<Path>, string>;

export function buildPath<P extends string>(path: P, params: ParamsObject<P>): string {
  let result: string = path;
  for (const [key, value] of Object.entries<string>(params)) result = result.replace(`:${key}`, value);
  return result;
}

// ---- 5. `infer`: "name the piece I am matching" ----

/** ReturnType, re-implemented: match the function shape and capture the return type */
export type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;
/** Parameters, re-implemented */
export type MyParameters<F> = F extends (...args: infer P) => unknown ? P : never;
/** The first argument */
export type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;
/** Unwrap a Promise (one level) */
export type Unwrap<T> = T extends Promise<infer U> ? U : T;
/** Element type of an array */
export type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
/** First and last of a tuple */
export type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
/** infer in a template: "get" + Name -> name */
export type StripPrefix<S extends string, P extends string> = S extends `${P}${infer Rest}` ? Rest : S;
