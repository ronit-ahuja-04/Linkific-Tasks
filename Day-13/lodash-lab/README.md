# DataDesk: a Lodash lab

A React app that puts Lodash to work on a realistic problem: **10,000 generated users** you can search, filter, sort, group, edit, chart and benchmark. Every Lodash call lives in small pure functions under `src/lib/` (easy to test), and the screens only call them.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit and component tests (Vitest)
npm run test:e2e     # browser tests (Playwright, Chrome)
npm run bench        # Lodash vs native numbers in Node
npm run bundle-sizes # what each import style costs in the browser
npm run methods-used # every Lodash method imported in src/
```

## What is in it

| Tab | What it shows | Lodash used |
|---|---|---|
| **Directory** | Debounced search, filters, multi-column sort, grouping, pagination, "random user", "shuffle page" | `debounce`, `filter`, `every`, `some`, `inRange`, `orderBy`, `groupBy`, `meanBy`, `sumBy`, `chunk`, `clamp`, `sample`, `shuffle`, `deburr`, `escapeRegExp`, `words` |
| **Dashboard** | KPIs, headcount bars, salary histogram, hires per year, top skills, salary by department | `countBy`, `range`, `flatMap`, `partition`, `maxBy`, `minBy`, `uniqBy`, `toPairs`, `mapValues`, `take` |
| **Search lab** | Debounce and throttle playground: keystrokes vs real calls, leading/trailing, `maxWait`, cancel, flush | `debounce`, `throttle` |
| **Profile form** | A nested form: deep clone as draft, changed-field list with undo, validation, a "public payload" | `cloneDeep`, `get`, `set`, `unset`, `has`, `merge`, `pick`, `omit`, `xor`, `isEqual`, `union` |
| **Methods** | 50 methods, each with input, Lodash code and result, the native equivalent and whether the results match | everything in the task list, and more |
| **Benchmark** | Runs Lodash against plain JavaScript on 1k to 100k users in your browser | `groupBy`, `sortBy`, `orderBy`, `uniqBy`, `countBy`, `flatMap`, `chunk`, `get`, `cloneDeep`, `isEqual` |

`npm run methods-used` finds **68 distinct Lodash methods** imported (the task asked for at least 10).

## Lodash use cases (and the pattern behind each)

**1. Search and filter a large dataset** (`src/lib/query.js`). Build a search index once per dataset (`map` + `deburr` + `toLower`) so each keystroke is a cheap `includes`. All search words must match (`every`), at least one chosen skill must match (`some`), age uses `inRange` (upper bound is exclusive, hence `max + 1`). Accents are ignored: typing `zoe` finds `Zoë`.

**2. Debounced search input** (`src/hooks/useDebounce.js`). `useDebouncedValue(value, 300)` follows a value after it stops changing; `useDebouncedCallback` returns a stable debounced function that always calls the latest callback, with `.cancel()` and `.flush()`. Creating `debounce(...)` in a component body would create a new timer every render and lose the pending call, so it is created once per option set and cancelled on unmount. The Search lab shows the saving live: 5 keystrokes, 1 call.

**3. Deep clone complex state** (`src/lib/form.js`). The profile form edits a `cloneDeep` draft, so nothing touches the saved user until Save. `setField` clones, then `set`s, so every update is immutable and missing parents are created (`address.geo.lat` on a user without `geo`).

**4. Group by category** (`groupUsers`, `salaryByDepartment`). `groupBy` then `map` over the groups for counts and averages, `orderBy` so the biggest group is first.

**5. Safely access nested properties** (`get`, `has`). `get(user, 'contact.phone', 'n/a')` never throws. Optional chaining does the same job for fixed paths; `get` wins when the path is a string you build at run time (form field names).

**6. Data transformations** (`src/lib/stats.js`). Each dashboard number is a short chain: `flatMap` all skills, `countBy(identity)`, `toPairs`, `orderBy`, `take(10)`.

## Importing Lodash: whole library vs per method

| Import style | Minified | Gzipped |
|---|---:|---:|
| `import _ from 'lodash'` then `_.debounce` | 101.1 kB | 28.2 kB |
| `import { debounce } from 'lodash'` | 100.5 kB | 28.0 kB |
| `import debounce from 'lodash/debounce'` | 4.6 kB | 1.6 kB |
| `import { debounce } from 'lodash-es'` | 3.3 kB | 1.3 kB |

Measured with `npm run bundle-sizes` (a one-line app per style, built by Vite).

- **Named imports from `'lodash'` do not help.** The package is CommonJS, so a bundler cannot drop the unused methods: both whole-library styles cost the full ~28 kB.
- **Per-method imports** (`lodash/debounce`) pull only that method and its helpers. This app uses them everywhere.
- **`lodash-es`** is the ES-module build; bundlers tree-shake it, so named imports are smallest. Its drawback in tests: Vitest/Jest need extra configuration for ES-module dependencies.
- This app's whole production bundle is about 111 kB gzipped, including React and all 68 methods.

## Performance: Lodash vs native

`npm run bench` runs the same suites as the Benchmark tab (full tables and conclusions: [`../LODASH_VS_NATIVE.md`](../LODASH_VS_NATIVE.md)). On 10,000 users in Node 20:

| Task | Lodash | Native | Faster |
|---|---:|---:|---|
| sort by salary | 3.02 ms | 1.46 ms | native 2.1x |
| group by department | 0.36 ms | 0.28 ms | native 1.3x |
| safe deep read | 0.99 ms | 0.15 ms | native 6.5x |
| all skills in one list (`flatMap`) | 0.45 ms | 3.28 ms | Lodash 7.2x |
| deep copy 10k users | 39.2 ms | 43.2 ms | about equal |

**Takeaway:** for simple array work, native is usually as fast or faster. Lodash earns its place with ergonomics (shorthands like `'address.geo.lat'` and `{ team: 'web' }`), deep paths, null safety and `debounce`/`throttle`, not with raw speed. Numbers vary by machine and engine.

## Project layout

```
src/lib/        pure functions: query, stats, form, strings, methods registry, benchmarks
src/data/       seeded user generator (the same 10,000 users every load)
src/hooks/      useDebouncedValue, useDebouncedCallback, useThrottledCallback
src/context/    DataContext, ThemeContext (light/dark), ToastContext
src/components/ Tabs (compound component), ToastViewport
src/screens/    the six tabs, each with its own stylesheet in src/styles/
test/           unit and component tests    e2e/  Playwright tests
scripts/        benchmark, bundle-sizes, methods-used
```

## Testing

- **Unit and component (Vitest):** the pure libraries (a native implementation is the oracle for search, stats and every method that has a native equivalent), the debounce and throttle hooks with fake timers, and every screen.
- **Browser (Playwright, Chrome):** each tab's main flow, theme switch, keyboard tab navigation. Every test **fails on any console error or warning**. Runs against the dev server and the production bundle (`E2E_PROD=1 npm run test:e2e`).
- **Accessibility:** axe-core WCAG 2.1 AA on every tab in light and dark: zero violations.

## Lodash quirks found while building this

- `uniq` over a fixed number of random draws can leave fewer items than wanted (a generator bug this caught: users with one skill). Draw until you have enough distinct values.
- `snakeCase('Q3 Report')` gives `q_3_report`: letters and digits are split.
- `merge` combines nested objects; object spread replaces them whole.
- `sortBy`/`orderBy` compare with `<`, not locale rules: use `Intl.Collator` when accents or language matter.
- `random`, `sample` and `shuffle` use `Math.random` and cannot be seeded, so the dataset uses a small seeded generator (`mulberry32`) instead.
- `highlightParts` matches on accent-folded text but cuts the original, so `Zoë` highlights for `zoe`; when folding changes the length (`æ` to `ae`) it skips highlighting rather than mis-cut.
