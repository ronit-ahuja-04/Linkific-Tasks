# Error inventory (Day 23, M1 baseline)

What Intern Quest does today when things go wrong, **measured** before any change.
The facts come from `npm run inventory`:
- it runs 33 failure scenarios against a production build;
- the generated table, with a screenshot for every row, is in [errors/before.md](errors/before.md);
- the same script runs again at the end of Day 23 and writes `errors/after.md`.

This page adds the judgement: what each result means for a user, and which milestone fixes it.

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
