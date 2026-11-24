# Day 23 Plan: CORS, error handling and debugging

**Intern:** Ronit Ahuja · **Programme:** Linkific Month 1 (training), Day 23
**App:** Intern Quest (Day 21: Next.js 16.4.6, React 19.3, NextAuth v5, Supabase, live on Vercel), chosen 24 Nov
**Status:** Plan agreed 24 Nov. Building starts when Ronit says "start m1".

---

## 1. What Day 23 asks for, reduced

> Make a real app **fail well**. Every request that can go wrong has a loading state, a clear error and a way to recover. A crash in one part must not blank the app. Understand CORS well enough to configure it and explain it, and debug with the browser's and the server's tools.

Deliverables: comprehensive error handling, an Error Boundary, CORS configured and documented, loading states for every async operation, network error handling, 404 and error pages, toasts for errors, and a README with the error-handling strategy.

## 2. Where Intern Quest stands today (checked)

| Area | Today | Effect |
|---|---|---|
| Error boundaries | No `error.tsx` or `global-error.tsx` anywhere | A database hiccup on any page shows Next's bare "Application error" screen |
| Client requests | 3 raw `fetch` calls (quest editor, character editor, guild feed), no `try/catch`, no timeout | Offline or a dropped connection: the promise rejects, `busy` never resets, the button **stays disabled forever**, and the error goes unhandled |
| Loading | No `loading.tsx`; every Suspense fallback is an **empty coloured div** | Each page blanks out while it loads |
| Feedback | No toasts; inline `role="alert"` messages in forms | Background failures (a guild note, a badge) have nowhere to go |
| 404 | A designed `not-found.tsx` (Pip, worried) | Good; per-record 404s need checking |
| API errors | One shape: `{ error, fields? }`; DB errors mapped to 409 or 400; anything else is rethrown | An unexpected error returns Next's **HTML** 500, not JSON |
| Tracing | The proxy sets `x-request-id` on every response and logs one JSON line | A ready-made error id, never shown to the user yet |
| CORS | None: the API is same-origin only | Nothing for another site to call yet |

## 3. Error handling: the architecture

