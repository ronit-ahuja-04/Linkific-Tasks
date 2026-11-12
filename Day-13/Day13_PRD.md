# PRD: DataDesk, a Lodash lab (Day 13)

| Field     | Value                                                              |
| --------- | ------------------------------------------------------------------ |
| Owner     | Ronit Ahuja                                                        |
| Programme | Linkific internship, Month 1 (training phase), Day 13              |
| Date      | Thursday, 12 November 2026                                         |
| Repo path | `Linkific-Tasks/Day-13/lodash-lab`                                 |
| Builds on | Day 12 patterns (Tabs, toasts, theme switch), new standalone app   |
| Status    | **Built.** Merged via PR #68.                               |
| Companion | `lodash-lab/README.md`, `LODASH_VS_NATIVE.md`                      |

---

## 1. Summary

Day 13 teaches Lodash: array, object, collection and string helpers, `debounce` and `throttle`, and how to import them without bloating a bundle. DataDesk is a data-heavy React app over 10,000 generated users that uses Lodash for real work (search, sort, group, deep-clone a form, safe nested reads) and also measures it against plain JavaScript.

## 2. Goals

- Demonstrate at least 10 Lodash methods; cover every method named in the task list.
- A debounced search input that visibly saves calls.
- Data-transformation examples (dashboard) and the four task-list scenarios: user list with sort/filter/group, dashboard, debounced search, complex nested form.
- A Lodash vs native performance comparison with honest conclusions.
- A README with Lodash use cases, and the import-style / tree-shaking trade-off with real sizes.

**Non-goals:** a backend, authentication, real data, mobile layouts, a state library.

## 3. Scope

In: six tabs (Directory, Dashboard, Search lab, Profile form, Methods, Benchmark), a seeded dataset, light/dark theme, toasts, tests. Out: persistence beyond the theme, i18n, Firebase.

## 4. Design

### 4.1 Mapping the task list

| Task list item | Where |
|---|---|
| `npm install lodash`; whole vs per-method import; tree-shaking | per-method imports everywhere; `npm run bundle-sizes`; README table |
| chunk, flatten, uniq, shuffle, sample, sortBy, groupBy | Methods tab; Directory (chunk, sample, shuffle, groupBy), Dashboard |
| pick, omit, merge, clone, cloneDeep, get, set | Methods tab; Profile form (cloneDeep, get, set, omit, merge, pick) |
| filter, map, find, reduce, every, some | Methods tab; Directory search (filter, every, some) |
| camelCase, kebabCase, capitalize, truncate | Methods tab; `src/lib/strings.js` |
| debounce, throttle, times, random | Search lab; Methods tab; dataset generator (`times`) |
| Search and filter a large dataset | Directory over 1k / 10k / 50k users with a prepared index |
| Debounced search input | Directory and Search lab |
| Deep clone complex state | Profile form draft |
| Group by category | Directory group view; Dashboard |
| Safely access nested properties | `get` / `has` panel in the Profile form |
| User list, dashboard, search, complex form | the four main tabs |
| Performance comparison | Benchmark tab, `npm run bench`, `LODASH_VS_NATIVE.md` |

### 4.2 Decisions

| Decision | Why |
|---|---|
| New app, not FlowLane | The task needs a large dataset; FlowLane has small per-project lists |
| Logic in pure functions (`src/lib`), UI on top | Testable without React; a native implementation can act as an oracle |
| Seeded generator for users | `random`, `sample`, `shuffle` cannot be seeded; fixed data makes tests and benchmarks repeatable |
| Per-method imports | The whole-library import costs about 28 kB gzipped for one function |
| Benchmarks must prove both sides return the same result | A benchmark of two different functions measures nothing |
| Median of many runs after warm-up | One slow run (garbage collection) should not decide a result |
| Honest comparison | Native often wins on simple work; the document says so |

## 5. Requirements

| # | Requirement | Verified by |
|---|---|---|
| R1 | At least 10 distinct Lodash methods | `npm run methods-used`: 68 |
| R2 | Search waits for a pause (300 ms) and shows N of M | unit and browser tests |
| R3 | Sorting is accessible (`aria-sort`, buttons) and supports several columns | tests |
| R4 | The form edits a deep copy; changes can be undone; invalid data cannot be saved | tests |
| R5 | The Methods tab shows Lodash result vs native result with a parity label | registry test: all matching natives agree |
| R6 | Benchmark results use the same data and compare equal results | benchmark parity tests |
| R7 | WCAG 2.1 AA in light and dark on every tab | axe tests |
| R8 | No console errors or warnings | every browser test fails on them |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | Data layer, six screens, tests, scripts, README, comparison | `day13/lodash-lab` | #68 |

## 7. Verification

| Layer | Result |
| ----- | ------ |
| Build and lint | `npm run build` passes; `npm run lint` reports nothing |
| Unit and component tests | 116 passing: libraries (with native oracles), the registry, benchmark parity, debounce and throttle with fake timers, and every screen |
| Browser end to end | 26 passing in Chrome against both the dev server and the production bundle |
| Accessibility | axe-core WCAG 2.1 AA: zero violations on 6 tabs in light and dark |

Problems found by the tests: the generator produced users with a single skill (`uniq` over a fixed number of random draws), and `highlightParts` could not highlight accented names; both fixed. Browser tests also found a missing favicon (a 404 console error) and scrollable tables that keyboard users could not reach; both fixed.

**Not covered:** browsers other than Chrome, phone-sized screens, and benchmark runs in browsers other than Chrome and Node.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Benchmark numbers vary by machine | Median of runs, parity checks, wording that stresses the shape, not exact values |
| 100,000-user benchmark freezes the page | Runs suite by suite, yielding between suites, with Cancel; deep copies skipped above 20,000 |
| Stale callbacks in debounced hooks | The debounced function calls the latest callback through a holder; tested |

## 9. Deliverables

- React app using Lodash (`Day-13/lodash-lab`)
- 50 methods in the gallery, 68 imported in total
- Debounced search implementation
- Data transformation examples (dashboard)
- Performance comparison, Lodash vs native (`LODASH_VS_NATIVE.md` and the Benchmark tab)
- README with Lodash use cases
