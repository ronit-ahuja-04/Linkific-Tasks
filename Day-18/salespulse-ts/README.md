# SalesPulse in TypeScript

**Day 18 project (part B):** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** TypeScript 5.9 (strict), React 19, Vite, Recharts 3, Vitest, Testing Library, Playwright, oxlint
**Starting point:** Day 14 `salespulse` (a Recharts dashboard), copied and migrated file by file. The behaviour, styling and tests are the same; only the types are new.
**Part A:** the TypeScript workbook, with every fundamental shown and tested, is in [`../ts-basics`](../ts-basics/README.md).
**PRD:** [`../Day18_PRD.md`](../Day18_PRD.md)

## Run

```bash
cd Day-18/salespulse-ts
npm install
npm run dev            # http://localhost:5173
npm run typecheck      # tsc: strict, zero errors
npm run lint
npm test               # 67 unit and component tests
npm run test:e2e       # 27 browser tests (Chrome), including axe WCAG 2.1 AA
npm run escapes        # counts any / type assertions / @ts- comments in src/ (fails on any `any`)
npm run errors         # regenerates compile-errors.md from the real compiler output
npm run build          # type-checks, then builds
```

## The brief, item by item

| Deliverable | Result |
|---|---|
| React app fully typed | All 30 files in `src/` are `.ts` or `.tsx` (19 `.tsx`, about 3,000 lines), plus every test, browser spec and config file. `allowJs` is **off**: a JavaScript file can no longer be added by accident |
| At least 10 typed components | 26 function components, all typed (list below) |
| Interfaces for all props | Every component's props are typed: 14 named `…Props` interfaces and a few small inline types for one-prop components (`{ children: ReactNode }`) |
| Typed state and hooks | `useState<Range>`, `useState<WithAll<Region>>`, `useState<Zoom \| null>`, `useRef<HTMLDivElement>`, `useReducer` with a union of actions, and the custom hooks `useDashboardData` and `useChartMotion` with explicit return types |
| Typed API responses | `DashboardApi`, `DashboardResponse`, and a generic `simulateRequest<T>` in `api/mockApi.ts` |
| No `any` (or minimal) | **Zero `any`** in `src/` and in `test/` (checked by `npm run escapes`, and the linter forbids it). One type assertion in the whole app (see below) |
| README explaining the benefits of TypeScript | This file, with examples from this migration, and `../ts-basics/README.md` |

The 26 components: `App`, `FilterBar`, `Tabs` with `Tabs.List`, `Tabs.Tab` and `Tabs.Panel`, `ToastViewport` and `ToastItem`, `ChartCard`, `DataTable`, `ChartTooltip`, `ResponsiveChart`, the five screens (`OverviewScreen`, `SalesScreen`, `UsersScreen`, `RevenueScreen`, `ExploreScreen`), `MonthDetails`, `UsersTooltip`, `PieTooltip`, `ProductTooltip`, `Kpi`, `Segmented`, and the three providers (`DashboardProvider`, `ThemeProvider`, `ToastProvider`).

## What the migration did to the code

```
src/types.ts                 the domain model in one place: Region, Category (derived from the data lists),
                             SalesRow, UsersRow, Product, Score, DashboardResponse, DashboardApi, the metric shapes
src/lib/createStrictContext  a generic that replaces five copies of "null default + guarded hook"
src/lib/guards.ts            type guards for values that arrive as plain strings or unknown
src/lib/typed.ts             record(): the only type assertion in the app
```

TypeScript features used, and where:

| Feature | Where |
|---|---|
| Types derived from data, so the two can not drift | `REGIONS = [...] as const` and `type Region = (typeof REGIONS)[number]`; `Range` from `RANGES` |
| Union and literal types | `WithAll<Region>` (a region or `'All'`), `Granularity`, `Dimension`, `ToastType` |
| Discriminated unions | the toast reducer's actions (`add`, `dismiss`, `clear`) |
| Generics | `createStrictContext<T>`, `simulateRequest<T>`, `Segmented<T extends string>`, `ChartCard<Row>`, `splitPeriods<T>`, `monthlyByName<N extends string>` |
| Constraints and `keyof` | `sum(rows, key)` accepts only keys whose value is a number; table column keys must be fields of the row |
| Mapped types | `ColumnByKey<Row>`: one column shape per field, so `format` receives that field's own type |
| Overloads | `monthlyBy(rows, 'region')` returns region columns, `'category'` returns category columns |
| `unknown` and type guards | thrown values in `useDashboardData`; Recharts' loosely typed tooltip payloads (`toSlice`, `toProduct`, `toUsersPoint`); a `<select>`'s string value (`isRegionFilter`) |
| Utility types | `Pick`, `Omit`, `Record`, `ComponentPropsWithoutRef` |
| React types | `ReactNode`, `ChangeEvent`, `KeyboardEvent`, `MouseEvent`, `LucideIcon`, props `extends Omit<ComponentPropsWithoutRef<'button'>, 'value'>` |

