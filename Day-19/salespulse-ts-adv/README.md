# SalesPulse: advanced TypeScript and typed Redux

**Day 19 project (part B):** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** TypeScript 5.9 (strict + `noUncheckedIndexedAccess`), React 19, **Redux Toolkit 2 + react-redux 9**, Vite, Recharts 3, Vitest, Testing Library, Playwright, oxlint
**Starting point:** Day 18 `salespulse-ts` (copied; Day 18 stays untouched). Same UI, same tests. What changed is *where state lives* and how precisely it is typed.
**Part A:** the advanced-TypeScript workbook (utility types, generics, React patterns, Redux, async, context, `.d.ts`, guards) is in [`../ts-advanced`](../ts-advanced/README.md).
**PRD:** [`../Day19_PRD.md`](../Day19_PRD.md)

## Run

```bash
cd Day-19/salespulse-ts-adv
npm install
npm run dev            # http://localhost:5173   (?fail=1 shows the error banner; VITE_API_DELAY_MS=2000 slows the API)
npm run typecheck      # tsc: strict, zero errors
npm run lint
npm test               # 94 unit and component tests
npm run test:e2e       # 27 browser tests (Chrome), including axe WCAG 2.1 AA, unchanged from Day 18
npm run escapes        # counts any / type assertions / @ts- comments in src/ (fails on any `any`)
npm run errors         # regenerates compile-errors.md (19 mistakes the compiler rejects)
npm run build
```

## What Day 19 changed in this app

```
src/store/
  index.ts            setupStore(api) -> RootState, AppStore, AppDispatch   (all INFERRED)
  filtersSlice.ts     period, region, category      createSlice + PayloadAction<T>
  dashboardSlice.ts   data + request state          createAsyncThunk<Returned, Arg, { extra, rejectValue }>
  selectors.ts        createSelector, memoized      one DashboardStatus union
  hooks.ts            useAppDispatch / useAppSelector / useAppStore   via .withTypes<>()
src/api/
  errors.ts           ApiError (discriminated `kind`), toFailure(unknown)
  httpApi.ts          the same DashboardApi over fetch, response validated by guards
src/components/Text.tsx        polymorphic component (`as`, ref as a prop)
src/lib/exhaustive.ts          assertNever
src/lib/ranges.ts              RANGES as const -> Range
src/declarations/              env.d.ts, globals.d.ts
```

`DashboardProvider` is now a bridge: it builds a store, dispatches `fetchDashboard`, and publishes the **same** `DashboardValue` as on Day 18, so none of the five screens changed. Theme and toasts stay in Context on purpose: they are UI chrome, not shared data.

## The brief, item by item

| Day 19 task | Where it is in this app |
|---|---|
| **Partial** | `FiltersPatch = Partial<Filters>`; the `filtersPatched` action |
| **Required** | workbook 01 (the app has no use that is not forced) |
| **Readonly** | `readonly Product[]` / `readonly Score[]` in `DashboardValue`; `DeepReadonly<T>` in `types.ts` |
| **Pick / Omit** | `ProductPoint`, `ProductDraft`; `DashboardActions = Pick<DashboardValue, ...>` and `DashboardView = Omit<DashboardValue, keyof DashboardActions>` |
| **Record** | `PerRegion<V> = Record<Region, V>`; `REGION_SIZE: Record<Region, number>` |
| **Exclude / Extract** | `ConcreteFilterValue`, `AllOption`, `ErrorStatus = Extract<DashboardStatus, { kind: 'error' }>` |
| Generic constraints | `sum<T>(rows, key)`, `createStrictContext<T>`, `fetchJson<T>(url, guard)` |
| Mapped types | `FilterChange = { [K in FilterKey]: { key: K; value: Filters[K] } }[FilterKey]` |
| Template literal types | `SliceActionType<'filters', 'filterChanged'>` = `'filters/filterChanged'` |
| Conditional types / `infer` | `DeepReadonly<T>`; `RootState = ReturnType<typeof rootReducer>` (`infer` inside `ReturnType`) |
| HOC / render props / compound / forwardRef | compound: `Tabs` (Day 18); polymorphic + ref prop: `Text`; the rest in the workbook (03) |
| Redux: actions, reducers, selectors | `store/` (table below) |
| `RootState` and `AppDispatch` | `store/index.ts` |
| Async, Promises, fetch, errors | `createAsyncThunk`, `api/httpApi.ts`, `api/errors.ts` |
| Context typing, undefined context | `createStrictContext`; `DashboardContext`, `ThemeContext`, `ToastContext` |
| `.d.ts`, augmenting, module declaration | `src/declarations/` (below) |
| Avoid `any`, `unknown`, guards, discriminated unions, exhaustive checks | `DashboardStatus` + `assertNever`; `httpApi.ts` guards; `npm run escapes` |
| Convert the Day 18 project | this folder |

## Redux, typed end to end

