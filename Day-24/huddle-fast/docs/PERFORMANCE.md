# Performance (Day 24)

What makes Huddle slow, measured before any change, and what each milestone does about it.
- **The numbers:** all of them come from `npm run perf`. It builds the app, runs Lighthouse (signed in, median of 3 runs) and replays real interactions, then writes [perf/before.md](perf/before.md).
- **The final run:** the same script, run at the end, writes `perf/after.md`.

## How it is measured

| What | How | Script |
|---|---|---|
| Bundle | build manifest + gzip/brotli sizes; "initial" = the entry chunk and its static imports (needed before the first render); treemap with `rollup-plugin-visualizer`, Vite's counterpart of webpack-bundle-analyzer | `scripts/perf/bundle.mjs` |
| Lighthouse | Lighthouse 12 on the **production build**, served with brotli/gzip like a static host; `/login` signed out, five app pages signed in (session kept, HTTP cache cleared before every run); mobile (default throttling) and desktop; **median of 3 runs** | `scripts/perf/lighthouse.mjs` |
| Re-renders | React's DevTools hook (through `bippy`, the library behind react-scan), injected before React loads, counts every component that rendered in each commit. **No test code in the app** | `scripts/perf/render-counter.js`, `interactions.mjs` |
| Interaction cost | the Event Timing API (what INP is built on), long tasks, layout shift, image bytes, on the production build with the CPU slowed 4x | `scripts/perf/interactions.mjs` |
| Scale | a large test data set: a private room with **5,000 messages**, **1,000 notes**, **300 files** (38 photos) and photo avatars, for four test accounts | `scripts/perf-data.mjs add / remove / status` |

**The long chat session** is the key scenario: the Perf lab room after "Load earlier messages" 9 times, which is **500 messages on screen**, as a team chat open all day would be.

**Notes on the setup:**
- Huddle runs against the **local** Supabase stack, so there's no real network or CDN. Lighthouse simulates a slow phone and network on top, which is how its score is computed anyway.
- The local Supabase API doesn't compress its JSON answers. Lighthouse flags that ("Enable text compression": 20 KB on chat). It isn't the app: Supabase's cloud compresses.

## Baseline (25 Nov), in short

| | Value |
|---|---|
| Initial JavaScript | **one 638 KB file (178 KB gzip)** for every page; only the style guide is lazy |
| Lighthouse performance, mobile | Sign in 97 · Dashboard 89 · Chat 89 · Notes 93 · Files 95 · **Profile 74** |
| Lighthouse performance, desktop | 95 to 100 |
| Lighthouse accessibility / best practices | 100 / 100 (chat 99: see P-9) |
| Images | **Files page: 17.2 MB** (15 requests); every avatar a **1 MB photo shown 50× smaller** than downloaded |
| Receiving 5 messages (500 on screen) | **12,902 component renders**; **785 ms** of blocked main thread (CPU 4x slower) |
| Page size with 500 messages | 6,561 DOM elements |

## Findings

