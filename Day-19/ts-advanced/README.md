# Advanced TypeScript workbook (Day 19, part A)

**Author:** Ronit Ahuja · **Programme:** Linkific Month 1, Day 19
**Stack:** TypeScript 5.9 (strict), Vitest (`expectTypeOf`), React 19, Redux Toolkit 2 + react-redux 9, axios, Testing Library, oxlint
Part B of Day 19, applying these patterns to SalesPulse, is in `../salespulse-ts-adv`.

One topic per file in `src/`, one test file per topic in `test/`. Every claim is checked by the **compiler** (`npm run typecheck`) and by **tests** (`npm test`). Lines marked `// @ts-expect-error` are mistakes that *must* fail to compile; `npm run errors` removes each marker, runs `tsc`, and records the real message in `compile-errors.md`.

```bash
cd Day-19/ts-advanced
npm install
npm run check        # typecheck + lint + tests
npm run errors       # regenerate compile-errors.md
```

## Day 19 bullets, and where each is covered

| Day 19 bullet | File |
|---|---|
| `Partial` `Required` `Readonly` `Pick` `Omit` `Record` `Exclude` `Extract` | `01-utility-types.ts` (plus `NonNullable`, `ReturnType`, `Parameters`, `Awaited`, and hand-built `DeepPartial`, `DeepReadonly`, `Mutable`) |
| Generic constraints | `02-generics-advanced.ts` §1 (`extends`, `keyof`, defaults) |
| Conditional types | `02` §2 (distributive, non-distributive, filtering with `never`) |
| Mapped types | `02` §3 (modifiers `+ - readonly ?`, key remapping with `as`, `Getters`) |
| Template literal types | `02` §4 (`on${Capitalize<K>}`, unions multiply, route params) |
| `infer` | `02` §5 (`ReturnType`, `Parameters`, `Unwrap`, `Head`, `Last`, `StripPrefix`) |
| HOCs, render props, compound components, polymorphic components, `forwardRef` | `03-react-patterns.tsx` |
| Redux: actions, creators, reducers, selectors, Toolkit, `RootState` / `AppDispatch` | `04-redux-typed.ts` |
| Async/await, Promises, axios, fetch, error typing | `05-async-typed.ts` |
| Context: value, Provider props, consumer hooks, undefined context | `06-context-typed.tsx` |
| Declaration files: `.d.ts`, creating, augmenting, module declarations | `07-declaration-files.ts`, `types/*.d.ts`, `legacy/legacy.{js,d.ts}` |
| Avoid `any`, `unknown`, guards, discriminated unions, exhaustive checking | `08-guards-unions.ts` |
| Complex scenarios | `09-complex-scenarios.ts` (emitter, builder, path types, state machine, overloads, variadic tuples) |

## `tsconfig.json`, line by line

Identical to Day 18's workbook, so the same options apply:

| Option | Meaning |
|---|---|
| `target: ES2022`, `lib: [ES2022, DOM, DOM.Iterable]` | which JavaScript the output may use, and which built-in types exist (browser APIs included) |
| `module: ESNext`, `moduleResolution: bundler` | use `import` / `export` and resolve them the way Vite and other bundlers do |
| `jsx: react-jsx` | compile `<Tag />` with React's modern runtime (no `import React` needed) |
| `noEmit: true` | `tsc` only checks; a bundler produces the real output (`npm run emit` overrides this for the demo) |
| `isolatedModules: true` | every file must be understandable on its own, which is what Vite and Vitest need |
| `verbatimModuleSyntax: true` | type-only imports must say `import type`, so it is obvious what disappears |
| `skipLibCheck: true` | do not re-check the `.d.ts` files of installed packages |
| `strict: true` | turns on the whole family of strict checks, notably `strictNullChecks` (`null` and `undefined` are not silently allowed everywhere) and `noImplicitAny` (a value whose type can not be worked out is an error, not `any`) |
| `noUncheckedIndexedAccess` | `array[i]` and `record[key]` may be missing, so they are `T \| undefined` |
| `noImplicitOverride` | a method that overrides a parent's must say `override` |
| `noFallthroughCasesInSwitch` | a `case` that falls into the next one by accident is an error |
| `noUnusedLocals`, `noUnusedParameters` | unused variables and parameters are errors |

