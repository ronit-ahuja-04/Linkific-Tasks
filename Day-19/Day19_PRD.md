# PRD: Advanced TypeScript and typed Redux (Day 19)

| Field     | Value                                                                      |
| --------- | -------------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                                |
| Programme | Linkific internship, Month 1 (training phase), Day 19                      |
| Repo path | `Linkific-Tasks/Day-19/ts-advanced` and `Day-19/salespulse-ts-adv`         |
| Builds on | Day 18 `salespulse-ts` (copied unchanged, then upgraded)                   |
| Status    | **Built.** App merged in PR #93; workbook and docs in the Day 19 PRs       |
| Companion | the two project READMEs                                                    |

## 1. Summary

Day 19 is advanced TypeScript: utility types, advanced generics, typed React patterns, typed Redux, async and error typing, typed Context, declaration files and type-safety practice. **A**, a workbook (`ts-advanced`) with one compiler-checked, tested file per topic. **B**, the Day 18 SalesPulse app upgraded: its state moved into a fully typed Redux Toolkit store, plus guards, a discriminated-union status, typed API errors, a polymorphic component and declaration files.

## 2. Goals and non-goals

- Cover every learning bullet with code the compiler checks and tests exercise.
- Redux typed completely (state, dispatch, hooks, actions, thunk, selectors) and wired into a real app.
- No behaviour change: Day 18's 67 unit and 27 browser tests pass unchanged.
- Non-goals: new UI features, runtime-validation libraries, replacing Context for theme and toasts.

## 3. Decisions

| Decision | Why |
|---|---|
| Redux in both the workbook and the app | The brief asks for Redux "typed completely" and for the Day 18 project to be converted; the app had no Redux. |
| `DashboardProvider` kept as a bridge over the store | Screens and tests keep using `useDashboard()`, so the migration cannot change behaviour. |
| Theme and toasts stay in Context | UI chrome, not shared data; the brief also asks for typed Context. |
| `RootState` and `AppDispatch` inferred, never hand-written | They cannot drift from the reducers. |
| Status as a discriminated union, checked with `assertNever` | Replaces four booleans that allowed 16 combinations. |
| Guards instead of casts for API data | `response.json()` is `any`; a cast is an unchecked promise. |
| Report, PDF and standup script kept local | Same as Days 16 and 18. |

## 4. Mapping the task list

| Task | Where |
|---|---|
| Utility types (Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract) | workbook 01; app `types.ts` |
| Generics: constraints, conditional, mapped, template literal, `infer` | workbook 02; app `FilterChange`, `DeepReadonly`, `SliceActionType` |
| HOC, render props, compound, polymorphic, forwardRef | workbook 03; app `Text`, `Tabs` |
| Redux typing | workbook 04; app `src/store/` |
| Async, Promises, axios, fetch, errors | workbook 05; app `api/httpApi.ts`, `api/errors.ts`, thunk |
| Context API | workbook 06; app contexts |
| Declaration files | workbook 07; app `src/declarations/` |
| Avoid `any`, `unknown`, guards, unions, exhaustive checks | workbook 08; app `DashboardStatus`, guards |
| Complex scenarios | workbook 09 |
| Convert the Day 18 project | `salespulse-ts-adv` |

## 5. Requirements and verification

| # | Requirement | Verified by |
|---|---|---|
| R1 | Every learning bullet has checked code | workbook: 97 tests, 70 compile-checked mistakes |
| R2 | Redux fully typed and wired in | app `src/store/`, 27 new tests |
| R3 | No new escape hatches in the app | `npm run escapes`: 0 `any`, 0 `!`, 1 assertion (unchanged from Day 18) |
| R4 | No behaviour change | 67 Day 18 unit tests and 27 browser tests (axe) pass unchanged |
| R5 | Strict typecheck, lint, build | `npm run typecheck`, `lint`, `build` green in both projects |
| R6 | Types reject real mistakes | app `compile-errors.md` (19 of 19); workbook `compile-errors.md` (70 of 70) |

## 6. Milestones

| # | Milestone | PR |
|---|---|---|
| A | Advanced TypeScript workbook | see the repository history |
| B | SalesPulse with typed Redux and advanced types | #93 |
| C | READMEs, PRD, root index | see the repository history |

## 7. Risks

| Risk | Handling |
|---|---|
| Moving state to Redux could change behaviour | Bridge provider; the unchanged Day 18 test suites are the guard |
| Redux dev checks slow down on 1,800 rows | Turned off, and documented |
| Type cycles between store and context | `Range` and `DashboardValue` moved into neutral files |