| # | Finding | Evidence | Fix in |
|---|---|---|---|
| P-1 | **Every page downloads the whole app.** One 638 KB chunk (178 KB gzip); Lighthouse finds about 90 KB of it unused on every page (≈600 ms on mobile). | bundle, Lighthouse "Reduce unused JavaScript" | M2 |
| P-2 | **Render-blocking CSS and fonts.** Three font families and styles (Inter, Inter italic, JetBrains Mono: 19 files) are declared on every page; the CSS blocks the first paint (≈450 ms on mobile). | Lighthouse "Eliminate render-blocking resources" | M5 |
| P-3 | **Images are full-size originals.** Avatars are 1600 px photos (~1 MB) shown at 32–96 px; file previews are 2000 px photos (~1.2 MB each). Files page: 17.2 MB. Profile on mobile: **LCP 8.3 s**, the avatar. | interactions (image bytes, 50× oversize); Lighthouse "Properly size images" (16 MB), "next-gen formats", "Defer offscreen images" | M4 |
| P-4 | **One new message re-renders the whole history.** With 500 messages on screen, 5 incoming messages cause 12,902 component renders (every `MessageItem`, its `Body` and `Avatar`, each time), 785 ms of blocked main thread. | render counts, long tasks | M3 |
| P-5 | **Long sessions grow the page without limit.** Every loaded message stays in the DOM: 500 messages = 6,561 elements. | DOM size | M4 (virtualisation) |
| P-6 | **Layout shift on the dashboard.** Mobile CLS 0.14, desktop 0.07: panels change height as their data arrives. | Lighthouse CLS | M4 / M5 |
| P-7 | **No early connection to Supabase.** Every page's data comes from another origin; the browser connects only once the JavaScript asks. | Lighthouse "Preconnect to required origins" (75–120 ms) | M5 |
| P-8 | **Repeat visits revalidate every file.** Hashed assets never change, but are served `max-age=0, must-revalidate` (no caching rules shipped). | server headers | M5 (`_headers`) |
| P-9 | **`role="combobox"` on the chat `<textarea>`** is not allowed by ARIA in HTML. Day 22's WCAG-only axe rules passed it; Lighthouse's best-practice rule doesn't. | Lighthouse accessibility 99 on chat (`aria-allowed-role`) | M5 |

## Already good (measured, kept)

- **Typing in the chat composer re-renders only the composer.** Its text is local state, so the 500 messages don't re-render while you type (32 key presses: 160 renders, all in the composer). Memoising the list would not change this case.
- **Notes are paginated by the server** (6 per page), so the list stays small whatever the number of notes. Typing in the search box re-renders those 6 cards: 850 renders for 10 key presses, cheap. It's a candidate for the "when not to memo" section, not a problem.
- **Total Blocking Time is near 0** on most pages: the main thread isn't busy during load. The JavaScript cost is download and parse, not long tasks.
- **Accessibility 100 and best practices 100** on the audited pages (except P-9).

## M2: code splitting

**What changed**

| Technique | Where | Why |
|---|---|---|
| **Route-based splitting**: every page is `React.lazy` | `src/routes.js`, `src/App.jsx` | a visit downloads the app shell, then only the page it shows |
| **Preload on intent** | `src/lib/lazyPage.js` (`preload()`), one delegated handler on the shell (`AppLayout`) for pointer over, focus and touch start on any internal link | the download starts 100–300 ms before the click, so a click rarely waits |
| **Preload at start-up** | `src/main.jsx` | the current page's chunk downloads in parallel with React starting and the session check, instead of after them (a waterfall). Without a stored session, `/login` is fetched too, since that is where the visitor is about to go |
| **Idle prefetch** of the main pages | `AppLayout` (`requestIdleCallback`) | touch screens have no hover; skipped when the browser asks to save data or the connection is 2G |
| **Fallbacks** | `PageLoading` inside the shell's `<Suspense>`; a full-page one for sign-in | a first visit to a page shows its shape, not a blank area |
| **A progress bar for navigations** | `AppLayout` (`.page-progress` + a status for screen readers) | React Router navigates inside a React **transition**, and during a transition React keeps the **old** page on screen instead of showing the fallback. Without this bar, a click on a slow connection would seem to do nothing (found by a browser test) |
| **Focus waits for the lazy page** | `AppLayout` (`MutationObserver`, up to 5 s) | Day 22's "focus moves to the new page's heading" ran one frame after navigation, before a lazy page had arrived |
| **Vendor chunks** | `vite.config.js` (`advancedChunks`: `react-vendor`, `supabase-vendor`) | libraries change far less often than the app: after a deploy that only changes app code, returning visitors keep them cached. Same first-visit bytes (+0.7 KB) |
| **Failed chunk downloads are retried** | `lazyPage.js` | a failed import (offline, or a deploy replaced the chunk) is forgotten, so the next attempt tries again |

**What was checked and NOT done (on purpose)**

