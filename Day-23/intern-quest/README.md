# Intern Quest

> **Day 23 copy (CORS, error handling and debugging), in progress.** This is Day 21's Intern Quest, copied so that it can be made to fail well. Done so far: M1, [the error inventory](docs/ERROR_INVENTORY.md), which measures what happens when the network, the database or an address fails (`npm run inventory`); M2, the error foundation: one error model and `apiFetch` (deadlines, offline, retries for reads only), JSON errors from every API route, a 5 s database deadline, and one searchable log line per error (`onRequestError`, `/api/client-errors`). M3, boundaries: the signed-in shell moved into a layout that needs no database, `error.tsx` per segment and `global-error.tsx`, section boundaries (`catchError`) for the home leaderboard and the reward screen, an offline banner, and sign-in forms that survive a network failure. The rest of this README still describes Day 21; it is rewritten at the end of Day 23.

**Your internship logbook as a role-playing game.** Every day you log is a *quest*: it gives XP to the skills you used, your character levels up and earns badges, mentors act as guild masters, and **Pip**, your sidekick, reacts to everything you log.

**Live:** https://intern-quest-smoky.vercel.app · **Day 21 project:** Linkific Month 1 Training · **Author:** Ronit Ahuja
**Stack:** Next.js 16.4.6 (App Router, Cache Components, Turbopack), React 19.3, TypeScript (strict), NextAuth v5 (Auth.js, beta), Supabase Postgres, Motion, Vercel; Vitest, Playwright, axe
**Docs:** [Deployment guide](docs/DEPLOYMENT.md) · [Bundle measurements](docs/bundle-measurements.md) · [PRD](../Day21_PRD.md)

---

## Run it locally

Needs Node 22+ and Docker (for the local Supabase stack).

```bash
cd Day-21/intern-quest
npm install
npm run db:start      # local Postgres + API in Docker (ports 55421-55429), with the schema and demo data
npm run env:local     # writes .env.local for the local stack (a fresh AUTH_SECRET too)
npm run dev           # http://localhost:3000
```

Demo accounts (local only): `ronit@example.com` (your real 20 days), `ada@example.com`, `grace@example.com`, and the mentor `mentor@example.com`. Password `demo-password-123`. Mentor invite code: `demo-mentor`.

| Command | What it does |
|---|---|
| `npm run typecheck` | `next typegen` + `tsc` (strict, no `any`) |
| `npm run lint` | ESLint (Next.js rules) |
| `npm test` | 60 unit tests: the game rules, validation, the environment check |
| `npm run test:integration` | 60 tests against the local database: the schema, the SQL XP views, and every API route handler |
| `npm run test:e2e` | 43 browser tests against a **production build** (`next build` + `next start`), including axe |
| `npm run db:types` | regenerate `src/lib/server/database.types.ts` from the schema |
| `npm run inventory` | Day 23: the error inventory, 33 failure scenarios against a production build, written to `docs/errors/<label>.md` (needs the local stack; about 5 minutes) |
| `node scripts/measure-js.mjs` | JavaScript per page (needs a production server on :3122) |

## The game

| | Rule |
|---|---|
| **Quest XP** | difficulty (easy 50, normal 100, hard 150, boss 250) + 20 per PR link (max 3) + 10% if the previous day was logged; split across the quest's skills; +10% on your class's home skills |
| **Levels** | level L starts at 100 × L(L−1)/2 XP. Titles: Trainee 1, Apprentice 3, Journeyman 5, Adept 8, Expert 12, Master 16 |
| **Badges** | automatic: First Quest, 7-Day Streak, Boss Defeated, Polyglot, PR Machine, Unblocked; plus custom badges from mentors |
| **Pip** | grows Egg → Sprout → Sprite → Guardian with your level; mood from your data (happy, worried, sleepy, proud, fired up); ~70 hand-written lines, picked by rules (no AI) |
| **Classes** | Frontend Mage, Backend Knight, Full-stack Ranger, Design Bard |

The rules live in `src/lib/game/` as pure functions, **and** as SQL views in the database; a test checks both give identical numbers for every character.

## The Day 21 brief, item by item

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

Errors are JSON `{ error, fields? }`: **400** lists every invalid field at once; **401** not signed in; **403** someone else's (visible) record; **404** also for other people's private records, so the API never confirms they exist; **409** a day already logged, a handle taken, no character yet.

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

See the **[deployment guide](docs/DEPLOYMENT.md)**. In short: Supabase project (apply the two migrations) → Vercel project with Root Directory `Day-21/intern-quest` and the variables above → optional GitHub OAuth app. Today the site is deployed with the Vercel CLI from the repository root; automatic deploys on push and preview URLs for pull requests start once GitHub is connected to the Vercel account.

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
| Unit | 60 | XP (including a hand-worked example), levels, titles, badges, Pip's moods and lines, request validation, the environment check |
| Integration | 60 | enums match the TypeScript; SQL XP views equal `computeStats` for every character; constraints; RLS blocks the public key; every route handler's methods and status codes; password hashing; GitHub linking; the JWT callback; the mentor code |
| Browser (production build) | 43 | sign-up, sign-in, sign-out, wrong password, http-only cookie, open-redirect protection, GitHub redirect; onboarding; the reward (exact XP); drafts; edit and delete; someone else's quest; public sheet and `/@handle`; mentor gate, invite code, notes and badges; proxy redirects, headers and request ids; home, SEO tags, share-card PNG, sitemap and robots; cache freshness; axe on 11 pages; no secrets in client JavaScript |

## Bugs the tests (and the logs) found

- **Sign-out could undo itself under load**: NextAuth's `auth()` proxy wrapper re-issues the session cookie, so a request in flight wrote it back. The proxy now reads the session with `getToken` only.
- **Pip's eyes jumped below the mouth mid-blink**: SVG animation origins were in page coordinates; Motion measures from each shape's own box.
- **The client router remembered an onboarding redirect**: after creating a character, `/journal` still went to `/character`. The journal now shows a prompt instead of redirecting.
- **Pages kept their old state**: Next.js 16 keeps left pages alive (React Activity), so "Log day 2" showed day 1's form. Editors are keyed on their data and clear transient state when hidden.
- **Contrast failures** (axe): translucent buttons and nav, faded text, a link-blue wordmark, and a badge grid that overflowed its card at 1280 px.
- **A coloured screen briefly rendered white** after `LazyMotion` (its colour was set only by an animation).
- The two from the deployment above (grants, request-time session).

## Limits

- **NextAuth v5 is still labelled beta.**
- **Unknown handles answer status 200** with the not-found page and `noindex` (a "soft 404"): with Cache Components the shell streams before the lookup finishes. `instant = false` was tried and did not change it.
- **Cached reads live in each serverless instance's memory** (`'use cache: remote'` would share them).
- **Preview deployments share the production database** in this setup; GitHub sign-in does not work on preview URLs (one callback per OAuth app).
- **No admin portal**: mentors review interns in the Guild hall; anything else (removing accounts, changing roles) is done in the Supabase dashboard.
- **No custom domain** (the guide explains how to add one).
- Browser tests run in Chrome only.