| Piece | How it is typed | Why it matters |
|---|---|---|
| State | `RootState = ReturnType<typeof rootReducer>` | Never written by hand: add a slice and the type follows |
| Dispatch | `AppDispatch = AppStore['dispatch']` | Includes the thunk overload, so `dispatch(fetchDashboard(...))` compiles |
| Hooks | `useDispatch.withTypes<AppDispatch>()`, `useSelector.withTypes<RootState>()` | Components annotate nothing and still get full checking |
| Actions | `PayloadAction<Range>`, `PayloadAction<FilterChange>` | `filterChanged({ key: 'region', value: 'Hardware' })` does not compile |
| Reducer | `switch (change.key)` with `assertNever` in `default` | Add a filter and the reducer stops compiling until it handles it |
| Thunk | `createAsyncThunk<DashboardResponse, DashboardParams, { extra: ThunkExtra; rejectValue: ApiFailure }>` | `fulfilled.payload`, `rejected.payload` and the injected `api` are all typed |
| Selectors | `createSelector([...inputs], combiner)` | Inferred, memoized; test proves the series is reused when nothing relevant changed |
| Errors | `catch (reason: unknown)` -> `toFailure(reason)` -> plain `ApiFailure` | Redux state holds data, never an `Error` instance |

## Examples from the code

**One mapped type removes a whole class of mismatched pairs.**

```ts
export type FilterChange = { [K in FilterKey]: { key: K; value: Filters[K] } }[FilterKey];
// = { key: 'region'; value: WithAll<Region> } | { key: 'category'; value: WithAll<Category> }
```

**Four booleans become one union.** `loading`, `refreshing`, `error`, `ready` can be combined 16 ways, most impossible. `DashboardStatus` has four members. `FilterBar` handles them with a `switch` whose `default` calls `assertNever(status)`, so adding a fifth kind is a compile error until every `switch` handles it.

**Never cast a response.** `response.json()` is `any`. `fetchJson<T>` takes it as `unknown`, runs a guard, and only a value the guard accepted is returned as `T`. A wrong shape becomes `ApiError('shape')`, tested.

**Polymorphic component.** `<Text as="h3" id="x">` is valid; `<Text as="h3" href="/x">` is a compile error because an `<h3>` has no `href` (in `compile-errors.md`).

## Declaration files

| File | Kind | Does |
|---|---|---|
| `src/vite-env.d.ts` | triple-slash reference | pulls in Vite's own types (`import.meta.env`, asset imports) |
| `src/declarations/env.d.ts` | **augmenting a third-party interface** | merges `VITE_API_DELAY_MS` into Vite's `ImportMetaEnv`, so `import.meta.env.VITE_API_DELAY_MS` is typed (and optional: env values can be absent) |
| `src/declarations/globals.d.ts` | **ambient declaration** | `declare const __APP_VERSION__: string` for the constant Vite substitutes at build time (`define` in the Vite and Vitest configs) |

## Escape hatches (the honest count)

`npm run escapes`: **0** `any`, **0** non-null `!`, **0** `@ts-ignore`, **1** type assertion, unchanged from Day 18: `Object.fromEntries(...) as Record<K, V>` in `src/lib/typed.ts`, where TypeScript cannot know the keys are exactly `names`. Day 19 added no new assertion: the guards in `httpApi.ts` and `Text.tsx` are written so none is needed (`Text` types `Component` as `ElementType` instead of casting).

## Things the types forced

- `Range` had to leave the context file: the store needs it, and the context imports the store (a cycle). It now lives in `lib/ranges.ts`, derived from `RANGES as const`; the context re-exports it so no import elsewhere changed.
- `DashboardValue` moved into `types.ts` for the same reason, which also made `DashboardActions` and `DashboardView` (built from it with `Pick` / `Omit`) possible without a cycle.
- `exactOptionalPropertyTypes` is off, so `{ signal: undefined }` is a legal `RequestOptions`; `fetchJson` and `setupStore` still build their optional parts conditionally, so they stay correct if it is turned on later.

## Tests

94 unit and component tests (67 from Day 18 unchanged, 27 new: slices, thunk, abort, memoization, selectors, guards, `fetchJson`, `createHttpApi`, `Text`, and type-level checks with `expectTypeOf` and `@ts-expect-error`) and 27 browser tests, all passing. `npm run errors` records the compiler message for each of the 19 mistakes in [`compile-errors.md`](compile-errors.md).

## Limits and differences from the plan

- **Toasts and theme are still Context.** Moving toasts into Redux would have required the store above `ToastProvider` and rewritten the toast tests for no new typing lesson. Redux holds the shared data (filters, fetched data); Context holds UI chrome.
- **`httpApi.ts` is not used by the running app**: there is no server. It is tested with a fake `fetch`.
- **`immutableCheck` and `serializableCheck` are off** in `setupStore`: the store holds about 1,800 rows of generated data and the dev-time checks would walk them on every action. Immer still freezes state.
- **HOC, render props, `forwardRef` and the other React patterns live in the workbook**, not in the dashboard: this app has no place where a HOC would be the natural design, and adding one only to tick a box would make the code worse.
- **Branded types** (`MonthKey` as a string with a brand) are in the workbook only: applying them here would touch every generator and test for little gain.