- **Splitting small components.** The note editor is 3.5 KB of source, about 1 KB compressed. Loading it separately would add a network round trip to save 1 KB. Component-level splitting pays for heavy, rarely used parts. Here those were whole pages (the style guide, the Query lab), and they are now their own chunks. The image resizer in M4 will be loaded only when a file is picked.
- **Unused dependencies.** None found: every package is imported. `jsdom` is chosen per test file by a comment, and `@testing-library/dom` is a required peer of `@testing-library/react`.
- **Tree shaking.** The icons are imported by name in all 23 files, so only the icons used are bundled (about 8 KB in the first download), and there is no `import *` anywhere.
- **`iceberg-js`** (2 KB) arrives with Supabase's storage client. It can't be dropped without replacing `supabase-js`. Not worth it.

**What remains in the first download** is shared by every page, and that is why splitting cut "only" about 17%:
- React and react-dom, and the router;
- the Supabase client: auth, realtime, storage and the query builder, all built by `createClient`;
- the shell.

**Results** (numbers in [perf/m2.md](perf/m2.md); treemap [bundle-m2.html](perf/bundle-m2.html))

| | Before | M2 |
|---|---|---|
| Initial JavaScript (gzip) | 178.3 KB in 1 file | **148.0 KB** in 5 (react-vendor 79, supabase-vendor 54, app 13, two tiny) |
| Lazy JavaScript | 8.6 KB (style guide) | 55.8 KB in 27 chunks: every page, loaded when visited or prefetched |
| Lighthouse "unused JavaScript", mobile | Dashboard 92 KB · Notes 90 KB · Sign in 103 KB (≈600 ms) | **62 · 61 · 71 KB** (≈450 ms) |
| Sign in: JavaScript transferred | 151 KB | **135 KB** |
| Lighthouse performance, mobile (median of 3) | 97 · 89 · 89 · 93 · 95 · 74 | 95 · 85 · 90 · 91 · 93 · 73: within run-to-run variation |

**Honest reading:**
- Splitting cut the first download by 17% and "unused JavaScript" by a third. It did **not** move the Lighthouse scores: on this app the time goes elsewhere (P-3, the images).
- An app page now transfers slightly more in total (≈155 KB). That is the post-load prefetch of the other main pages, which Lighthouse still records after the page has finished.

**A regression found and fixed while measuring.** The first M2 run scored chat 73 and notes 72 on mobile (from 89 and 93). Two causes, separated by controlled runs on the same build (Notes, mobile, 3 runs each):

| Variant | Scores (LCP) |
|---|---|
| M2 as first built | 72 (8.4 s), 89 (3.4 s), 89 (3.4 s) |
| the same, with avatar images blocked | 88, 88, 88 (3.4 s) |
| no idle prefetch, avatars blocked | **91**, 90, 91 (3.1 s) |
| prefetch after load + 2 s (final), avatars blocked | 91, 90, 90 (3.1 s) |

1. **The 8 s runs are the 1 MB avatar photo (P-3), not the splitting.** The real timeline did not get worse (observed LCP 183 → 164 ms on Notes, 270 → 193 ms on chat). In Lighthouse's simulated slow phone, depending on request order, the avatar's ~5 s download lands before the LCP or after it, so the score jumps between ~73 and ~90. M4 makes the avatar ~100× smaller.
2. **Prefetching the other pages *during* load cost ≈0.3 s of LCP.** They competed with the page's own requests. The prefetch now waits for the load event plus 2 s.

**What a split costs:** the page's own chunk can only start once the main file runs. That is one extra round trip on a first visit (≈0.2 s on the simulated slow phone, Notes 2.9 → 3.1 s). Preloading at start-up keeps it to one trip, not two.

## M3: rendering (React.memo, useMemo, useCallback)

**What changed**

