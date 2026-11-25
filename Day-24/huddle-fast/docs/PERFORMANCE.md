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
| Scale | a large test data set: a private room with **5,000 messages**, **1,000 notes**, **300 files** (40 photos) and photo avatars, for four test accounts | `scripts/perf-data.mjs add / remove / status` |

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
| Receiving 5 messages (500 on screen) | **8,655 component renders**; **785 ms** of blocked main thread (CPU 4x slower) |
| Page size with 500 messages | 6,561 DOM elements |

## Findings

| # | Finding | Evidence | Fix in |
|---|---|---|---|
| P-1 | **Every page downloads the whole app.** One 638 KB chunk (178 KB gzip); Lighthouse finds about 90 KB of it unused on every page (≈600 ms on mobile). | bundle, Lighthouse "Reduce unused JavaScript" | M2 |
| P-2 | **Render-blocking CSS and fonts.** Three font families and styles (Inter, Inter italic, JetBrains Mono: 19 files) are declared on every page; the CSS blocks the first paint (≈450 ms on mobile). | Lighthouse "Eliminate render-blocking resources" | M5 |
| P-3 | **Images are full-size originals.** Avatars are 1600 px photos (~1 MB) shown at 32–96 px; file previews are 2000 px photos (~1.2 MB each). Files page: 17.2 MB. Profile on mobile: **LCP 8.3 s**, the avatar. | interactions (image bytes, 50× oversize); Lighthouse "Properly size images" (16 MB), "next-gen formats", "Defer offscreen images" | M4 |
| P-4 | **One new message re-renders the whole history.** With 500 messages on screen, 5 incoming messages cause 8,655 component renders (every `MessageItem`, its `Body` and `Avatar`, each time), 785 ms of blocked main thread. | render counts, long tasks | M3 |
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
