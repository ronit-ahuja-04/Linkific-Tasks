# PRD: Intern Quest that fails well. CORS, error handling and debugging (Day 23)

| Field     | Value |
| --------- | ----- |
| Owner     | Ronit Ahuja |
| Programme | Linkific internship, Month 1 (training phase), Day 23 |
| Repo path | `Linkific-Tasks/Day-23/intern-quest` (a copy of `Day-21/intern-quest`) and `Day-23/quest-card-embed` |
| Status    | **Built.** PRs #115 to #119, plus the documentation PR |
| Companion | the project README (error-handling strategy), `docs/ERROR_INVENTORY.md`, `docs/CORS.md`, `docs/DEBUGGING.md` |

## 1. Summary

Take a real app and make it **fail well**: every request that can go wrong has a loading state, a clear error and a way to recover; a crash in one part does not take down the rest; CORS is configured for a real cross-origin client and explained; debugging is written down with real cases. The app is **Intern Quest** (Day 21: Next.js 16, NextAuth v5, Supabase, live on Vercel). The work started with a **measured inventory** of what failed and how (33 scenarios against a production build), and ends with the same inventory showing what changed.

## 2. Goals and non-goals

**Goals**
- No failure leaves a person stuck, uninformed or misled: a message that says what happened and what to do, a working button, nothing typed lost.
- One error model across the app; one log line per error, findable from the reference a user sees.
- Every async operation has a loading state; no blank screens.
- Error boundaries at the right levels (section, page, app, document), and designed 404 and error pages.
- CORS configured and documented for a real second origin, without opening the signed-in API.
- Evidence a reviewer can re-run: the inventory, tests through a real database fault, captured HTTP exchanges.

**Non-goals**
- New game features, schema changes.
- A third-party error tracker (Sentry): structured logs were chosen (decision below).
- Offline *writing* (a queue that syncs later): offline is detected and explained, and drafts are kept, but nothing is sent until the connection returns.

## 3. Decisions

| Decision | Choice | Why |
|---|---|---|
| Which app | Intern Quest (Day 21), copied to Day 23 | a deployed Next.js app with real API routes, auth and a database; Next 16 has its own boundary model to learn |
| Evidence first | an automated inventory (Playwright + a database fault proxy), before and after | "error handling" becomes a table of facts; the same script measures the result |
| Error reporting | structured JSON log lines (`onRequestError`, `/api/client-errors`), searchable in Vercel by request id or digest | no new table, no production migration, no third-party account |
| Retries | in ONE layer only: the browser retries reads (2×, jittered backoff); writes never automatically; server-side retries turned off | postgrest-js's own retries made an outage take ~10 s; two layers multiply attempts |
| Deadlines | 15 s in the browser, 5 s per database request on the server | the server normally answers first, with a 503 that explains itself |
| Shell | moved into `app/(game)/layout.tsx`, needing no database; "My sheet" goes through `/me` | a failed page keeps its navigation; a layout does not re-render on navigation, so DB data there goes stale |
| CORS | a public read-only card API with an exact-origin allowlist; the signed-in API stays same-origin | a real cross-origin use, with nothing private exposed and no credentials |
| Forged writes | refuse any API write whose `Origin` is not our own | CORS hides answers but does not stop "simple" requests (found while building the lab) |
| Second origin | a tiny static site with a live CORS lab | CORS only exists between origins; the lab shows each case in a real browser |
| Deployment | the existing Vercel project points at `Day-23/intern-quest` | the same URL and variables; production checks of CORS and errors |

## 4. Requirements and verification

| # | Requirement | Verified by |
|---|---|---|
| R1 | No failed request leaves a button stuck; each ends with a message for people | inventory C1 to C8 (after); `e2e/resilience.spec.ts` |
| R2 | Requests have deadlines (15 s browser, 5 s database) | unit (`api-client`, `withDeadline`); e2e with Playwright's clock; `e2e/faults.spec.ts` (slow database) |
| R3 | API errors are JSON with a request id: 503 + Retry-After for outages, 500 for bugs, 404 for unknown endpoints | unit (`withErrors`); integration (`test/api/errors.test.ts`); inventory S8, S9, N7 |
| R4 | Every server error is one log line with the request id and the digest shown to the user | inventory server log; unit (`errorLine`) |
| R5 | A failing page keeps the navigation; a failing section keeps the page; Try again recovers | `e2e/faults.spec.ts` with the real database failing |
| R6 | Offline: a banner, links do not drop the app, forms (incl. sign-in) keep their content | e2e (offline banner, C9, C1) |
| R7 | Every page has a skeleton loading state; no blank screen | e2e (slow database), inventory S12; axe on the skeleton |
| R8 | Background results are toasts, announced by always-present live regions | unit (toast store); e2e (live regions) |
| R9 | CORS: only listed origins read `/api/public/*`; preflights answered; `Vary: Origin`; no credentials; signed-in API has none | unit (`cors.test.ts`); `e2e/cors.spec.ts`; captured exchanges in `docs/CORS.md`; production check |
| R10 | API writes from another origin are refused | unit; e2e (a forged quest is not saved) |
| R11 | All Day 21 behaviour still works | Day 21's tests pass (selectors changed only where the markup did) |

## 5. Milestones

| # | Milestone | PR |
|---|---|---|
| M1 | Baseline: copy, the error inventory (33 scenarios, fault proxy), findings E-1 to E-13 | #115 |
| M2 | Error foundation: error model, `apiFetch`, `withErrors`, database deadline, structured logs, global listeners | #116 |
| M3 | Boundaries and pages: shell in a layout, `error.tsx` per segment, `global-error.tsx`, section boundaries, offline, session recovery | #117 |
| M4 | Loading and feedback: skeletons, parallel reads, busy buttons, optimistic notes, toasts, copy review | #118 |
| M5 | CORS: public card API, allowlist, preflights, forged-write check (E-14), embed site and lab, `CORS.md` | #119 |
| M6 | Debugging guide, README strategy, PRD, final inventory, deployment and production checks | this PR |

## 6. Risks and what happened

| Risk | What happened |
|---|---|
| Error handling judged by opinion | the inventory measured 33 cases before and after; each finding has rows and screenshots |
| Testing real failures needs test hooks in the app | none were added: faults come from Playwright and a proxy in front of Supabase |
| Pages that fail still answer 200 | a documented limit of streaming with Cache Components (E-6); `noindex` is added, the API is unaffected |
| A boundary hides a successful save | found (E-4): the reward screen's chunk failed after the save; a dedicated boundary now says it was saved |
| CORS opened too wide | exact origins only, refused `*` at start-up, nothing private on the public API; a forged-write hole found and closed |
| Flaky tests from parallel runs | two tests relied on the guild feed's order; they now find items by their own text; suites run twice for stability |

## 7. Open items

- Offline writing (queue and sync later) is out of scope; today nothing is sent while offline, and that is said plainly.
- `global-error.tsx` has no automated test (the root layout reads no data, so it can not be made to fail realistically).
- Rate limiting of `/api/client-errors` is per server instance (in memory).
- The guild feed re-renders every item on each keystroke in a note box (see DEBUGGING.md, section 6); fine at today's size.
- Browser tests run in Chrome only.