| Technique | Where | Why |
|---|---|---|
| **`React.memo(MessageItem)`** | `src/components/chat/MessageItem.jsx` | a long session has hundreds of messages on screen; before, every one re-rendered whenever the room did (each new message, each "is typing", each presence change) |
| **`useCallback` for `edit` and `remove`** | `RoomView.jsx` | memo compares props by identity: these two were new functions on every `RoomView` render, so memo alone would have done **nothing**. Proven by a unit test that renders 50 messages with and without stable handlers |
| **`useMemo` for the grouping flags** | `RoomView.jsx` | "does this message continue the previous person's group?" for every message, recomputed on every render before; now only when the list changes. The flags are booleans, so an unchanged message keeps the same value and memo can skip it |
| **Debounced @-mention lookup** (150 ms) | `Composer.jsx`, `MENTION_DEBOUNCE_MS` in `lib/chat.js` | each lookup is a database query; typing `@perf_te` sent 7 (6 thrown away), now one per pause |
| **Throttle, already right** | `useRoomChannel.js` | "is typing" goes out at most every 2 s *while* typing: a throttle, because it must keep going during typing. A debounce would only send it once typing stopped |

No custom comparison function is needed: `upsertMessage` copies only the row it changes, so every other message keeps the same object, and the default shallow comparison sees "unchanged".

**Results** (numbers in [perf/m3.md](perf/m3.md))

| Scenario: the Perf lab room, 500 messages on screen | Before | M3 |
|---|---|---|
| Receive 5 messages: component renders | 12,902 (every `MessageItem`, `Body`, `Avatar`, each time) | **128**: exactly 5 `MessageItem`s (the new ones), plus the room view, composer and sidebar around them |
| Receive 5 messages: main thread blocked, CPU 4x slower | 785 ms | **0 ms** |
| Type 32 characters in the composer: worst key press | 64 ms | 24 ms |
| Type 32 characters: component renders | 160 (only the composer) | 160 (unchanged: it was already right) |
| Lighthouse | | unchanged (memoisation changes what happens *after* load, not the load) |

**When NOT to memoise (measured, left alone)**

| Candidate | Why not |
|---|---|
| `Avatar`, `Body` inside `MessageItem` | they render only when their memoised parent does. A second memo would add a props comparison per message and save nothing |
| `NoteCard` | typing 10 letters in the notes search re-renders the 6 cards on the page (850 component renders), and every key press still paints within **16 ms** with the CPU 4x slower (no long tasks). Memo would also need three `useCallback`s in `NotesPage` (two handlers are inline arrows), all to save a few milliseconds of nothing |
| `Composer` | it re-renders when the room does, but it is one component holding a textarea; its own typing state is already local, which is why typing never re-rendered the message list |
| `useMemo` for `splitMentions(text)` in `Body` | a regular expression over one short message, and only when that message renders |
| "Avoid inline functions in JSX" as a rule | an inline arrow costs nothing on a DOM element (`<button onClick={() => …}>`). It only matters when passed to a **memoised** child, as `onEdit`/`onDelete` were |

**Keys.** Every list keyed by a stable id where the items can change order or have state (messages by `m.id`, notes, files, rooms). Five places use the index as key, and all are the legitimate case: a list that never reorders and whose items hold no state.
- `Body` and `Snippet`: the parts of one message or snippet, split by mentions or matches;
- the Query lab's event log (append-only) and result rows (replaced as a whole);
- the style guide's 12 decorative grid columns.

The rule "avoid index as key" protects against reordering lists with state, and none of these qualify.

**Already following the other best practices** (checked, nothing to change):
- props are destructured in the signature;
- components are small and single-purpose;
- fragments are used where no wrapper element is needed;
- state is kept where it's used (the composer's text is local to `Composer`, which is why typing never re-rendered 500 messages).

## M4: images and lists

**Images: what changed**

