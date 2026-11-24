# Intern Quest

**Your internship logbook as a role-playing game.** Every day you log is a *quest*: it gives XP to the skills you used, your character levels up and earns badges, mentors act as guild masters, and **Pip**, your sidekick, reacts to everything you log.

**Live:** https://intern-quest-smoky.vercel.app · **Author:** Ronit Ahuja
**Projects:** built on Day 21 (Next.js, NextAuth, deployment); made to **fail well** on Day 23 (CORS, error handling, debugging)
**Stack:** Next.js 16.4.6 (App Router, Cache Components, Turbopack), React 19.3, TypeScript (strict), NextAuth v5 (Auth.js, beta), Supabase Postgres, Motion, Vercel; Vitest, Playwright, axe
**Docs:**
- Day 23: [Error inventory](docs/ERROR_INVENTORY.md) · [CORS](docs/CORS.md) · [Debugging guide](docs/DEBUGGING.md) · [PRD](../Day23_PRD.md)
- Day 21: [Deployment guide](docs/DEPLOYMENT.md) · [Bundle measurements](docs/bundle-measurements.md) · [PRD](../../Day-21/Day21_PRD.md)

---

## Day 23: an app that fails well

Day 21 built Intern Quest for the happy path. Day 23 **measured** what happens when things go wrong, using an automated inventory of 33 failure scenarios against a production build ([ERROR_INVENTORY.md](docs/ERROR_INVENTORY.md)), and then fixed each finding. The same script, run again at the end, gives the "after" column:

| When… | Before (Day 21) | After (Day 23) |
|---|---|---|
| saving while offline | "Saving…" forever, error uncaught | "You are offline. Nothing was sent…", button works, the draft is kept |
| the server never answers | spins forever | ends at a deadline (15 s browser, 5 s database) with a message |
| the database is down, on a page | Next's unbranded "This page couldn't load", whole app gone | the page shows Pip, what happened, **Try again** and a reference; navigation stays |
| the database is down, on the home page | whole page gone | only the leaderboard says so |
| the database is down, in the API | `500` with an **empty body** | `503` JSON, `Retry-After`, the request id |
| a new version is deployed mid-session | a "crash" right after a **successful** save | "Quest saved: +121 XP", explained |
| a page is loading | a blank coloured screen | a skeleton in the page's shape, at once |
| a mentor's note fails | nothing at all | "Not sent" in the list, with Retry; a toast says why |
| a user reports an error | nothing to go on | a reference that leads to one log line |
| another site reads the API | impossible (and private routes stay so) | a public card API, for listed origins only |

## Run it locally

Needs Node 22+ and Docker (for the local Supabase stack).

```bash
cd Day-23/intern-quest
npm install
npm run db:start      # local Postgres + API in Docker (ports 55421-55429), with the schema and demo data
npm run env:local     # writes .env.local for the local stack (a fresh AUTH_SECRET, and CORS_ALLOWED_ORIGINS)
npm run dev           # http://localhost:3000
```

The CORS demo needs a second origin: run `node server.mjs` in [`../quest-card-embed`](../quest-card-embed), then open http://localhost:4000. The lab is at `/lab.html`.

Demo accounts (local only): `ronit@example.com` (your real 20 days), `ada@example.com`, `grace@example.com`, and the mentor `mentor@example.com`. Password `demo-password-123`. Mentor invite code: `demo-mentor`.

| Command | What it does |
|---|---|
| `npm run typecheck` | `next typegen` + `tsc` (strict, no `any`) |
| `npm run lint` | ESLint (Next.js rules) |
| `npm test` | 151 unit tests: the game rules, validation, the environment check, the error model, `apiFetch`, CORS rules, toasts |
| `npm run test:integration` | 68 tests against the local database: the schema, the SQL XP views, every API route handler, JSON errors, `/api/client-errors` |
| `npm run test:e2e` | 74 browser tests against a **production build**, including axe, failures replayed in the browser, the **real database failing** (through a fault proxy), and CORS from a second origin |
| `npm run inventory` | the error inventory: 33 failure scenarios, written to `docs/errors/<label>.md` with screenshots (about 3 minutes) |
| `npm run db:types` | regenerate `src/lib/server/database.types.ts` from the schema |
| `node scripts/measure-js.mjs` | JavaScript per page (needs a production server on :3122) |

