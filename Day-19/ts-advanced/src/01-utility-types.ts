/**
 * 01. Utility types: types that build new types out of existing ones.
 *
 * Every built-in below is a one-line *mapped* or *conditional* type. Section 2 rebuilds the simple ones by hand
 * so they stop being magic.
 */

export interface User {
  id: number;
  name: string;
  email?: string; // optional
  readonly createdAt: string; // readonly
  role: 'admin' | 'member' | 'guest';
}

// ---- 1. The eight the brief names ----

/** Partial<T>: every property optional. The shape of an "update" or a "patch". */
export type UserPatch = Partial<User>;

/** Required<T>: every property required (also removes `?`). `email` becomes `string`. */
export type FullUser = Required<User>;

/** Readonly<T>: every property readonly (shallow). */
export type FrozenUser = Readonly<User>;

/** Pick<T, K>: keep only the listed keys. */
export type UserSummary = Pick<User, 'id' | 'name'>;

/** Omit<T, K>: keep everything except the listed keys. Typical use: "a new user has no id yet". */
export type NewUser = Omit<User, 'id' | 'createdAt'>;

/** Record<K, T>: an object type with keys K and values T. With a union of literals as K, every key is REQUIRED. */
export type RoleCounts = Record<User['role'], number>;

/** Exclude<U, X>: remove members from a union. */
export type Role = User['role'];
export type NonAdminRole = Exclude<Role, 'admin'>; // 'member' | 'guest'

/** Extract<U, X>: keep only the members assignable to X. */
export type AdminOrGuest = Extract<Role, 'admin' | 'guest'>;

// ---- 2. More built-ins you will meet daily ----

/** NonNullable<T>: drop null and undefined */
export type Defined = NonNullable<string | null | undefined>; // string

export function makeUser(name: string, role: Role = 'member'): User {
  return { id: 1, name, role, createdAt: '2026-01-01' };
}

/** ReturnType<F> and Parameters<F> read a function's signature */
export type MadeUser = ReturnType<typeof makeUser>; // User
export type MakeUserArgs = Parameters<typeof makeUser>; // [name: string, role?: Role]

/** Awaited<T>: what a promise resolves to (recursively) */
export async function loadUser(): Promise<User> {
  return makeUser('Ann');
}
export type Loaded = Awaited<ReturnType<typeof loadUser>>; // User, not Promise<User>

// ---- 3. Using them ----

/** Apply a patch without mutating: the patch is Partial<User>, the result is a full User */
export function applyPatch(user: User, patch: UserPatch): User {
  return { ...user, ...patch };
}

/** A "create" function takes NewUser and adds what the server decides */
export function createUser(input: NewUser, id: number): User {
  return { ...input, id, createdAt: '2026-01-01' };
}

export function countRoles(users: readonly User[]): RoleCounts {
  const counts: RoleCounts = { admin: 0, member: 0, guest: 0 }; // leave one out and it does not compile
  for (const u of users) counts[u.role] += 1;
  return counts;
}

export function summarise(user: User): UserSummary {
  return { id: user.id, name: user.name };
}

/** Freezing at run time AND in the type: Readonly only exists at compile time, Object.freeze does the real thing */
export function freeze(user: User): FrozenUser {
  return Object.freeze({ ...user });
}

// ---- 4. How they are built (hand-written versions) ----

/** Partial: a mapped type with the `?` modifier added */
export type MyPartial<T> = { [K in keyof T]?: T[K] };
/** Required: `-?` REMOVES the optional modifier */
export type MyRequired<T> = { [K in keyof T]-?: T[K] };
/** Readonly: `readonly` modifier added */
export type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
/** Mutable: `-readonly` removes it (there is no built-in for this) */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
/** Pick: iterate over only the chosen keys */
export type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
/** Exclude: a distributive conditional type: it is applied to each union member separately */
export type MyExclude<T, U> = T extends U ? never : T;
/** Omit: Pick everything whose key is not excluded */
export type MyOmit<T, K extends keyof never> = Pick<T, Exclude<keyof T, K>>;

/** DeepPartial: Partial is SHALLOW; this recurses into nested objects (arrays are left alone) */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** DeepReadonly: Readonly is shallow too */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer E)[]
    ? readonly DeepReadonly<E>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export interface Settings {
  theme: { mode: 'light' | 'dark'; accent: string };
  notifications: { email: boolean; push: boolean };
  tags: string[];
}

/** Merge a deep patch into settings (one level of recursion is enough for the demo's shape) */
export function updateSettings(current: Settings, patch: DeepPartial<Settings>): Settings {
  return {
    theme: { ...current.theme, ...patch.theme },
    notifications: { ...current.notifications, ...patch.notifications },
    tags: patch.tags ?? current.tags,
  };
}

/** An object of unknown shape: string keys, `unknown` values (not `any`), so every read still has to be checked */
export type Unsafe = Partial<Record<string, unknown>>; // the safe alternative: unknown values, string keys
