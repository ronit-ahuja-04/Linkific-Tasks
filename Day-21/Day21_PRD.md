# PRD: Intern Quest, Next.js advanced and deployment (Day 21)

| Field     | Value                                                                                 |
| --------- | ------------------------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                                           |
| Programme | Linkific internship, Month 1 (training phase), Day 21                                 |
| Repo path | `Linkific-Tasks/Day-21/intern-quest`                                                  |
| Live      | https://intern-quest-smoky.vercel.app                                                 |
| Status    | **Built and deployed.** PRs #97 to #106, plus the documentation PR                    |
| Companion | the project README, `docs/DEPLOYMENT.md`, `docs/bundle-measurements.md` |

## 1. Summary

Day 21 asks for a production-ready Next.js app with API routes, NextAuth, middleware, environment variables, performance work and a Vercel deployment. The deliverable is **Intern Quest**: the internship logbook as a role-playing game. Logged days are quests that give XP to skills; characters level up and earn badges; mentors review and award badges; Pip, a sidekick drawn in SVG, reacts to every quest. It is seeded on the live site with the real Days 1 to 20 of this repository.

## 2. Goals and non-goals

- Every Day 21 brief item used for a real purpose in one app, and tested.
- A live deployment that survives real use: secrets handled properly, builds independent of the database, a startup check.
- Character-driven and fun to demo (the user asked for "something fun, character driven, related to the logbook").
- Non-goals: an admin portal, real-time features, a custom domain, AI-written content.

## 3. Decisions

| Decision | Why |
|---|---|
| A new app, Intern Quest, with Pip as a sidekick | Chosen by the user over extending Dispatch (Day 20) or a CRUD tutorial app; a game gives every brief item a reason to exist |
| NextAuth v5 (Auth.js), labelled beta | What the brief names; built for the App Router and Next 16 |
| Supabase Postgres, server-only access | Continues Day 17; the browser never holds a database key; RLS on with no public policies |
| `proxy.ts` (Next 16's name for middleware), optimistic only | The docs warn it is not an authorization layer; every page, route and action re-checks |
| Game rules as pure TypeScript **and** SQL views, tested equal | XP is computed in one place per layer, and the two can not drift |
| The route handlers are the UI's backend too | The editors call `/api/quests` like any client would; one set of validation and errors |
| Cache Components with tagged `use cache` reads; `expire: 0` on writes | Public pages are cheap; your own change is visible at once |
| Builds independent of the database | Found while building the Docker image: no secrets in builds, no failed builds when the database is down |
| Strict settings keyed off `VERCEL_ENV` / `APP_ENV`, not `NODE_ENV` | `next start` on a laptop is also a production build |
| Desktop-first, responsive design after a reference video | The user asked for "something like this" (smooth, character-led animated app), then for desktop, then responsive |
| Report and standup script kept local | As on Days 16, 18 to 20 |

## 4. Requirements and verification

| # | Requirement | Verified by |
|---|---|---|
| R1 | API routes with GET, POST, PUT, DELETE, validation, JSON errors, database | 46 route-handler integration tests (every method and status) |
| R2 | NextAuth with credentials and OAuth; sessions; protected pages and APIs | integration tests (bcrypt, GitHub linking, JWT callback); browser tests (sign-up/in/out, cookie flags, GitHub authorize redirect) |
| R3 | Middleware: redirects, rewrites, headers, auth checks, logging | browser tests on `proxy.ts`; Vercel logs show one JSON line per request |
| R4 | Environment variables per environment; secrets never in the browser | unit tests of the env check; browser test scanning all client JavaScript for the real secret values |
| R5 | Performance: lazy loading, bundle analysis, fonts | `docs/bundle-measurements.md` (measured before/after) |
| R6 | Deployed on Vercel with env vars, Analytics and Speed Insights | the live URL; 15 automated live checks after deploy. The Analytics and Speed Insights components ship in the app; switching them on in the dashboard is open item 2 |
| R7 | Database integration | schema tests, SQL-vs-TypeScript XP test, RLS tests |
| R8 | SEO | browser tests: titles, Open Graph/Twitter, canonical, share-card PNG, sitemap, robots |
| R9 | Accessibility | axe WCAG 2.1 AA on 11 pages |
| R10 | Alternative deployment | Dockerfile built (313 MB) and run, including a real sign-in |

## 5. Milestones

| # | Milestone | PR |
|---|---|---|
| M1 | Foundations: schema, XP views, RLS, seed of the real 20 days, game rules | #97 |
| M2 | API route handlers; animated, responsive character preview | #98, #99 |
| M3 | Authentication (NextAuth v5) | #100 |
| M4 | Game pages and `proxy.ts` | #101 |
| M5 | Public pages, SEO, env check, performance, accessibility | #102 |
| M6 | Deployment: Vercel, Supabase cloud, Docker, import script; fixes found live | #103 to #106 |
| M7 | README, deployment guide, PRD, root index | documentation PR |

## 6. Risks and what happened

| Risk | Outcome |
|---|---|
| NextAuth v5 beta | Worked; one real bug found (the `auth()` proxy wrapper re-issues the session cookie, which could undo a sign-out under load); the proxy uses `getToken` |
| Next.js 16 differs from tutorials | Read the bundled docs first; still hit Activity (preserved page state), cached client redirects and prerender-time randomness, each fixed and documented |
| Deployment needs the user's accounts | Prepared everything first; the user's steps were login, project creation, two secrets, one SQL script |
| Local and cloud Supabase differ | They did (table grants); found on the first deploy, fixed with a migration |

## 7. Open items

- Connect GitHub to the Vercel account for automatic and preview deployments (deploys are by CLI until then).
- Enable Analytics and Speed Insights in the Vercel dashboard (the components are already in the app).
- Optional: GitHub OAuth app for "Continue with GitHub"; a custom domain; an admin portal.