## The Day 23 brief, item by item

| Brief | Where |
|---|---|
| **CORS**: same-origin policy, preflight, headers, credentials, solutions (server config, dev proxy), environment-based URLs | [docs/CORS.md](docs/CORS.md); `src/lib/cors.ts`, `src/proxy.ts`; `CORS_ALLOWED_ORIGINS` per environment; the [embed site and lab](../quest-card-embed) |
| **Error handling**: try/catch, async errors, boundaries, global handlers, reporting | [the strategy below](#error-handling-strategy); `src/lib/errors.ts`, `src/lib/api-client.ts`, `withErrors`, `instrumentation.ts`, `ErrorListeners` |
| **Error Boundaries**: class or framework, fallback UI, recovery, levels | `app/error.tsx`, `app/(game)/error.tsx`, `app/global-error.tsx`, `SectionBoundary` and `RewardBoundary` (`catchError`), `ErrorPanel` |
| **Debugging**: DevTools, React DevTools, network, console, breakpoints, source maps | [docs/DEBUGGING.md](docs/DEBUGGING.md); `productionBrowserSourceMaps` |
| **Error types**: network, 4xx/5xx, validation, runtime, auth | the error kinds table below |
| **Loading states**: spinners, skeletons, Suspense, progressive loading, optimistic UI | `src/components/Skeletons.tsx`; busy buttons; streamed sections; optimistic guild notes |
| **User feedback**: toasts, inline, modals, messages | `src/lib/toast.ts` and `<Toaster />`; `FormMessage`; the rules below |
| **Deliverables**: comprehensive error handling, an Error Boundary, CORS documented, loading states for all async operations, network error handling, 404 and error pages, toasts, README with the strategy | all of the above; the before/after evidence in [ERROR_INVENTORY.md](docs/ERROR_INVENTORY.md) |

## Error-handling strategy

### Principles

1. **Every failure ends.** Nothing waits forever, and no button stays busy: deadlines on both sides, `finally` on every request.
2. **Say what happened and what to do next**, in words for people. Never raw server text for a 5xx, never a stack trace. Tell people whether their work was saved.
3. **Keep what people did.** Forms, drafts and unsent notes survive every failure.
4. **Contain it.** One failing section must not take its page down; one failing page must not take the app down.
5. **Make it findable.** Every error the user sees carries a reference that leads to exactly one log line.

### One error model

Every failure in the browser becomes an `AppError` with a **kind** (`src/lib/errors.ts`). The kind decides the message, and whether retrying can help:

| Kind | From | Message (shortened) | Retry |
|---|---|---|---|
| `offline` | the browser knows it's offline; nothing sent | "You are offline. Nothing was sent: reconnect and try again." | by the person |
| `network` | `fetch` rejected (dropped connection, DNS, CORS) | "Could not reach Intern Quest. Check your connection…" | reads: automatic |
| `timeout` | our 15 s deadline | "…took too long to answer." For a write: "**It may have been saved anyway**: check before sending it again." | reads: automatic |
| `validation` | 400 | the API's own sentence, and the errors per field | no |
| `unauthorized` | 401 | "Your session has ended…", with a link to sign in **in a new tab**, keeping the draft | no |
| `forbidden`, `notFound`, `conflict` | 403, 404, 409 | the API's own sentence ("You already logged day 2…") | no |
| `rateLimited` | 429 | "Too many tries… wait a minute" | by the person |
| `unavailable` | 503 (our database not answering) | "…can not reach its database right now. Try again in a moment. (ref 3f2a9c1e)" | reads: automatic |
| `server` | 500 and other 5xx | "Something broke on our side. It has been logged… (ref …)" | reads: automatic |

### Where an error is shown

| Situation | Shown as | Example |
|---|---|---|
| A form or a button failed | **inline**, next to it (`role="alert"`), the button usable again | Publish while offline |
| A field is invalid | **inline per field**, from the API's `fields` | "title must be at least 3 characters" |
| Something in the background, or with no place on screen | a **toast**: errors stay until dismissed, the rest leave after 6 s | a guild note not sent; an uncaught error |
| One section of a page failed | a **section boundary**; the rest of the page stays | the home leaderboard |
| A whole page failed | the **page boundary**, inside the shell: navigation stays | the journal during an outage |
| A public page or sign-in failed | a **branded full screen**, with a way home | a public sheet during an outage |
| The root layout itself failed | **`global-error.tsx`**, its own document and styles | (last resort) |
| A code chunk failed (a new deploy) | "Intern Quest was updated", with **Reload** (retrying the old chunk can't work) | after a deploy |
| The browser is offline | a **banner**, links held back, "Back online." when it returns | |

### Retries and deadlines

- **Reads** (GET) retry automatically twice, after a random, growing wait (exponential backoff with full jitter), and only when it can help: network, timeout, 503, 5xx.
- **Writes are never retried automatically.** A POST that timed out may have been saved; sending it again could log the same day twice. The person decides, and the message says to check first.
- **Retries happen in one layer only.** The browser retries reads. The server's Supabase client does not (`db: { retry: false }`); its built-in retries made an outage take ~10 s to show, and two layers multiply.
- **Deadlines:** 15 s in the browser, and 5 s per database request (`DB_TIMEOUT_MS`). The server's is shorter, so it normally answers first, with a 503 that explains itself.
- **Pages:** "Try again" on an error page calls Next 16's `retry()`, which **re-fetches** the page from the server (not only re-renders it).

### Loading states

- **Skeletons** in every Suspense fallback, in the page's own shape. They are part of the prerendered HTML, so they show before any JavaScript, and screen readers hear one "Loading…".
- **Busy buttons** say what they're doing ("Publishing…"). They stay focusable (`aria-disabled`) and ignore a second press.
- **Optimistic UI:** a guild note shows at once as "Sending…" (`useOptimistic`).
- **Parallel reads:** the journal reads its data at once. With a slow database it appears in one round trip instead of two (6.4 s → 3.4 s).

### Logging and references

- **Server:** `onRequestError` (`src/instrumentation.ts`) and `withErrors` (route handlers) write **one JSON line** per error. Each has the request id (`x-request-id`, set by the proxy on every request), Next's digest, the route, the error kind and a short stack.
- **Browser:** errors the page could not show (global `error` and `unhandledrejection` listeners, boundaries) go to `POST /api/client-errors`. Same origin only, 8 KB at most, 20 a minute per address, and the path only (no query string).
- **The user sees a reference:** "ref 80defe78" (from the request id) or the digest on an error page. Search the log (locally the terminal, on Vercel its Logs) for that reference and you find the line.

### Pages that are not found, or fail

- A designed **404** for unknown addresses, characters and quests.
- **Unknown `/api/…` addresses** answer JSON 404.
- **Status codes:** with Cache Components, the prerendered shell is sent with `200` before request-time code runs. A later not-found or error keeps that `200`, and the page gets `<meta name="robots" content="noindex">`. That's Next's documented behaviour; [ERROR_INVENTORY.md](docs/ERROR_INVENTORY.md) has the details. The API is not streamed and always answers its true status.

## CORS, in short

- **The public API:** `GET /api/public/characters/:handle` is a public "quest card". Only pages from the origins in `CORS_ALLOWED_ORIGINS` may read it. The allowed origin is echoed back, never `*`, with `Vary: Origin` and no credentials.
- **Preflights** are answered in the proxy.
- **The signed-in API** sends no CORS headers, and the proxy refuses any API write whose `Origin` is not our own: CORS hides answers, it doesn't stop requests.
- **Everything else** (headers, captured exchanges, the lab, common mistakes, how to debug a CORS error) is in [docs/CORS.md](docs/CORS.md).

## Debugging

[docs/DEBUGGING.md](docs/DEBUGGING.md) covers:
- the Network tab, the Console (and where logs go in Next.js), and references to log lines;
- browser and server breakpoints (`npm run dev -- --inspect`), React DevTools, and source maps in production;
- the fault proxy, and a table of the bugs found this way.

## The game

| | Rule |
|---|---|
| **Quest XP** | difficulty (easy 50, normal 100, hard 150, boss 250) + 20 per PR link (max 3) + 10% if the previous day was logged; split across the quest's skills; +10% on your class's home skills |
| **Levels** | level L starts at 100 × L(L−1)/2 XP. Titles: Trainee 1, Apprentice 3, Journeyman 5, Adept 8, Expert 12, Master 16 |
| **Badges** | automatic: First Quest, 7-Day Streak, Boss Defeated, Polyglot, PR Machine, Unblocked; plus custom badges from mentors |
| **Pip** | grows Egg → Sprout → Sprite → Guardian with your level; mood from your data (happy, worried, sleepy, proud, fired up); ~70 hand-written lines, picked by rules (no AI) |
| **Classes** | Frontend Mage, Backend Knight, Full-stack Ranger, Design Bard |

The rules live in `src/lib/game/` as pure functions, **and** as SQL views in the database; a test checks both give identical numbers for every character.

## The Day 21 brief, item by item (the app Day 23 builds on)

| Brief | Where |
|---|---|
| **API routes**: endpoints in `app/api`; GET, POST, PUT, DELETE; request data; JSON; database | `src/app/api/` (table below); bodies validated in `src/lib/validation.ts`; Supabase via `src/lib/server/db.ts` |
| **NextAuth**: setup, credentials + OAuth providers | `src/auth.ts`: Credentials (email + bcrypt) and GitHub |
| Protected routes, sessions, API route protection | JWT session cookie with id and role; `requireUser` / `requireMentor`; every route handler checks `currentUser()` |
| **Middleware**: `proxy.ts` (Next.js 16's name for it), request/response changes, redirects, rewrites, auth checks, logging | `src/proxy.ts` |
| **Environment variables**: `.env.local`, public vs server, server vs client components, dev vs prod | `.env.example`, `src/lib/env.ts`, `src/instrumentation.ts`, the table below |
| **Performance**: code splitting, bundle analysis, lazy loading, images, fonts | [bundle measurements](docs/bundle-measurements.md); `next/dynamic`; `LazyMotion`; SVG art; `next/font` |
| **Deploy to Vercel**: GitHub, automatic and preview deployments, env vars, custom domain | [deployment guide](docs/DEPLOYMENT.md); live at the address above |
| **Vercel features**: Analytics, Web Vitals, edge and serverless | `@vercel/analytics`, `@vercel/speed-insights` in the root layout; edge vs serverless in the guide |
| **Alternatives**: Netlify, VPS, Docker | `Dockerfile` (built and run), guide section |
| **CRUD app with NextAuth, API, database, protected routes, SEO, deployed** | the whole app |

## Architecture

```
Browser ──► proxy.ts ───────────────────────────────► Next.js on Vercel (Node.js serverless functions)
            • request id + one JSON log line          • public: /, /c/[handle] (cached reads, SEO, share card), sitemap, robots
            • security headers                        • private: /journal, /journal/new, /journal/[id], /character, /guild
            • /journal, /character, /guild without      (each page checks the session again)
              a session → /login?next=…               • API: route handlers returning JSON
            • /guild for non-mentors → /journal                       │ service key (server only)
            • /@handle → rewrite /c/handle                            ▼
            • CORS for /api/public/* (allowlist)
            • API writes from another origin → 403
                                                      Supabase Postgres: users, accounts, characters, quests,
                                                      badges, notes + XP views; Row Level Security, no public access
```

### API

| Method and path | Who | Does |
|---|---|---|
| `GET /api/quests` (`?status=draft\|published`) | signed in | your quests |
| `POST /api/quests` | signed in, with a character | log a quest → `201 { quest, reward }` (XP, level-up, new badges, Pip's line) |
| `GET /api/quests/:id` | anyone (public quests), owner (all) | one quest |
| `PUT /api/quests/:id` | owner | replace a quest (publishing a draft returns a reward) |
| `DELETE /api/quests/:id` | owner | delete → `204` |
| `GET` / `PUT /api/character` | signed in | read / create or update your character |
| `GET` / `POST /api/quests/:id/notes` | readers / mentors | mentor notes |
| `POST /api/badges`, `DELETE /api/badges/:id` | mentors | award / remove a badge |
| `POST /api/register` | anyone | create an email-and-password account |
| `POST /api/mentor` | signed in | redeem the mentor invite code |
| `/api/auth/*` | NextAuth | sign-in, callbacks, session, sign-out |
| `GET /api/public/characters/:handle` | anyone; **readable cross-origin** by `CORS_ALLOWED_ORIGINS` (Day 23) | a public quest card |
| `POST /api/client-errors` | this site's pages | a browser-side error, written to the log (Day 23) |
| anything else under `/api/` | | JSON 404 (Day 23) |

Errors are JSON `{ error, fields?, requestId? }`:
- **400** lists every invalid field at once;
- **401** not signed in;
- **403** someone else's (visible) record, or a write from another origin;
- **404** also for other people's private records, so the API never confirms they exist;
- **409** a day already logged, a handle taken, no character yet;
- **503** + `Retry-After` when the database doesn't answer (Day 23);
- **500** for a bug, logged, with the request id (Day 23).

## Authentication and security

- **Passwords**: bcrypt (cost 10); 10 characters to 72 *bytes* (bcrypt ignores the rest). Wrong password and unknown email get the same answer in about the same time (a dummy comparison), so nobody can probe which emails are registered.
- **Sessions**: encrypted JWT in an http-only, SameSite=Lax cookie, carrying the user id and role. The role is re-read from the database when the session is updated (after redeeming a mentor code, no re-login needed).
- **GitHub sign-in**: a GitHub account whose email belongs to a password account is **refused**, not merged: linking by email alone would let someone take over the account.
- **Defence in depth**: the proxy redirects early, but every page, route handler and Server Action checks the session itself.
- **Database**: Row Level Security on, no policies, public roles revoked; only the server (service key) reads or writes. The browser never talks to Supabase.
- **Secrets**: `server-only` makes importing the database client from a Client Component a build error; a browser test downloads every script the browser receives and checks the real secret values are absent.
- **Redirects**: `?next=` accepts only same-site paths (no open redirect).
- **Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, plus `x-request-id`.

## Environment variables

| Variable | Public or server | Local | Production (Vercel) |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **public**: inlined into the browser bundle at build time | `http://localhost:3000` | the live address |
| `AUTH_SECRET` | server | generated by `npm run env:local` | generated, sensitive |
| `SUPABASE_URL` | server | the local stack | the cloud project |
| `SUPABASE_SERVICE_ROLE_KEY` | server | local demo key | the project's secret key, sensitive |
| `MENTOR_INVITE_CODE` | server | `demo-mentor` | your own phrase, sensitive |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | server | optional | optional |
| `CORS_ALLOWED_ORIGINS` (Day 23) | server | `http://localhost:4000` (the embed site) | the origins allowed to read `/api/public/*`; `*` refused at start |
| `DB_TIMEOUT_MS` (Day 23) | server | optional (5000) | optional (5000) |

`src/instrumentation.ts` checks them when a server starts. On the **live** deployment (`VERCEL_ENV=production`, or `APP_ENV=production` when self-hosting) it refuses to start with a missing value, a short secret, a local database URL, the demo mentor code, or a secret-looking `NEXT_PUBLIC_` variable. It keys off the deployment, not `NODE_ENV`: `next start` on a laptop is also a "production" build.

## Rendering and caching

- **Public pages** read cached data (`'use cache'` + `cacheLife('hours')`, tags `guild` and `character:<handle>`). Writes expire the tags with `revalidateTag(tag, { expire: 0 })`, so you see your change at once (route handlers can not use `updateTag`).
- **The build never touches the database**: the leaderboard and the sitemap are read at request time, then cached. A build needs no secrets and can not fail because the database is down.
- **Share cards**: `app/c/[handle]/opengraph-image.tsx` draws a 1200×630 PNG with name, level, XP and Pip.

## Performance and accessibility

- **JavaScript per page** (gzipped, measured): about 192 to 210 KB, **5 to 6% less** after switching to `LazyMotion` and replacing Motion's `animate()` with a small `requestAnimationFrame` count-up. The earlier `next/dynamic` split saved almost nothing: details and the honest reasons in [bundle measurements](docs/bundle-measurements.md).
- **Fonts** via `next/font` (Fredoka, Nunito), self-hosted. **Art** is SVG (no raster images to optimise).
- **Accessibility**: axe (WCAG 2.1 AA) on 11 pages in the browser tests. Visitors who ask for reduced motion get no entrance animations or confetti.

## Deploying

See the **[deployment guide](docs/DEPLOYMENT.md)**. In short:
1. A Supabase project, with the two migrations applied.
2. A Vercel project with the variables above. Its Root Directory is `Day-23/intern-quest` since Day 23 (it was `Day-21/intern-quest`).
3. Optionally, a GitHub OAuth app.

The site is deployed with the Vercel CLI from the repository root. Automatic deploys on push, and preview URLs for pull requests, start once GitHub is connected to the Vercel account.

What the first deployment taught (each is now fixed or documented):

1. **The build read the database** (prerendered leaderboard and sitemap). Moved to request time: builds need no secrets.
2. **Supabase cloud did not grant tables to the server role** (the local stack does): "permission denied for table characters". A second migration grants explicitly.
3. **The startup check stopped the first live deploy** on purpose: `NEXT_PUBLIC_SITE_URL` was not set. Set it, redeployed.
4. **The Vercel CLI must deploy from the repository root** when the project has a Root Directory; a root `.vercelignore` uploads only this app.
5. **Signed-in pages logged "unstable value while prerendering"** in the Vercel logs (not in tests): the session read had lost its `connection()`. Fixed.
6. **The import script needs Node 22+** (supabase-js uses the built-in WebSocket); it now says so.

## Tests

| Suite | Count | Covers |
|---|---|---|
| Unit | 151 | XP, levels, titles, badges, Pip, request validation, the environment check; **Day 23:** every error kind, `apiFetch` (deadline with fake timers, offline, retries, never retrying writes), `fail()` outage detection, `withErrors`, the log line, the rate limiter, the error view, the action guard, toasts, CORS rules and the cross-site write check |
| Integration | 68 | the schema, SQL XP views equal `computeStats`, RLS, every route handler; **Day 23:** 503/500 JSON with the request id, the JSON 404, `/api/client-errors` (origin, size, flood) |
| Browser (production build) | 74 | the Day 21 flows (auth, quests, mentors, SEO, axe, no secrets in client JavaScript). **Day 23:** failures replayed in the browser (offline, a hung request, an HTML 500, an ended session, a failed code chunk); the **real database failing** through a fault proxy (page and section boundaries, Try again, outages while saving, a slow database and the skeleton); optimistic notes, toasts, busy buttons; CORS from a second origin; a forged write refused; axe on error and loading states |
| Error inventory | 33 scenarios | not pass/fail: what a person sees for each failure, before and after ([ERROR_INVENTORY.md](docs/ERROR_INVENTORY.md)) |

## Bugs the tests (and the logs) found

- **Sign-out could undo itself under load**: NextAuth's `auth()` proxy wrapper re-issues the session cookie, so a request in flight wrote it back. The proxy now reads the session with `getToken` only.
- **Pip's eyes jumped below the mouth mid-blink**: SVG animation origins were in page coordinates; Motion measures from each shape's own box.
- **The client router remembered an onboarding redirect**: after creating a character, `/journal` still went to `/character`. The journal now shows a prompt instead of redirecting.
- **Pages kept their old state**: Next.js 16 keeps left pages alive (React Activity), so "Log day 2" showed day 1's form. Editors are keyed on their data and clear transient state when hidden.
- **Contrast failures** (axe): translucent buttons and nav, faded text, a link-blue wordmark, and a badge grid that overflowed its card at 1280 px.
- **A coloured screen briefly rendered white** after `LazyMotion` (its colour was set only by an animation).
- The two from the deployment above (grants, request-time session).
- **Day 23:** the error findings E-1 to E-14 and how each was found are in [ERROR_INVENTORY.md](docs/ERROR_INVENTORY.md) and [DEBUGGING.md](docs/DEBUGGING.md#8-bugs-that-only-appear-sometimes-tests-faults-and-the-inventory).

## Limits

- **NextAuth v5 is still labelled beta.**
- **Pages that are not found, or fail, answer status 200**, with `noindex` (a "soft 404"): with Cache Components the shell streams before request-time code runs. `instant = false` was tried and did not change it. The API is not affected.
- **Offline writing is not queued:** offline, nothing is sent (and that is said); drafts are kept until the connection returns.
- **`/api/client-errors` rate limiting is per server instance** (in memory).
- **Cached reads live in each serverless instance's memory** (`'use cache: remote'` would share them).
- **Preview deployments share the production database** in this setup; GitHub sign-in does not work on preview URLs (one callback per OAuth app).
- **No admin portal**: mentors review interns in the Guild hall; anything else (removing accounts, changing roles) is done in the Supabase dashboard.
- **No custom domain** (the guide explains how to add one).
- Browser tests run in Chrome only.