| Technique | Where | Why |
|---|---|---|
| **Resize in the browser at upload, to WebP** | `src/lib/images.js` (`resizeImage`, canvas → `image/webp`), loaded only when a file is picked | a phone photo is 2–5 MB and 3000+ px; Huddle shows avatars at 24–96 px and previews in a 56 px box. The browser makes the small copy once, so every later view downloads kilobytes |
| **Avatars: 64 and 256 px** | `uploadAvatar` (variants), `avatarSources` | 64 px is sharp for the 24/32 px avatars on 2x screens, 256 px for the 96 px profile picture. Served with `srcset` + `sizes`, so the browser picks |
| **File previews: a 160 px thumbnail** | `uploadThumbnail`, `files.thumb_path` (migration), `FilesPage` | the box is 56 px (112 on a 2x screen). The plan said ~480 px; measuring the box showed that would be 3x too large |
| **`width`/`height` on every image** | `Avatar`, `FileRow` | the space is reserved before the picture arrives, so nothing jumps (CLS) |
| **`loading="lazy"`, `decoding="async"`** | the same | an avatar 400 messages up a chat is not downloaded until scrolled near |
| **`fetchpriority="high"`, `loading="eager"`** | the profile picture (`Avatar priority`) | on the profile page the avatar *is* the main picture (the LCP element): ask for it first |
| **A year of caching on resized images** | `cacheControl: 31536000` | every new picture gets a new file name, so a cached copy is never out of date |
| **Backfill for older pictures** | `scripts/backfill-images.mjs` (`--all` for every account) | existing images had only originals; this makes the same copies with the app's own resizer (bundled and run in Chrome). Originals are kept |
| **Fallbacks** | everywhere | no canvas or WebP encoder in a browser means the original is uploaded as before. GIFs are not resized (animation) and SVGs not at all (vector) |

**A CDN.** Supabase Storage serves public files through its CDN in the cloud. Locally there is none, and the resized files are what make the difference either way: a CDN delivers 1 MB faster, but 4 KB fastest.

**Lists: what changed**

| List | Approach | Why |
|---|---|---|
| **Files** | **virtualised** (`react-window` 2, `List` with `useDynamicRowHeight`, scrolling with the window) **+ infinite loading** (pages of 100 with the total) | it showed only the newest 100 files: the rest were **unreachable**. Now all of them, in one list, with a few dozen rows in the page at any time. Rows are measured (a row grows when its share link is open). Each row keeps its identity (`rowKey` by id), and screen readers hear "item 5 of 300" (`aria-setsize` set to the real total, not the pages loaded so far: a browser test caught that) |
| **Chat** | **infinite scroll upward** (an `IntersectionObserver` on the "Load earlier" button, 300 px ahead) | reading back through history needs no clicks; the button stays for keyboard and screen-reader users. The reader's place is kept (test) |
| **Notes** | **pagination** (server-side, 6 per page; unchanged) | notes are browsed and filtered, not read in sequence: pages with "1–6 of 23" fit, and the list stays small whatever the total |

**Chat was NOT virtualised, on purpose** (decided with Ronit, from measurements). After M3, even 2,000 loaded messages scroll at 60 fps on a 4x slower CPU:

| Messages loaded | "Load earlier" | DOM elements | JS memory | Scroll frames (median / worst) |
|---|---|---|---|---|
| 500 | 236 ms | 6,585 | 15 MB | 17 / 18 ms |
| 1,000 | 246 ms | 13,077 | 16 MB | 17 / 34 ms |
| 2,000 | 415 ms | 25,500 | 21 MB | 17 / 20 ms |

Virtualising it would have broken two things that work today:
- **Screen readers:** the message log is a live region that announces added messages. A windowed list adds rows while you scroll, so old messages would be read out as new.
- **Keeping your place on "Load earlier":** prepending variable-height rows is the hardest case for windowed lists.

**Tried and not adopted: `content-visibility: auto`** on messages. The browser skips off-screen rows but keeps them in the page. Measured in single runs: "Load earlier" ~10–20% faster (448 → 399 ms at 2,000 messages), scrolling unchanged. Close to run-to-run noise, and it makes the browser estimate the heights the keep-your-place logic depends on. Not worth the risk here.

