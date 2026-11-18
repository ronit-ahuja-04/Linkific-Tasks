# TypeScript workbook (Day 18, part A)

**Author:** Ronit Ahuja · **Programme:** Linkific Month 1, Day 18
**Stack:** TypeScript 5.9 (strict), Vitest (`expectTypeOf` for compile-time assertions), React 19, Testing Library, oxlint
Part B of Day 18, converting a real app to TypeScript, is in `../salespulse-ts`.

One small file per topic in `src/`, one test file per topic in `test/`. Every claim in a comment is checked two ways: by the **compiler** (`npm run typecheck`) and by a **test** (`npm test`). Lines marked `// @ts-expect-error` are mistakes that *must* fail to compile: if the compiler ever stops complaining about one, the build fails.

```bash
cd Day-18/ts-basics
npm install
npm run check        # typecheck + lint + tests
npm run errors       # regenerate compile-errors.md from the real compiler output
npm run emit         # compile to dist/ and look at the JavaScript
```

## What TypeScript is, and why use it

TypeScript is JavaScript plus **types**: labels on values that describe what they may be. A separate program, the compiler (`tsc`), reads those labels, reports mistakes, and then **erases** them. What runs in the browser is ordinary JavaScript.

Benefits, each shown by code in this folder:

| Benefit | Example here |
|---|---|
| Mistakes become errors in the editor, not bugs in production | `add('1', 2)`, a misspelt property `emial`, a missing field: see `compile-errors.md` |
| The compiler forces you to handle the edge cases | `first(scores)` returns `number \| undefined`, so you must decide what an empty array means |
| Unions make impossible states unrepresentable | `Result<T>` is either `{ ok: true, value }` or `{ ok: false, error }`; reading `value` from a failed result does not compile |
| Refactoring is safe | add a fourth `Shape` and `perimeter` stops compiling until you handle it (`assertNever`) |
| Types are documentation that cannot go out of date | every function signature says what goes in and what comes out |
| Autocomplete and rename | the editor knows every property of every value |

What it does **not** do: it does not check anything at run time. Data from a server or `localStorage` can be any shape whatever the types say, which is why `parseJson` returns `unknown` and must be checked before use.

## Compilation to JavaScript

`npm run emit` writes `dist/`. This is `describeId` from `src/02-objects-unions-literals.ts` after compilation; the `Id` type, the `User` type and every annotation are gone:

```js
export function describeId(id) {
    if (typeof id === 'number')
        return `#${id}`; // here id is a number
    return id.toUpperCase(); // here id is a string
}
```

(The tests and the dev server never run `tsc`'s output: Vite and Vitest strip types themselves and leave checking to `npm run typecheck`. That is why `typecheck` is a separate step and part of `check`.)

## `tsconfig.json`, line by line

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

## The topics

| File | Covers |
|---|---|
| `01-primitives-arrays-tuples.ts` | `string` `number` `boolean`, arrays (`T[]`, `Array<T>`, `readonly`), tuples |
| `02-objects-unions-literals.ts` | object types, optional `?`, union types, literal types, type aliases, narrowing, discriminated unions |
| `03-any-unknown-never.ts` | why `any` is banned here, `unknown` plus type guards, `never` and exhaustive `switch` |
| `04-interfaces.ts` | interfaces, `readonly`, extending, declaration merging, interface vs type |
| `05-functions.ts` | parameter and return types, optional, default and rest parameters, function type expressions, `void`, overloads |
| `06-generics.ts` | generic functions and interfaces, constraints (`extends`, `keyof`), a typed `fetchJson<T>`, when *not* to use a generic |
| `07-todo-typed.tsx` | a typed Todo: props interfaces, `children: ReactNode`, `ChangeEvent` and `FormEvent`, `useState<Filter>`, `useRef<HTMLInputElement>`, a reducer with a discriminated union of actions, a custom hook, a typed form |

### Interface or type?

For plain object shapes either works. This workbook uses `interface` for shapes that other code extends or implements (`Person`, `Employee`, component props) and `type` for unions, tuples, function types and aliases (`Result<T>`, `Status`, `Point`, `Formatter`). Differences that matter: interfaces can be extended and **merge** when declared twice (`Settings` in file 04); type aliases can name unions and tuples, which interfaces cannot.

### `any`, `unknown`, `never`

- `any` switches the checker off for that value. The linter (`typescript/no-explicit-any`) fails the build on it.
- `unknown` means "something, not yet checked". You cannot use it until you narrow it (`parseJson`, `isNamed`).
- `never` is the type with no values: a function that always throws, and what is left of a union after every case has been handled.

## Mistakes the compiler caught

`compile-errors.md` is **generated** by `npm run errors`: the script removes every `// @ts-expect-error` marker from a copy of the tests, runs `tsc`, and records the real message for each line (30 marked lines, 30 compiler errors). A few of them:

| Mistake | What the compiler says |
|---|---|
| `weekdays.push('Sat')` on a `readonly string[]` | `Property 'push' does not exist on type 'readonly string[]'` |
| `{ id: 1, name: 'Ann', emial: 'a@x.com' }` | `... 'emial' does not exist in type 'User'. Did you mean to write 'email'?` |
| `data.a` where `data` is `unknown` | `'data' is of type 'unknown'` |
| `pluck(todos, 'name')` | `Argument of type '"name"' is not assignable to parameter of type 'keyof Todo'` |

## Tests

35 tests in 7 files: runtime behaviour, compile-time type assertions (`expectTypeOf`), the 30 must-fail lines, and component tests for the Todo (adding, completing, filtering, clearing, removing; the input is refocused through the typed `useRef`).

## Limits

- Types are erased: nothing here validates data at run time. `fetchJson<T>` *asserts* the response shape (`as T`) because the server's JSON cannot be checked by the compiler; a real app would validate it (with a schema library) at that edge.
- The `@ts-expect-error` lines run as ordinary JavaScript in the tests, so the "wrong" code is wrapped in functions that are never called where calling it would crash.
- `npm run errors` copies the tests and runs `tsc` on the copy, so it needs `node_modules` in this folder.
- Overloads are shown once and are rarely the best tool; a union parameter is often simpler.
