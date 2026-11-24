# Error inventory (Day 23, M1 baseline)

What Intern Quest does today when things go wrong, **measured** before any change.
The facts come from `npm run inventory`:
- it runs 33 failure scenarios against a production build;
- the generated table, with a screenshot for every row, is in [errors/before.md](errors/before.md);
- the same script runs again at the end of Day 23 and writes `errors/after.md`.

This page adds the judgement: what each result means for a user, and which milestone fixes it.

## Result: every finding, before and after

The same 33 scenarios were run at the end of Day 23 against the final build. The generated table is [errors/after.md](errors/after.md); compare it row by row with [errors/before.md](errors/before.md).

| # | Finding | Status | After (rows) |
|---|---|---|---|
| E-1 | a failed request leaves the user stuck | fixed (M2) | C1–C8: a message every time, no button stuck |
| E-2 | no timeouts | fixed (M2) | C2: ends at 15 s; S13: the server answers 503 after 5 s |
| E-3 | one error replaces the whole app | fixed (M3) | S3–S7: the page fails inside the shell; C9: the form stays |
| E-4 | "couldn't load" after a successful save | fixed (M3) | C11: "Quest saved: +121 XP" |
| E-5 | cached public pages fail completely | fixed (M3) | S1: only the leaderboard fails |
| E-6 | error and not-found pages answer 200 | documented limit (M3) | S1–S7, N1, N2, N4: still 200, with `noindex`; the API is exact |
| E-7 | API errors not in the API's format | fixed (M2) | S8, S9: 503 JSON; N7: JSON 404 |
| E-8 | errors hard to trace | fixed (M2) | every error is one log line with the request id and digest |
| E-9 | blank screens while loading | fixed (M4) | S12: a skeleton at once; the heading after 3.4 s (was 6.4 s) |
| E-10 | session ended mid-form | fixed (M3) | C4: "Sign in again in a new tab"; the draft saves |
| E-11 | navigating offline drops the app | fixed (M3) | C10: the tab stays on the journal, a banner explains |
| E-12 | vague messages | fixed (M2, M4) | C3, S10, S11: messages per kind; sign-in says it's not the password |
| E-13 | console noise | fixed (M2) | 0 console errors from `/_vercel/*` (was 116) |
| E-14 | a forged cross-site write could be saved | fixed (M5) | `e2e/cors.spec.ts` |

## How the faults are made

None of them needs a change to the app.

| Where | How | Scenarios |
|---|---|---|
| Browser ↔ our API | Playwright: `context.setOffline`, a request that is never answered, a request answered with an HTML 500, cookies cleared mid-form, code chunks blocked | C1 to C11 |
| Our server ↔ Supabase | [`inventory/fault-proxy.mjs`](../inventory/fault-proxy.mjs): the app's `SUPABASE_URL` points at a small proxy, switched per scenario to *slow*, *unavailable* (PostgREST's real 503 body) or *down* (connection dropped) | S1 to S13 |
| Addresses | records and URLs that don't exist | N1 to N7 |
| Origins | the same server opened as `127.0.0.1:3131` calls `localhost:3131`: a different origin | X1, X2 |

Run it with `npm run db:start`, then `npm run inventory`. It takes about 5 minutes and uses ports 3131 and 55499. The throwaway `@test.invalid` account it creates is deleted at the end.

## Every async operation