(`exactOptionalPropertyTypes` is left off: it makes optional properties stricter than most libraries' types expect.)

## Declaration files

A `.d.ts` file holds **only types**: no values, no function bodies. It is how TypeScript learns the shape of code it cannot read as TypeScript.

| Need | Tool | Here |
|---|---|---|
| Types for a plain `.js` file | a `.d.ts` with the same name beside it | `legacy/legacy.js` + `legacy.d.ts` (overloads, a class, a default export) |
| Types for an untyped npm package | `declare module 'name' { ... }` (first try `npm i -D @types/name`) | `types/modules.d.ts` (`tiny-slugify`) |
| Imports of non-code files | wildcard module `declare module '*.svg'` | `types/modules.d.ts` |
| Add a field to a global | `declare global { interface Window { ... } }` inside a **module** (`export {}`) | `types/globals.d.ts` |
| Extend a third-party interface | `declare module 'react' { interface CSSProperties { ... } }` | `types/augment.d.ts` (React, Vitest) |
| A global created by a `<script>` tag | `declare namespace` / `declare const` in a **script** file | `types/ambient.d.ts` |
| Declare a file dependency | `/// <reference path="..." />` | top of `07-declaration-files.ts` |

Rules worth remembering:

- A file with a top-level `import` or `export` is a **module**; without one it is a **script** (its declarations are global). `declare module 'x'` *augments* an existing module from inside a module file, but *declares a new one* from a script file.
- **Declaration merging:** two `interface` declarations with the same name become one; type aliases do not merge. That is why augmentation works for interfaces (`Window`, `CSSProperties`) and not for `type X = ...`.
- Augmentation cannot add a new top-level export; it can only add members to what exists.
- A `.d.ts` is trusted, not checked against the JavaScript. A wrong `.d.ts` is a lie the compiler believes (see Limits).

## `any` vs `unknown`

| | `any` | `unknown` |
|---|---|---|
| Assign anything to it | yes | yes |
| Read a property or call it | yes, unchecked | **no**, until narrowed |
| Assign it to a typed variable | yes (the target is no longer protected) | **no**, until narrowed |
| Spreads through the program | yes | no |

`typescript/no-explicit-any` is an error in oxlint. The workbook contains **two** deliberate explicit `any` annotations, both in `src/08-guards-unions.ts` (`shout`, `lengthOfAny`), each switched on with an `oxlint-disable-next-line` comment, to show the crash and the contagion. Everything else is `unknown`.

## Patterns cheat sheet

```ts
// Utility types
type NewUser = Omit<User, 'id' | 'createdAt'>;
type Patch   = Partial<Pick<User, 'name' | 'email'>>;
type Counts  = Record<Role, number>;            // every Role key required

// Constraint + keyof
function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }

// Conditional + infer
type Unwrap<T> = T extends Promise<infer U> ? U : T;

// Mapped with key remapping
type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };

// Guard, assertion, exhaustive switch
const isString = (v: unknown): v is string => typeof v === 'string';
default: return assertNever(shape);

// Redux Toolkit: derive the types, never write them by hand
type AppStore = ReturnType<typeof makeStore>;
type RootState = ReturnType<AppStore['getState']>;
type AppDispatch = AppStore['dispatch'];
const useAppSelector = useSelector.withTypes<RootState>();
const createAppAsyncThunk = createAsyncThunk.withTypes<{ state: RootState; extra: Extra; rejectValue: ApiError }>();

// Context that can never be read without its Provider
const Ctx = createContext<T | undefined>(undefined);
function useX(): T { const v = useContext(Ctx); if (v === undefined) throw new Error('...'); return v; }

// Polymorphic component
type Props<E extends ElementType> = Own & Omit<ComponentPropsWithoutRef<E>, keyof Own | 'as'> & { as?: E };

// Result instead of exceptions
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Brand
type UserId = string & { readonly [brand]: 'UserId' };
```

## Mistakes the compiler caught

`compile-errors.md` is generated by `npm run errors`: **70 marked lines, 70 compiler errors**, nothing written by hand.

## Tests

97 tests in 9 files (runtime behaviour, `expectTypeOf` assertions, the 70 must-fail lines, and jsdom component tests for the React, Redux and Context files). axios tests use a custom `adapter`; fetch tests inject a fake `fetch`. No test touches the network.

## Limits

- **Types are erased.** Nothing validates data at run time unless a guard or the schema validator in file 08 does. `axios.get<Post[]>` only *claims* the shape; `getPostsChecked` shows the safe version with `unknown` + a guard.
- **Honest casts.** A few `as` casts remain where the compiler cannot follow what the code does, each with a comment: `withLoading` / `withUser` (`rest as unknown as P`, because `Omit` over a generic does not simplify), the generic `forwardRef` re-cast, `makeGetters`, `pickKeys`, `getPath`, `validate`, `Machine.next`, brand constructors. They sit at one seam each, behind a typed signature.
- **`.d.ts` files are trusted.** `legacy.d.ts` is checked by tests, not by the compiler: if the JS changes and the `.d.ts` does not, the compiler will not notice.
- **`tiny-slugify` is imaginary.** Its declaration is used only with `import type`, so nothing imports it at run time.
- Some tests deliberately run "wrong" code (guarded by `expect(() => ...).toThrow()`) so the `@ts-expect-error` line is also exercised at run time.
- Deep recursive types (`Paths`, `Infer`) are fine for small shapes; on very large or cyclic types they can hit TypeScript's instantiation depth limit.
- `npm run errors` copies `src` and the tests and runs `tsc` on the copy, so it needs `node_modules` in this folder.