**Results** (numbers in [perf/m4.md](perf/m4.md); the test data's older pictures were backfilled with `scripts/backfill-images.mjs`)

| Page | Image bytes, before → M4 | Lighthouse mobile, before → M4 (runs) | |
|---|---|---|---|
| Files | **17,207 KB → 8 KB** (15 → 3 requests) | 95 → 91 (90, 91, 92) | only the previews near the screen are requested; the score cost is explained below |
| Profile | 1,010 KB → **13 KB** | **74 → 91** (91, 91, 91) | **LCP 8.3 s → 3.2 s**; CLS 0.050 → 0.001 |
| Chat | 4,018 KB → 7 KB | 89 → 89 (89, 89, 89) | the 73-point outliers of M2 are gone |
| Dashboard | 1,010 KB → 2 KB | 89 → 87 | CLS 0.14 remains: M5 |
| Desktop | | Chat, Notes, Profile 95 → **100** | |

- **What the image work fixed:** the 1 MB avatar caused the large swings between Lighthouse runs (M2). With it ~4 KB, every page's three runs now agree within 2 points.
- **What it didn't fix:** the mobile scores of the other pages stay around 87–91. What limits them now is the first download and render-blocking CSS and fonts, which is M5.
- **Files on mobile went 95 → 91, a real cost, not noise** (runs 95, 95, 95 → 90, 91, 92):
  - M2 took it to 93: the page's code now arrives in a second step.
  - M4 took it to 91: `react-window` added 6.6 KB to the Files chunk (4.4 → 11.0 KB gzip), and LCP went 2.6 → 2.9 s.
  - **The trade:** every file reachable (the 200 that were hidden) and 17 MB of images down to 8 KB, against ~0.3 s on a simulated slow phone's first visit. M5 works on that first download.

## M5: Lighthouse 90+ on every page

After M4, two mobile pages were under 90: Dashboard 87 (CLS 0.14) and Chat 89. What was left was the first load: layout shift, the work before a page's own data could start, and three of the baseline findings (P-6 to P-9).

**What changed**

| Fix | Where | Why |
|---|---|---|
| **Dashboard panels keep their size while loading** (P-6) | `Panels.jsx` (`LoadingRows`: five placeholder rows shaped like the real ones), `dashboard.css` (`.dash-panel-body`, `min-height: 21rem`) | each panel was a one-line "Loading…" that grew to five rows when its data came, pushing the panels below it down. Now the space is there from the start, so the data fills it in place |
| **Preconnect to Supabase** (P-7) | `index.html`: `<link rel="preconnect" href="%VITE_SUPABASE_URL%" crossorigin>` | every page's data comes from another origin. The browser now opens that connection (DNS, TCP, TLS) while the JavaScript downloads, not after. `crossorigin` because the queries are CORS requests, which use a separate connection |
| **Sign-in options asked for only where they are shown** | `AuthContext` (`loadProviders`), `OAuthButtons` | `GET /auth/v1/settings` (which OAuth buttons are on) ran at the start of **every** page, signed in or not, and as a CORS request with an `apikey` header it needed a **preflight** first. Signed-in pages now send 2 fewer requests (Dashboard 50 → 48, Chat 52 → 50, Notes 45 → 43) |
| **A small loading splash in the HTML** | `index.html` (`.boot`, inside `#root`, replaced when React renders) | before, the page stayed blank until all the JavaScript had run. It is deliberately small: a large splash would become the "largest contentful paint" itself and make LCP look good while the real content was just as slow. Checked: the LCP element is still the real content on every page (the sign-in text, the dashboard's "caught up" line, a chat message, a note) |
| **Caching rules for the built files** (P-8) | `public/_headers` | files in `/assets/` have a content hash in their name, so they are cached for a year (`immutable`): a returning visitor downloads nothing that has not changed. `index.html` is `no-cache` (checked on every visit), because it names the current files. Read by Netlify and Cloudflare Pages (and the perf server); Vercel would need the same rules in `vercel.json` |
| **The chat textbox's ARIA** (P-9) | `Composer.jsx` | `role="combobox"` is not allowed on a `<textarea>`. A textbox may still carry `aria-autocomplete`, `aria-controls` and `aria-activedescendant`, which is all the @-mention list needs: screen readers still hear the highlighted suggestion. `aria-controls` is set only while the list exists (a reference to a missing element is invalid: axe caught that in this change) |

**Found on the way (not a performance fix):** the production browser tests failed the WCAG "text at 200%" check on the Dashboard. "Messages today" had reached 130 (the tests send messages), and at double text size a three-digit count no longer fit beside its label, so it stuck 9 px past the edge of the page. A pre-existing layout bug that the growing data exposed, not the M5 panel change (checked with and without it). The stat rows now wrap, so the number moves under its label.

**Results** (numbers in [perf/m5.md](perf/m5.md), mobile, median of 3 runs)

| Page | Before | M4 | **M5** | Runs | What moved |
|---|---|---|---|---|---|
| Sign in | 97 | 95 | **94** | 94, 94, 94 | within M4's range (94–95); see below |
| Dashboard | 89 | 87 | **94** | 93, 94, 94 | **CLS 0.140 → 0.018** |
| Chat | 89 | 89 | **90** | 90, 90, 90 | first paint 2.27 → 1.96 s; accessibility 99 → **100** |
| Notes | 93 | 90 | **91** | 91, 91, 91 | first paint 2.27 → 1.96 s |
| Files | 95 | 91 | **91** | 91, 91, 92 | first paint 2.36 → 2.12 s |
| Profile | 74 | 91 | **92** | 92, 92, 92 | CLS 0.047 → 0.000 |

- **Desktop: 100 on all six pages** (Notes 99 in one run). Accessibility and best practices: **100 on all twelve** audits.
- **Every page is now 90 or more on mobile**, which was the goal. The three runs of each page agree within 1 point.
- **Lighthouse no longer suggests "Preconnect to required origins"** (it estimated 88 ms on Dashboard and Profile in M4).
- **First paint is ~0.3 s earlier on the app pages.** That is the splash appearing as soon as the CSS is in. LCP itself moved less, because it waits for the page's data.
- **Sign in 95 → 94 is within noise, but its LCP did get 170 ms later in the simulation.** The page used to ask for the sign-in options at start-up; now it asks when the buttons appear, slightly later. That costs nothing signed in, where the request is now never sent at all.

**What still limits mobile scores** (Lighthouse's remaining suggestions, all pages):
- **Unused JavaScript, 60–68 KB, about half each from the two vendor chunks** (Dashboard: 32 of 46 KB of `supabase-vendor`, 30 of 68 KB of `react-vendor`). That is code the first render doesn't run: react-dom's paths for features a page doesn't use yet, and supabase-js's Realtime, Storage and the auth flows other than "restore the session". supabase-js is one client object, so splitting it would mean loading the client in pieces, a large change for a few points. react-dom can't be split at all.
- **Render-blocking CSS, ~150 ms:** one 10.5 KB (gzip) stylesheet. Inlining the "critical" CSS of each page would remove it, at the cost of a build step and two copies of the styles. Not done.
- **Fonts: two files, 87 KB.** Inter for the text, and JetBrains Mono, which every page really uses (the teaching panels show code). Both use `font-display: swap`, so text is never hidden waiting for them; they are not render-blocking.
- **Chat LCP: 87% of it is "render delay"**, meaning the page is waiting for its JavaScript and then its messages, not for a slow download. The 300 ms Lighthouse attributes to "Enable text compression" there is the **local** Supabase API, which doesn't compress (see the notes at the top); the cloud does.

**CORS preflights, a cost Day 23 explained.** Huddle's queries go to another origin with an `Authorization` header, so the browser asks permission (an `OPTIONS` preflight) before sending them. The answer can be cached with `Access-Control-Max-Age`, but the local Supabase sends none, so Chrome keeps each for only its default 5 seconds. A page load sends **7–9 of them** (Dashboard 9, Chat 8, Notes 7 in M5). M5 removed the one that was avoidable (the settings request). Removing the rest would need a **same-origin proxy**: the app calling `/api/...` on its own host, which forwards to Supabase. No more CORS, so no preflights, at the cost of a server hop on every request and running that proxy. Recommended for a production deployment where the first load matters most. Not done here.