| Kind | Operations | Loading state today | Error handling today |
|---|---|---|---|
| **Server-rendered pages** (database reads in Server Components, streamed) | `/` (guild board), `/c/[handle]` and `/@handle`, `/journal`, `/journal/new`, `/journal/[id]`, `/character`, `/guild`, the share image `opengraph-image`, `sitemap.xml` | Suspense fallbacks are **empty coloured `div`s** | No `error.tsx` or `global-error.tsx`: Next's built-in page. `notFound()` for missing records |
| **API route handlers** | `GET/POST /api/quests`, `GET/PUT/DELETE /api/quests/:id`, `GET/POST /api/quests/:id/notes`, `POST /api/badges`, `DELETE /api/badges/:id`, `GET/PUT /api/character`, `POST /api/mentor`, `POST /api/register`, NextAuth `/api/auth/*` | (no UI) | Validation → 400 with fields, duplicates → 409, missing → 404 JSON. **Anything unexpected is rethrown** |
| **Server actions** | `loginAction`, `registerAction`, `githubAction`, `signOutAction`, `redeemMentorAction` | `useActionState` pending text ("Signing in…") | `AuthError` → message; anything else, including a network failure, is thrown |
| **Client `fetch` calls** | quest editor: save (POST/PUT), delete; character editor: save; guild feed: add note, award badge | a `busy` flag on the button (editors only) | Checks `response.ok`. **No `try/catch`, no timeout** |
| **Lazy code** | `RewardOverlay` (`next/dynamic`), route chunks | none | none |

## Findings

Severity: **High** = the user is stuck, misled, or loses the app; **Medium** = the user recovers, but badly or without help; **Low** = rough edge.

