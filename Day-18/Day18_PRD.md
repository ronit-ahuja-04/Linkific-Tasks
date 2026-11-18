# PRD: TypeScript for React (Day 18)

| Field     | Value                                                                     |
| --------- | ------------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                               |
| Programme | Linkific internship, Month 1 (training phase), Day 18                     |
| Repo path | `Linkific-Tasks/Day-18/ts-basics` and `Day-18/salespulse-ts`              |
| Builds on | Day 14 `salespulse` (copied unchanged, then migrated)                     |
| Status    | **Built.** Merged via PRs #86 to #91 and the documentation PR (section 6) |
| Companion | the two project READMEs                                                   |

## 1. Summary

Day 18 is TypeScript: the type system, and typing a React app. It is delivered in two parts. **A**, a workbook (`ts-basics`) with one file per topic, each checked by the compiler and by tests. **B**, a real app converted: SalesPulse (a Recharts dashboard from Day 14) migrated from JavaScript to strict TypeScript, with behaviour and tests unchanged.

## 2. Goals

- Cover every learning bullet with code that the compiler checks, not just notes.
- A fully typed React app: at least 10 typed components, interfaces for all props, typed state, hooks, contexts and API responses, no `any`.
- Keep the app working after every pull request, and prove nothing regressed.

Non-goals: new features, a different UI library, runtime validation libraries, Next.js (Days 19 to 21).

## 3. Decisions

| Decision | Why |
|---|---|
| SalesPulse as the app to convert | The right size for one day (19 components, 3 contexts, a data hook, a fake API) and it already has typed-API, context, hook and filter shapes. FlowLane (37 components, Redux, Firebase) is too big; a new Todo app shows no migration skill. |
| A workbook as well | It covers the "learn" bullets (unions, generics, `unknown`, `never`, interfaces, functions) with evidence. |
| `strict` plus `noUncheckedIndexedAccess` | The extra setting found 9 real unchecked reads in the app. |
| Migrate with `allowJs: true`, then turn it off | The build is green after every milestone. |
| Count the escape hatches with the real syntax tree | "No `any`" is checked by a script, not claimed. |
| Keep the dashboard's load-state flags | A discriminated union would have rewritten five screens and several tests for no new safety. |

## 4. Mapping the task list

| Task | Where |
|---|---|
| What and why TypeScript, static typing, compilation, `tsconfig.json` | `ts-basics/README.md` (with real compiled output and every option explained) |
| Basic types, unions, literals, aliases | workbook 01 to 03 |
| Interfaces, optional, readonly, extending, type vs interface | workbook 04 |
| Functions | workbook 05 |
| Generics | workbook 06; `createStrictContext<T>`, `simulateRequest<T>`, `Segmented<T>`, `ChartCard<Row>` in the app |
| TypeScript in React, `.js` to `.tsx`, `@types` packages | `salespulse-ts` (milestones M1 to M5) |
| Typed components, props, `children`, events, `useState`, `useRef`, context, hooks, API responses | the app; workbook 07 |
| Todo, typed form | workbook 07 |

## 5. Requirements and verification

| # | Requirement | Verified by |
|---|---|---|
| T1 | Every learning bullet has checked code | workbook: 35 tests, 30 compile-checked mistakes |
| T2 | All of `src/`, tests, e2e and configs are TypeScript | `find` finds no `.js` or `.jsx`; `allowJs: false` |
| T3 | Zero `any`, no `@ts-ignore`, one documented assertion | `npm run escapes` |
| T4 | Types reject real mistakes in this app's API | `compile-errors.md` (13 of 13) |
| T5 | No behaviour change | Day 14's 58 unit tests and 27 browser tests (with axe) pass unchanged |
| T6 | `tsc` clean in strict mode | `npm run typecheck` in both projects |

## 6. Milestones

| # | Milestone | PR |
| --- | --- | --- |
| A | TypeScript workbook | #86 |
| M1 | Tooling, `allowJs` on | #87 |
| M2 | Domain types, metrics, API, hook | #88 |
| M3 | Contexts and hooks | #89 |
| M4 | Components and screens | #90 |
| M5 | Tests, e2e, configs; strictest settings | #91 |
| M6 | README, PRD, escape-hatch and error scripts | see the repository history |

## 7. Risks

| Risk | Handling |
|---|---|
| Recharts' types are loose, which tempts `any` | Narrow from `unknown` with small guards, and say so in the README |
| `noUncheckedIndexedAccess` creates many fixes | Turned on last, after the app worked |
| Migrating tests delays the finish | Done as its own milestone; the cut line was to leave them as JavaScript |
