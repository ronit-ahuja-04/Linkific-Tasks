# Huddle, made fast

**Day 24 project:** Linkific Month 1 Training · Performance optimisation and best practices
**Author:** Ronit Ahuja
**Based on:** [Day 22's Huddle](../../Day-22/huddle-redesign) (a team workspace on Supabase, redesigned and accessible), copied here and made measurably faster. Features, design and accessibility are unchanged.
**Stack:** React 19, Vite 8, React Router, supabase-js, react-window, local Supabase; Lighthouse 12, rollup-plugin-visualizer, bippy (render counts); Vitest, Playwright, axe-core, pgTAP
**PRD:** [Day24_PRD.md](../Day24_PRD.md) · **Every measurement and technique:** [docs/PERFORMANCE.md](docs/PERFORMANCE.md) · **Before / after reports:** [perf/before.md](docs/perf/before.md), [perf/after.md](docs/perf/after.md)

Optimisation by opinion tends to memoise everything and change nothing. Day 24 started by **measuring**: one script (`npm run perf`) builds the app, runs Lighthouse signed in (median of 3 runs, mobile and desktop), counts every component render while the app is used, and times interactions with the CPU slowed 4x. It runs on a large test data set: a room with 5,000 messages, 1,000 notes and 300 files. That gave nine findings, P-1 to P-9. Each milestone fixed some of them and ran the same script again.

## Before and after

| | Before | After |
|---|---|---|
| **Lighthouse performance, mobile**: Sign in · Dashboard · Chat · Notes · Files · Profile | 97 · 89 · 89 · 93 · 95 · **74** | 95 · **94** · **90** · 90 · 92 · **92** (every page 90+) |
| Lighthouse performance, desktop | 95 to 100 | **100 on every page** |
| Lighthouse accessibility / best practices | 100 / 100 (chat 99) | **100 / 100 everywhere** |
| First download (JavaScript, gzip) | 178 KB in one file, for every page | **150 KB**; each page's code loads when it's visited or about to be |
| Images on the Files page | **17.2 MB** (full-size photos) | **8 KB** (160 px WebP thumbnails, only near the screen) |
| Profile: largest contentful paint, mobile | **8.3 s** (a 1 MB avatar) | **3.0 s** (a 13 KB WebP) |
| Receiving 5 messages with 500 on screen | **12,902** component renders, 785 ms of blocked main thread | **128** renders, **0 ms** |
| Dashboard layout shift (CLS), mobile | 0.14 | **0.018** |
| Files reachable in the Files page | the newest 100 | **all** (a virtualised list with infinite loading) |

Desktop scores and the slow-phone simulation both come from the same reports. Each number is reproduced by `npm run perf` (below).

## What the brief asked for, and where it is

| Deliverable | Where |
|---|---|
| An optimised React application | this folder |
| React.memo examples | `memo(MessageItem)` with the measurement (12,902 → 128 renders), a unit test that proves memo does nothing *without* stable props, and a measured "when not to memo" table: [PERFORMANCE.md, M3](docs/PERFORMANCE.md#m3-rendering-reactmemo-usememo-usecallback) |
| useMemo / useCallback | `RoomView.jsx` (`useCallback` for the handlers a memoised row receives, `useMemo` for the grouping flags), `AuthContext.jsx` (the context value); the debounce vs throttle choice in the composer |
| Code splitting, lazy-loaded routes | every page `React.lazy` (`src/routes.js`), preloaded on hover/focus/touch and at start-up, prefetched when idle, vendor chunks, a navigation progress bar: [M2](docs/PERFORMANCE.md#m2-code-splitting) |
| Image optimisation | resized to WebP **in the browser** at upload (64/256 px avatars, 160 px thumbnails), `srcset`/`sizes`, `width`/`height`, lazy loading, `fetchpriority`, a backfill script for older pictures: [M4](docs/PERFORMANCE.md#m4-images-and-lists) |
| Lighthouse score 90+ | every page, mobile **and** desktop: [M5](docs/PERFORMANCE.md#m5-lighthouse-90-on-every-page) |
| Before / after comparison | the table above, generated reports [before](docs/perf/before.md) and [after](docs/perf/after.md), and bundle treemaps ([before](docs/perf/bundle-before.html), [after](docs/perf/bundle-after.html)) |
| README with the optimisation techniques | this file |
| Also (from the brief's topics) | virtualisation (react-window) with infinite loading, debounce and throttle, preconnect, caching headers, the React DevTools profiler data (render counts through React's DevTools hook), and the **React Compiler compared** with memoising by hand |

## The techniques

Each row says what was done, where, and the measured effect. The "why" and the dead ends are in [PERFORMANCE.md](docs/PERFORMANCE.md).

### Measuring first (M1)

| Tool | Used for |
|---|---|
| `scripts/perf/bundle.mjs` (Vite's build manifest + `rollup-plugin-visualizer`) | what each page downloads first, what's lazy, a treemap of every package |
| `scripts/perf/lighthouse.mjs` (the Lighthouse Node API) | six pages, signed in, mobile and desktop, median of 3, HTTP cache cleared each run |
| `scripts/perf/interactions.mjs` + `render-counter.js` (bippy, React's DevTools hook) | **component renders** per interaction, the same data the React DevTools Profiler shows but scripted and repeatable. No test code goes in the app |
| the Event Timing API, long tasks, layout shift (Chrome, CPU 4x slower) | how long a key press takes to paint, how long the main thread is blocked |
| `scripts/perf-data.mjs add / remove / status` | the large test data set, for four test accounts (local only) |

### Code splitting (M2)

- **Every route is lazy** (`React.lazy` + `Suspense`), so a visit downloads the shell and then only the page it shows. First download 178 → 148 KB gzip; Lighthouse's "unused JavaScript" fell by a third.
- **Preloading so a click rarely waits:**
  - the current page's chunk starts at start-up, in parallel with React;
  - other pages preload on hover, focus or touch of a link;
  - the main pages are prefetched when the browser is idle, 2 s after load (skipped on save-data or 2G).
- **A progress bar for navigations.** React Router navigates in a transition, which keeps the old page on screen while the new one loads; without the bar a click on a slow connection seemed to do nothing.
- **Vendor chunks** (`react-vendor`, `supabase-vendor`) stay cached across deploys that only change app code.
- **Not done, on purpose:** splitting small components (one more round trip to save 1 KB).

### Rendering (M3): React.memo, useCallback, useMemo

```jsx
// MessageItem.jsx: a message re-renders only when ITS props change
export default memo(MessageItem);

// RoomView.jsx: memo compares props by identity, so the handlers must keep theirs
const edit = useCallback(async (id, body) => { /* editMessage(client, …), update the list */ }, [client]);
const remove = useCallback(async (id) => { /* deleteMessage(client, …), update the list */ }, [client]);
const grouped = useMemo(() => messages.map((m, i) => continuesGroup(m, messages[i - 1])), [messages]);
```

- **Effect:** receiving 5 messages with 500 on screen went from 12,902 renders and 785 ms blocked to **128 renders and 0 ms**. Only the 5 new messages render.
- **`memo` alone would have done nothing:** the handlers were new functions on every render. A unit test renders 50 messages both ways to prove it.
- **When NOT to memoise, measured:** the 6 note cards re-render while you type in the search box, and every key still paints within 16 ms on a 4x slower CPU, so memo would add code for no gain. Inline arrow functions on DOM elements cost nothing.
- **Debounce vs throttle:** the @-mention lookup is debounced (150 ms: one query per pause, not per key); "is typing" is throttled (every 2 s *while* typing).
- **The React Compiler, compared:** on the code without hand-written memoisation it cut those 12,911 renders to 4,915 by itself, and removed the cheap re-renders I'd left alone (notes search 850 → 10). It doesn't add `memo` boundaries between components, so the long list still needed `memo(MessageItem)`. The best combination is both. [Details](docs/PERFORMANCE.md#the-react-compiler-compared-with-memoising-by-hand)

### Images and long lists (M4)

| Technique | Effect |
|---|---|
| **Resize in the browser before upload** (`src/lib/images.js`: canvas → WebP), loaded only when a file is picked | an avatar is stored as 64 and 256 px WebP (a 1600 px photo: ~1 MB → ~4–11 KB); an image file gets a 160 px thumbnail (`files.thumb_path`). No server-side resizing needed |
| **`srcset` + `sizes`** | the browser picks the 64 or 256 px file for the size shown |
| **`width` / `height`** | space is reserved before the picture arrives (Profile CLS 0.047 → 0) |
| **`loading="lazy"`, `decoding="async"`** | an avatar 400 messages up the chat isn't downloaded until you scroll near it |
| **`fetchpriority="high"`** on the profile picture | it's that page's largest element: LCP 8.3 → 3.0 s |
| **A year of caching** on resized files | every new picture gets a new name, so a cached copy is never stale |
| `scripts/backfill-images.mjs` | makes the same small copies for pictures uploaded before Day 24 (originals kept) |
| **Files list virtualised** (`react-window` 2, variable row heights, scrolling with the window) **+ infinite loading** (pages of 100, with the total) | all 300 files reachable (it showed only 100), with a few dozen rows in the page at any time; screen readers hear "item 5 of 300" |
| **Chat: infinite scroll upward** | earlier messages load as you near the top; the button stays for keyboard users |
| **Chat NOT virtualised, on purpose** | after M3, 2,000 messages scroll at 60 fps on a 4x slower CPU, and a windowed list would break the screen-reader live region and "keep my place" on loading earlier messages |

### The first load (M5)

| Technique | Effect |
|---|---|
| Dashboard panels keep their size while loading (row-shaped placeholders) | CLS 0.14 → 0.018, mobile 87 → 94 |
| `<link rel="preconnect">` to Supabase | the connection opens while the JavaScript downloads |
| The OAuth settings request only where the sign-in buttons are | 2 fewer requests (one CORS preflight) on every signed-in page |
| A small splash in `index.html` | no blank page while JavaScript loads; small on purpose so it can't fake the LCP |
| `public/_headers`: hashed assets `immutable` for a year, `index.html` `no-cache` | a returning visitor downloads only what changed |
| The chat textbox's ARIA (no `combobox` role on a `<textarea>`) | accessibility 100 on every page |

**What still limits mobile scores**, and why it was left:
- about 60 KB of vendor JavaScript that the first render doesn't run (react-dom, supabase-js: neither splits further);
- one 10.5 KB stylesheet;
- 7–9 CORS preflights per page. A same-origin proxy would remove them; it's recommended for production in [PERFORMANCE.md](docs/PERFORMANCE.md#m5-lighthouse-90-on-every-page).

## Measure it yourself

```bash
cd Day-24/huddle-fast
npm run perf:data -- add                  # the large test data set (local only; `remove` deletes it, `status` counts it)
node scripts/backfill-images.mjs          # small copies of the test data's pictures (--all for every account)
PERF_LABEL=mine npm run perf              # build + bundle + Lighthouse (RUNS=3) + interactions -> docs/perf/mine.md
ANALYZE=1 npm run build                   # just the treemap: docs/perf/bundle-<label>.html
```

The perf test user is `perf@example.com`, password `perf-password-123` (local stack only). A full run takes about 10 minutes.

## Run it (local Supabase, no account needed)

You need Node 20+, Docker (Docker Desktop, or Colima on a Mac) and about 4 GB of memory for the containers.

```bash
cd Day-24/huddle-fast
npm install
npm run db:start      # starts Postgres, Auth, REST, Realtime, Storage and a mail catcher; applies the migrations and the seed
npm run env:local     # writes .env with the local API URL and the public anon key
npm run dev           # http://localhost:5177 (the style guide: /styleguide)
```

- The demo accounts are `ada@example.com` and `grace@example.com`, password `demo-password-123` (they exist only in the local seed).
- Emails (sign-up confirmation is off locally; magic links and password resets are sent) land in the mail catcher at http://127.0.0.1:54324.
- `npm run db:reset` wipes the database and re-applies the migrations and the seed. `npm run db:stop` stops the containers.
- The Studio dashboard, log collection, image transforms and edge functions are not started (`-x` in `db:start`) to keep the stack small.

### Use a Supabase cloud project instead

1. Create a project at supabase.com (free tier).
2. `npx supabase login`, then `npx supabase link --project-ref <your-ref>`.
3. `npx supabase db push` applies the migrations (the seed is **not** applied to a cloud project).
4. Copy the project URL and the **anon / publishable** key (Project settings, API) into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never use the `service_role` / secret key in the browser.
5. Authentication, URL configuration: set the Site URL to where the app runs and add `/auth/callback` and `/auth/reset` to the redirect URLs. Turn on Email confirmations if you want them.
6. Realtime is enabled by the last migration (the `supabase_realtime` publication). Storage buckets are created by the migration too.

### Turn on Google or GitHub sign-in

The buttons appear only when the server has the provider enabled (the app reads `/auth/v1/settings`).

1. Create an OAuth app at the provider. Callback URL for local development: `http://127.0.0.1:54321/auth/v1/callback`. For a cloud project it is `https://<ref>.supabase.co/auth/v1/callback`.
2. Local: copy `supabase/.env.example` to `supabase/.env`, fill in the id and secret, set `enabled = true` for the provider in `supabase/config.toml`, then `npx supabase stop && npm run db:start`.
   Cloud: Authentication, Sign in / Providers in the dashboard.
3. The secrets live in `supabase/.env` (git-ignored) or in the dashboard, never in the repo.

**Not verified here:** a real Google or GitHub sign-in (it needs your own OAuth app). The flow up to the provider redirect, and the callback handling, are tested; the provider's own consent screen is not.

## How it works (the Supabase side, from Day 17)

```
Browser (React + supabase-js)  ──HTTP──►  Kong gateway ──► GoTrue   (sign-up, sign-in, magic link, OAuth)  issues a JWT
   anon key + the user's JWT                           ├─► PostgREST (from().select()/insert()/rpc())     runs SQL AS the user
                                                       ├─► Storage   (upload, signed URLs)                 policies on storage.objects
                              ──WebSocket──►  Realtime (postgres_changes, Broadcast, Presence)  reads the WAL, filters with RLS
                                                              all of it ──► PostgreSQL 17 (the one source of truth)
```

The browser only ever holds the **anon key** (public) and the signed-in user's **JWT**. PostgREST puts the JWT's claims into the Postgres session, so `auth.uid()` inside a policy is the signed-in user. That is why the security rules live in the database and a client cannot get around them.

### Schema (9 tables)

`profiles` (one per auth user, created by a trigger), `notes`, `tags`, `note_tags` (many to many), `files` (with `thumb_path` since Day 24), `rooms`, `room_members`, `messages`, `notifications`.

- **Generated columns:** `rooms.slug` (from the name) and `notes.fts`, a `tsvector` with a GIN index for full-text search.
- **Indexes:** composite (`owner_id, created_at desc`), partial (pinned notes only, unread notifications only), GIN for search, and foreign-key indexes.
- **Constraints:** `check` on username format and priority range, unique `(owner_id, name)` for tags, `on delete cascade` for everything owned by a user.

### Row Level Security

| Table | Who can do what |
|---|---|
| `profiles` | everyone signed in reads; only the owner updates (a trigger creates it, so there is no insert policy) |
| `notes` | read my own and `team` ones; write only my own |
| `tags`, `note_tags` | read all tags; I manage my own tags and links on my own notes |
| `files` | I manage mine; room members read files attached to messages they can see |
| `rooms`, `room_members` | public rooms are readable and joinable; private rooms only by members |
| `messages` | read and send in rooms I can access; edit and delete only my own |
| `notifications` | read mine; the client may only set `read_at` (column-level privilege); the rows are created by a trigger |
| `storage.objects` | `avatars` public to read, write only under my own folder; `attachments` private, owner or room member |

Two tricks to know: policies are written `(select auth.uid())` so Postgres evaluates it once per query, not once per row; and policies that look into another table which itself has policies (for room membership) go through `security definer` helper functions, otherwise Postgres reports infinite recursion.

### Functions and triggers

| Name | Kind | What |
|---|---|---|
| `handle_new_user` | trigger on `auth.users` | creates the profile from the sign-up metadata |
| `add_room_creator` | trigger | the creator becomes a member of their new room |
| `notify_mentions` | trigger on `messages` | `@username` in a message creates a notification |
| `set_updated_at`, `mark_message_edited` | triggers | bookkeeping columns |
| `search_notes(q)` | RPC | `websearch_to_tsquery`, `ts_rank`, `ts_headline` (marks matches with `[[ ]]`, not HTML) |
| `unread_counts()`, `mark_room_read(room)` | RPC | unread badges |
| `workspace_stats()` | RPC | the dashboard numbers in one round trip |
| `is_room_member`, `can_access_room` | `security definer` helpers | used by policies to avoid recursion |

The RPCs are `security invoker`: they run with the caller's rights, so RLS still applies inside them (a search never returns someone's private note).


## Scripts

```bash
npm run perf                              # the measurements above (Day 24)
npm run perf:data -- add|remove|status    # the large test data set (Day 24)
node scripts/serve-dist.mjs               # the production build on :4190, compressed and cached like a real host (after npm run build)
node scripts/backfill-images.mjs [--all]  # resized copies of older pictures (Day 24)
npm run contrast                          # every token pair against WCAG AA (Day 22)
```

## Tests

```bash
npm test                 # 321 unit and component tests (fake supabase client)
npm run db:test          # 82 pgTAP assertions inside the real database
npm run test:e2e         # 81 browser tests against the real local stack (dev server)
npm run test:e2e:prod    # the same 81 against the production build
npm run lint
```

| Layer | Added on Day 24 |
|---|---|
| Unit / component | memo proof (50 messages, with and without stable handlers), the debounced mention lookup, avatar variants and thumbnails (upload, replace, roll back a half-saved avatar, delete), paged file listing |
| Database (pgTAP) | `files.thumb_path`: optional, and only inside the owner's folder |
| Browser (Playwright, Chrome) | a 1600 px avatar stored and served as WebP with `srcset`, fixed size and high priority; a 2000 px photo's thumbnail under 20 KB; 150 files in a virtualised list (only some rows in the page, all reachable, correct `aria-setsize`); chat scroll-up loading; lazy pages (not downloaded until wanted, preloaded on pointing, the loading state on a slow download, then focus on the new heading). Everything from Day 22 still runs: axe WCAG 2.2 AA, keyboard, 320 px, text at 200% |

## Problems found on the way (and fixed)

- **Two-thirds of the files were unreachable.** The Files page listed only the newest 100. Found while building the large data set, fixed by the virtualised, infinitely loading list.
- **A click on a lazy page seemed to do nothing on a slow connection.** React Router's transitions keep the old page visible while the new chunk loads. Fixed with a progress bar and a screen-reader status (found by a browser test).
- **Focus after navigation landed before the lazy page existed.** It now waits for the new page's heading.
- **Prefetching other pages during load slowed the current one** (≈0.3 s of LCP). It now waits until 2 s after load.
- **Lighthouse scores jumped between 73 and 90 from run to run.** The cause was the 1 MB avatar finishing before or after the main content in the simulation, not the code splitting. Fixed by M4's resizing.
- **Screen readers would have heard "item 5 of 100" in a list of 300.** react-window sets `aria-setsize` to the rows loaded so far. Overridden with the real total (a browser test caught it).
- **`role="combobox"` on the chat textarea** isn't allowed by ARIA in HTML. Day 22's WCAG-only rules passed it; Lighthouse's didn't.
- **At 200% text, "Messages today 130" stuck out of the Dashboard** by 9 px, once the count reached three digits. The stat rows now wrap.

## Limits

- **Measured locally:** Huddle runs against the local Supabase stack and isn't deployed. Lighthouse simulates the slow phone and network (that's how it scores anyway), but there's no real CDN, and the local API doesn't compress its JSON as Supabase's cloud does.
- **Chrome only**, and no real phone.
- **Image resizing needs a browser with canvas WebP encoding.** Others upload the original, as before. The backfill script runs against the local stack only.
- **Files on mobile went 95 → 91:** react-window and a second download step for the page's code, against every file being reachable and 17 MB of images less. A documented trade-off.
- **Chat isn't virtualised** (see above), and the **React Compiler** was measured, not adopted.
- Day 22's and Day 17's limits still apply: OAuth providers unverified, the VoiceOver pass not run by a person, Realtime isn't guaranteed delivery.