| # | Sev. | Finding | Evidence | Fix in |
|---|---|---|---|---|
| E-1 | High | **A failed request leaves the user stuck.** The client `fetch` calls have no `try/catch`, so a network failure throws past the code that resets `busy`. "Saving…" stays forever, the delete dialog stays open with a disabled button, the error is uncaught, and **nothing is said**. In the guild hall a note or badge fails silently. | C1, C5, C6, C7, C8 | M2 (`apiFetch`, `finally`) |
| E-2 | High | **No timeouts anywhere.** A request that never answers spins forever. This holds both in the browser (C2: still "Saving…" after 15 s) and on the server: when the database doesn't answer, nothing gives up (S13: still saving after 20 s). | C2, S13 | M2 (client and database deadlines) |
| E-3 | High | **One error replaces the whole app.** There's no error boundary, so any server error on any page shows Next's generic, unbranded "This page couldn't load" page. It has no navigation, no explanation, only "Reload". The same page appears when sign-in fails offline (C9) or a code chunk fails to load (C11). | S1–S7, C9, C11 | M3 (`error.tsx` per segment, `global-error.tsx`) |
| E-4 | High | **"Couldn't load" after a successful save.** In C11 the quest **was saved** (the next scenario's form is for day 3), but the reward screen's code failed to load and the user saw a crash. A user would try again and get "You already logged day 2". This happens for real when a new version is deployed while a tab is open. | C11 | M3 (boundary around the reward screen, chunk-failure reload) |
| E-5 | Medium | **Cached public pages fail completely when the database is down.** The home page's hero and the public sheet are mostly static, but one failed read (the guild board) takes the whole page down. | S1, S2 | M3 (per-section boundaries) |
| E-6 | Medium | **Error and not-found pages answer HTTP 200.** The page streams, so the status is sent before the failing part renders. Not-found pages already carry `noindex` (Day 21). But a monitor, a crawler or a script sees "200 OK" for a server error. | S1–S7, N1, N2, N4 | M3: investigate. It may be a limit of streaming; to document if so |
| E-7 | Medium | **API errors are not in the API's own format.** An unexpected error answers **500 with an empty body** (S8, S9). A database outage is reported as 500 when it is really a temporary 503. An unknown `/api/...` address answers with the **HTML** not-found page (N7). Clients must guess. | S8, S9, N7 | M2 (`withErrors`, JSON 404 for `/api/*`) |
| E-8 | Medium | **Errors are hard to trace.** A page error shows the user a number (the digest), and the server log has it, but on a separate line several lines down, not linked to the request id. API errors have **no digest at all**, and the `x-request-id` the proxy already sets is never shown. | server log in [before.md](errors/before.md) | M2 (`onRequestError`, one structured line with digest and request id) |
| E-9 | Medium | **Blank screens while loading.** With 3 s per database query, the journal is a **plain purple screen** for the first seconds, and the heading appears after 6.4 s. The page reads the character first and only then the quests and badges, although they don't depend on each other. | S12 ([waiting](errors/before/S12-waiting.jpg)) | M4 (skeletons; one parallel read) |
| E-10 | Medium | **A session that ends mid-form.** The user sees "Sign in to do this." with no link. Signing in from another tab and coming back works (the draft is still there), but nothing says so. | C4 | M3 (401 recovery) |
| E-11 | Low | **Navigating while offline drops the app.** Next falls back to a full page load, which ends on Chrome's offline page (the dinosaur). | C10 | M3 (offline banner; links warn while offline) |
| E-12 | Low | **Vague messages.** "Something went wrong. Try again." is the same for our outage (S10) and a broken answer (C3). It gives no reference, and doesn't say whether the work was saved. | C3, S10, S11 | M2/M4 (messages per error kind) |
| E-13 | Low | **Console noise hides real errors.** Vercel Analytics and Speed Insights load `/_vercel/*` scripts, which exist only on Vercel. Locally every page logs two console errors (116 in this run). | before.md header | M2 (render them only on Vercel) |

## Progress

Re-running the same 33 scenarios after each milestone shows what changed; the final run is published as `errors/after.md`.

**After M2 (error foundation):** E-1, E-2, E-7, E-8 and E-13 are fixed. E-12 is fixed for everything that goes through the API.
- **C1 to C8:** every failed save, delete, note or badge now ends with a message, and the button works again. Nothing stays "Saving…".
- **C2 and S13:** a request that never answers stops after 15 s in the browser. A database that never answers stops after 5 s on the server, which answers 503 "can not reach its database… (ref c27688ad)".
- **S8, S9 and N7:** the API answers in its own JSON shape: a 503 with `Retry-After` for an outage, and a JSON 404 for unknown addresses.
- **Tracing:** the reference shown to the user ("ref 80defe78") and the digest on Next's error page ("ERROR 426751613") each lead to exactly one JSON line in the server log. That line has the request id, the route, the error kind and a short stack.
- **Speed:** the database scenarios run twice as fast (2.4 instead of 4.8 minutes), because postgrest-js no longer retries reads three times on the server.
- **Still open:**
  - pages (S1–S7), offline sign-in (C9) and the chunk failure (C11) still show Next's generic page, for M3;
  - blank loading screens (S12) are for M4.

**After M3 (boundaries and pages):** E-3, E-4, E-5, E-10 and E-11 are fixed; E-6 is explained below.
- **S3–S7, a page that fails:**
  - the failed page shows Pip, what happened, **Try again** (Next 16's `retry()`, which re-fetches the page), a way back, and the digest as the reference;
  - the **navigation stays and works**, because the shell moved into `app/(game)/layout.tsx` and needs no database.
- **S1, home page:** only the leaderboard section shows an error (`catchError` boundary). The hero, the steps and sign-in all stay.
- **S2, a public sheet:** a branded full-screen error with a way home, instead of Next's unbranded page.
- **C9, signing in offline:** the form stays and says "You are offline…". Before, the whole page was replaced.
- **C11, the reward screen's code fails after a save:** a dialog says "Quest saved: +121 XP", explains that Intern Quest was updated, and reports the error.
- **C10, offline:**
  - a banner says so;
  - links inside the app are stopped with a message, instead of landing on the browser's offline page;
  - "Back online." appears when the connection returns.
- **C4, a session that ended mid-form:** a "Sign in again in a new tab" link. The new sign-in's cookie applies to this tab too, so the same draft then saves.
- **S12:** while a slow page loads, the navigation is now visible instead of a blank screen. Skeletons for the content are M4.
- **E-6 is a documented limit, not a bug.** With Cache Components, Next.js sends the prerendered shell (with a `200`) before any request-time code runs. A `notFound()` or an error that happens later can't change the status any more. Next adds `<meta name="robots" content="noindex">` instead, and the error panel adds it too. Day 21 had already met this for unknown character sheets.
  - The **API is not streamed**, so every API answer has its true status.
  - The proxy could return a real 404 for addresses that can be judged without data. Here, every not-found case needs a database read.
  - Monitoring should therefore use the log lines, not page status codes.

**After M4 (loading and feedback):** E-9 and E-12 are fixed.
- **S12:** while a page loads, a **skeleton** in the page's own shape appears at once (it is part of the prerendered HTML), with one "Loading your journal…" status for screen readers. The journal also reads the character, quests and badges **at once**: with 3 s per query, its heading now appears after **3.4 s** instead of 6.4 s.
- **Busy buttons** say what they are doing ("Publishing…", "Saving draft…", "Deleting…", "Creating…"). They stay focusable (`aria-disabled`), and a second press is ignored.
- **Guild notes are optimistic:**
  - a note appears at once as "Sending…";
  - if it fails, it stays as "**Not sent**" with Retry and Discard (C7), so the text is never lost.
- **Toasts** carry background results: a note added or not sent, a badge awarded, an uncaught error. Error toasts stay until dismissed. Two live regions, polite and assertive, are always in the page.
- **Copy review:**
  - signing in during an outage now says the problem is ours, "not your password";
  - registering during an outage keeps the form, where before it showed the error screen.

**After M5 (CORS):** see [CORS.md](CORS.md).
- **Public card API:** `GET /api/public/characters/:handle` is readable from the origins in `CORS_ALLOWED_ORIGINS`, and from nowhere else.
- **Preflights** are answered in the proxy: 204 for a listed origin, 403 for any other.
- **The signed-in API** still sends no CORS headers (X1 and X2 are unchanged, on purpose).
- **A new finding while building the lab, E-14 (High), fixed in M5.**
  - **The problem:** a "simple" `text/plain` POST from another origin on the same *site* (e.g. `localhost:4000` → `localhost:3000`) is sent without a preflight and carries the session cookie, and `request.json()` parsed it anyway. It would have saved a quest in the user's name, while CORS only hid the answer.
  - **The fix:** the proxy now refuses every API write whose `Origin` isn't our own (403).
  - **Where it mattered:** in production, `SameSite=Lax` already kept the cookie off cross-site requests, and `vercel.app` is a public suffix (each app is its own site). So the risk was local, or for any future same-site subdomain.

## CORS today (X1, X2)

There is no CORS configuration, which is right for this API: every route uses the session cookie and is meant for this site only. What the browser does:

- **X1, a simple GET** from another origin: the **server answered** (401, with no `Access-Control-Allow-Origin`). The browser then **hid the answer**. The script only got `TypeError: Failed to fetch`, the **same error as being offline**, while the console said "blocked by CORS policy". A script can't tell CORS apart from a network failure: only the console and the Network tab can.
- **X2, a JSON POST:** a non-simple request, so the browser first sent a **preflight** `OPTIONS`. Next.js answered it automatically (204, `Allow: GET, HEAD, OPTIONS, POST`), but with no CORS headers, so the browser **never sent the POST**. Nothing reached the handler.

M5 adds a public, read-only card API with an origin allowlist. The private routes stay as they are.

## What already works (keep it)

- **Validation errors:** the API's field errors appear next to each field, and the fields clear as you fix them (Day 21 tests).
- **API not-found answers don't leak data:** a missing **or malformed** id gets a JSON 404, "No such quest." (N5, N6), and doesn't confirm that a private quest exists.
- **A branded not-found page** for unknown addresses and characters (N1–N4).
- **Sign-in messages:** "That email and password do not match." for wrong details. During an outage it says "Could not sign in. Try again." and doesn't blame the password (S11).
- **Drafts survive failures:** the quest form and the guild note box keep what was typed (C4, C7).
- **Request ids:** every response already has an `x-request-id`, and the proxy logs it. M2 builds on it.