**Server side (Next.js App Router):**
- **Route segment boundaries.** `error.tsx` for `(game)`, `(auth)` and `c/[handle]`: Pip looks worried, says what happened, and offers **Try again** (re-fetches with `router.refresh()` plus `reset()`) and **Back to my journal**. The app shell and navigation stay up while one page fails.
- **`global-error.tsx`** for a failure in the root layout itself. It has its own `<html>` and minimal styles, because the layout's CSS may be what failed.
- **Error ids.** Production hides server error messages and gives a `digest` instead. The error page shows the digest, and the server logs it together with the request id, so a screenshot from a user leads to the exact log line.
- **API routes.** A `withErrors()` wrapper turns any unexpected throw into JSON `{ error, requestId }` with a 500, logged once. The client never has to parse HTML. A database that can't be reached becomes a **503** "try again in a moment".
- **`instrumentation.ts` `onRequestError`.** This is Next's official hook for every server error (pages, route handlers, server actions). It writes one structured log line that Vercel's logs can search.
- **Per-record 404s.** A journal entry that doesn't exist, or isn't yours, calls `notFound()` (already the API's rule).

**Client side:**
- **One `apiFetch` helper.** Every call gets a **timeout** (`AbortSignal.timeout`), JSON parsing of the `{error, fields}` shape, and one **error model with a kind**: `offline`, `network`, `timeout`, `validation` (400, with fields), `unauthorized` (401), `forbidden` (403), `notFound` (404), `conflict` (409), `server` (5xx), `unknown`.
  - Each kind has a user message, a `retryable` flag and the request id.
  - **GETs retry** twice with backoff and jitter, only for `network`, `timeout` and 5xx. **Writes never retry by themselves.**
  - It replaces the three raw `fetch` calls, which fixes the stuck buttons. `busy` always resets in `finally`.
- **401 mid-session.** "Your session ended": sign in again and come back to the same page, with nothing silently lost.
- **Offline.** A banner while offline and "Back online" when it returns. Saving while offline is refused clearly, and the quest draft stays in the form.
- **Client boundaries for widgets.** The reward overlay and the guild feed each sit in their own boundary, so a crash there doesn't take the page with it. A **lazy-chunk failure** (a new deploy while the tab is open) shows "Intern Quest was updated, reload".
- **Global handlers.** `error` and `unhandledrejection` catch what boundaries can't (event handlers, async code), report it and show a toast.
- **Reporting.** Client errors are sent to `POST /api/client-errors` with a size limit and rate limiting, where they land in the same structured log. See decision 3.

## 4. Loading and feedback

| Pattern | Where |
|---|---|
| **Skeletons** | `loading.tsx` and the Suspense fallbacks become shaped skeletons: journal list, quest page, character sheet, guild hall, public sheet. No more blank coloured divs. |
| **Streaming** | The public pages already stream with Cache Components. Slow sections (guild feed, badges) stream behind their own skeleton, so the page shell appears first. |
| **Button states** | "Saving...", "Publishing...", "Deleting..." on the busy button (`aria-disabled`, so focus isn't lost: a Day 22 lesson). |
| **Optimistic UI** | Guild notes appear at once as "sending" (`useOptimistic`), then sent or "failed, retry". Mentor badges the same way. |
| **Toasts** | A small toast system with always-present polite and assertive live regions (Day 22). Toasts for background results and failures. **Inline** messages for forms and anything tied to a place. The rules go in the README. |
| **Messages** | What happened, why if known, and what to do next. No raw database text and no stack traces. Every error message gets a copy review. |

## 5. CORS: what we build to really understand it

The app's API is same-origin today, so CORS never comes up. To configure it for real, something on **another origin** has to call it.

**Recommended: a public "quest card" API and a tiny embed site.**
- **The API.** `GET /api/public/characters/:handle`, a read-only JSON card for public characters (level, title, class, top skills, Pip's stage). It is data that is already public on `/@handle`.
- **The CORS layer, in `proxy.ts`.**
  - Applies only to `/api/public/*`.
  - Uses an **allowlist from an environment variable**, `CORS_ALLOWED_ORIGINS`, different in dev and production. Never `*`.
  - Answers the **preflight `OPTIONS`** itself (204, allowed methods and headers, `Max-Age`).
  - Sends `Vary: Origin`.
  - **No credentials:** the card is public, so cookies are never needed.
- **Every other API route gets no CORS headers at all, on purpose.** They use the session cookie, and allowing another origin with credentials would hand it a CSRF door. The doc explains why, and why Next's server actions check `Origin` themselves.
- **The embed site,** `Day-23/quest-card-embed`: a static page served on a second origin (`localhost:4000`). It shows a character card, plus a **CORS lab** with live cases:
  1. **A simple GET** from an allowed origin: works, and the response headers are shown.
  2. **A preflighted request** (a custom header): the `OPTIONS` and then the GET, as seen in the Network tab.
  3. **From a non-allowed origin** (the same page on `127.0.0.1:4000`, a different origin than `localhost:4000`): blocked. The lab shows that the request *reached* the server, but the browser hid the answer.
  4. **With `credentials: 'include'`:** refused. The doc explains why `*` and credentials can't be combined, and the difference between same-*site* and same-*origin* (`localhost:4000` and `:3000` are the same site but different origins).
  5. **A private route** (`/api/quests`) from the embed: blocked, as intended.
- **Development workaround, explained not used:** a dev proxy (Next `rewrites`, or Vite's `server.proxy`) makes calls same-origin. It's fine for local work, but in production it moves the problem rather than solving it.
- **`CORS.md`:** the same-origin policy, simple vs preflighted requests, every header we send and why, real Network-tab captures from local **and** production, and common mistakes (`*` with credentials, a missing `Vary`, "fixing" CORS on the client, trusting CORS as security).

**Alternative:** full CORS on the private API, with credentials for a separate frontend app. It teaches more about credentials, but it's riskier and needs CSRF protection on every write.

## 6. Debugging (deliverable: `DEBUGGING.md`, with real examples)

Each tool gets a real bug from this repository and a short "try it":
- **Network tab:**
  - the stuck "Saving..." button (offline, before and after the fix);
  - a CORS preflight;
  - throttling to Slow 4G to see the skeletons;
  - finding an error by its `x-request-id`.
- **Console:** log levels, `console.table`, grouping, and **where a log appears in Next.js**: Server Components and route handlers log to the terminal or Vercel, Client Components to the browser.
- **Server debugging:** `NODE_OPTIONS=--inspect next dev` with Chrome DevTools for Node, and breakpoints in a route handler.
- **Breakpoints in the browser:** line, conditional, fetch/XHR, event-listener and DOM-change breakpoints, and the `debugger` statement.
- **React DevTools:** props and state of the quest editor, and the Profiler on the guild feed.
- **Production:** browser source maps (`productionBrowserSourceMaps`) to read a production stack trace as source, and Vercel's logs searched by request id or digest.
- **Bugs from earlier days:**
  - the Day 21 proxy that signed people back in, found by tests under load;
  - Day 22's "Cannot coerce" error from a deleted account.

## 7. Milestones

| # | Milestone | Content | Done when |
|---|---|---|---|
| M1 | Baseline | Copy to `Day-23/intern-quest`. **Error inventory:** every async operation, and what happens today when it is slow, offline, a 500, a 401 or a 404, measured with Playwright (`page.route`, `context.setOffline`) and test-only fault injection. | inventory table with evidence; Day 21's tests pass on the copy |
| M2 | Error foundation | `apiFetch` and the error model, timeouts, GET retries, `withErrors` for API routes (JSON 500/503), `onRequestError`, `/api/client-errors`, global handlers | unit tests for every kind; API tests for the JSON 500 |
| M3 | Boundaries and pages | `error.tsx` per segment, `global-error.tsx`, widget boundaries, chunk-failure reload, per-record 404s, offline banner, 401 recovery | e2e: a failing page keeps the shell; offline save is refused and keeps the draft |
| M4 | Loading and feedback | skeletons, toasts with live regions, optimistic guild notes and badges, busy-button states, copy review | e2e with slow and failing routes: no blank screens, no stuck buttons, no raw errors; axe clean |
| M5 | CORS | the public card API, the proxy CORS layer with an env allowlist, the embed site and CORS lab, `CORS.md` | e2e from a second origin: allowed works, preflight answered, other origin blocked, credentials refused, private routes blocked |
| M6 | Debugging, docs, deploy | `DEBUGGING.md`, README error-handling strategy, PRD; production checks (CORS headers, error page, logs by request id); report, PDF, standup | deliverables checklist complete |

**Rough effort:** about 8 hours (M1 0.75 · M2 1.5 · M3 1.5 · M4 1.25 · M5 1.5 · M6 1.5).
**Cut line:** keep M1 to M3, M5, and skeletons for the journal and guild. Optimistic badges, the React Profiler section and the chunk-failure handler go first.

**Fault injection stays out of production.** Test failures are injected by Playwright (`page.route`, offline) or by a header the server honours **only** when it is not the production deployment, using `deploymentMode()` from Day 21's env check. A unit test proves it is off in production.

**Local data:** the copy keeps `project_id = "intern-quest"`, so it shares Day 21's local Supabase stack (ports 55421 to 55429, not Huddle's). There's no reset without asking you first.

## 8. Decisions (made 24 Nov)

1. **Deploying:** the existing Vercel project is pointed at `Day-23/intern-quest` (same URL and env vars). Ronit adds `CORS_ALLOWED_ORIGINS` with `vercel env add`. The switch happens in M6, after the tests pass.
2. **CORS:** a public card API with a proxy allowlist, an embed site on a second origin, and a CORS lab. Private routes stay closed to other origins.
3. **Error reporting:** structured logs via `onRequestError` and `/api/client-errors`, searchable in Vercel by request id or digest. No new table.
4. **Documents:** as before. README, `CORS.md`, `DEBUGGING.md` and the PRD are committed; the report, PDF and standup script stay local.