## What TypeScript found

Every item here was reported by the compiler during this migration, not written in advance. The first four came from turning the checks on harder as the work went on.

1. **Nine array reads that might be missing** (`noUncheckedIndexedAccess`). The season factor in the data generator, the first element of a week, and the first and last visible month in two screens each assumed an element existed. Each is now handled (a default, or a check) instead of relying on the data happening to be there.
2. **A filter that accepted anything.** `setRegion(event.target.value)` took whatever string the `<select>` held. Now the value goes through `isRegionFilter` and only a real `Region` (or `'All'`) is accepted.
3. **A value the old code read but Recharts does not promise.** The scatter chart's custom shape destructured `fill` from props. It worked because Recharts passes it, but it is not in Recharts' types. The colour now comes from the product's category, which is where it was set anyway.
4. **Optional values treated as always present.** A pie label read `midAngle` (optional in Recharts' types), which would have drawn a label at `NaN` for a slice without an angle; the brush's start and end indexes are optional too.
5. **Tooltip data typed as `any` by the library.** Recharts types a tooltip entry's `.payload` as `any`, and a series' `dataKey` can even be a function. The app now says what it expects (`toSlice`, `toProduct`, `toUsersPoint`, built from `unknown`), and a tooltip that is handed something else renders nothing instead of crashing.
6. **A comparison that could never be true.** The browser-test fixture compared a console message's type with `'verbose'`, which Playwright's types do not list. I kept the behaviour (it may be a Chrome-only value) and widened the type deliberately.

`compile-errors.md` is generated by `npm run errors` and lists 13 deliberate mistakes against this app's own API with the exact message the compiler gives for each. For example, `filterSales(sales, { region: 'Europ' })` is rejected with *Did you mean '"Europe"'?*, `dashboard.setRange(5)` with *not assignable to '3 | 24 | 12 | 6'*, and a table column with the key `'revnue'` with *not assignable to '"value" | "label"'*.

## Escape hatches (the honest count)

`npm run escapes` reads the real syntax tree (it does not just search for the word "any"):

| In `src/` | Count |
|---|---|
| `any` | 0 |
| `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` | 0 |
| non-null assertions (`x!`) | 0 |
| type assertions (`x as T`) | **1**: `record()` in `src/lib/typed.ts` |

`record(names, valueOf)` builds an object with one key per name. `Object.fromEntries` can only promise `{ [key: string]: V }`; the function knows the keys are exactly `names`, so it says so once, in one named place, instead of at every use. `as const` is not counted (it narrows, it does not override).

In `test/` there is one `@ts-expect-error` per deliberate mistake (that is the point of those lines), and a helper `must()` that fails a test with a clear message when a value is missing, instead of using `!`.

## Settings

`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, and `allowJs: false`. The workbook README explains each option. The migration used `allowJs: true` until the last JavaScript file was converted, so the build stayed green after every pull request.

## Tests

| Layer | Result |
|---|---|
| `tsc` | zero errors over `src`, `test`, `e2e` and the three config files |
| Unit and component | 67 tests in 10 files (Day 14's 58, plus tests for `createStrictContext` and the toast reducer, and the typed-mistakes file) |
| Browser (Chrome) | 27 tests, unchanged from Day 14, including axe WCAG 2.1 AA on every tab in light and dark |
| Lint | clean, with `typescript/no-explicit-any` as an error |
| Build | `tsc --noEmit && vite build` passes |

## Differences from the plan, and limits

- The plan mentioned a discriminated union for the dashboard's load state (`idle | loading | error | ready`). I kept the existing flags (`loading`, `refreshing`, `error`) because five screens and several tests read them, and a union would have changed all of them for no new safety. The flags are computed from three facts, so they can not disagree.
- Types are erased at run time. The mock API's data is generated in the browser, so it is typed by construction; a real API's JSON would need validating at the edge (the workbook shows `fetchJson<T>` and why `as T` there is an assumption).
- `JSON.parse` in one test helper returns untyped data, so that helper states its expected shape (`ProbeState`) in one place.
- Recharts' types are loose in places (`payload: any`, optional geometry props). The guards above narrow them; they check the shape rather than prove it.
- Only Chrome was tested, as in Day 14.
