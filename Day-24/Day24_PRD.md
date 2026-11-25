# PRD: Huddle, made fast. Performance optimisation and best practices (Day 24)

| Field     | Value |
| --------- | ----- |
| Owner     | Ronit Ahuja |
| Programme | Linkific internship, Month 1 (training phase), Day 24 |
| Repo path | `Linkific-Tasks/Day-24/huddle-fast` (a copy of `Day-22/huddle-redesign`) |
| Status    | **Built.** PRs #122 to #126, plus the documentation PR |
| Companion | the project README (the techniques), `docs/PERFORMANCE.md` (every measurement), `docs/perf/before.md` and `after.md` (generated reports) |

## 1. Summary

Make a real React app measurably faster, and show the evidence. The app is **Huddle** (Day 22: React 19, Vite, Supabase, redesigned and accessible). The work started with a **baseline taken by one script**:
- bundle sizes;
- Lighthouse signed in, median of 3 runs, mobile and desktop;
- component renders counted while the app is used;
- interaction timings with the CPU slowed 4x.

It runs on a large test data set (5,000 messages, 1,000 notes, 300 files). The baseline gave nine findings, P-1 to P-9. Each milestone fixed some of them and ran the same script again, ending with the same script producing the "after" report.

## 2. Goals and non-goals

**Goals**
- Lighthouse performance 90+ on every page, on **mobile**, the harder profile, not only desktop.
- A long chat session (500 messages on screen) stays responsive: no blocked main thread when messages arrive.
- Each technique from the brief is applied where it is needed: React.memo, useMemo/useCallback, code splitting and lazy routes, image optimisation, virtualisation. Each comes with a measurement showing it helped, or that it wasn't needed.
- Features, design and accessibility (WCAG 2.2 AA from Day 22) unchanged; every Day 22 test still passes.

**Non-goals**
- New features or a redesign.
- Deployment: Huddle runs against the local Supabase stack (as on Day 22).
- Rewriting libraries (supabase-js, react-dom) to make them smaller.

## 3. Decisions

| Decision | Choice | Why |
|---|---|---|
| Which app | Huddle (Day 22), copied to Day 24 | a real SPA with chat, lists and images: every topic in the brief has a real case in it |
| Evidence first | `npm run perf`: bundle + Lighthouse + render counts + timings, one report per milestone | optimisation becomes a table of facts; the same script measures the result |
| Test data | a script that **adds** a large data set for four test accounts, and removes it | the slow cases only appear at scale; nothing existing is touched |
| Render counting | bippy (React's DevTools hook), injected by Playwright | the Profiler's data, scripted and repeatable, with no test code in the app |
| Memoisation | targeted: `memo(MessageItem)` + `useCallback` + `useMemo`; a "when not to memo" table | memo everything adds code and comparisons for nothing; the measurements said where it pays |
| Images | resized to WebP **in the browser** at upload; `srcset`, fixed sizes, lazy, `fetchpriority` | no server-side image service needed; every later view downloads kilobytes |
| Virtualisation | `react-window` 2, for the **Files** list (with infinite loading) | chosen with Ronit after measuring: chat stays smooth at 2,000 messages, and windowing it would break its live region and scroll anchoring |
| React Compiler | measured against hand-written memoisation, not adopted | a build-time Babel pass; the comparison answers "would it have been enough?" |

## 4. Requirements and verification

| # | Requirement | Verified by |
|---|---|---|
| R1 | Lighthouse performance 90+ on every page, mobile and desktop | `docs/perf/after.md` (median of 3) |
| R2 | Each page downloads only its own code first; other pages load when wanted | bundle report (initial vs lazy); `e2e/code-splitting.spec.js` |
| R3 | A new chat message renders only itself, with 500 on screen | render counts (12,902 → 128); `test/memo.test.jsx` |
| R4 | Images are stored and served at the size shown | `e2e/images.spec.js`; image bytes per page in the reports (Files 17.2 MB → 8 KB) |
| R5 | Every file is reachable, in a list that stays small in the DOM | `e2e/virtual-list.spec.js` (150 files, only some rows in the page, correct `aria-setsize`) |
| R6 | No layout shift from loading content (CLS < 0.1) | Lighthouse CLS per page (Dashboard 0.14 → 0.018) |
| R7 | Accessibility unchanged or better | axe WCAG 2.2 AA e2e suite; Lighthouse accessibility 100 everywhere |
| R8 | All Day 22 behaviour still works | the full suite: 321 unit, 82 pgTAP, 81 browser tests (dev server and production build) |

## 5. Milestones

| # | Milestone | PR |
|---|---|---|
| M1 | Baseline: copy, the test data set, `npm run perf`, findings P-1 to P-9 | #122 |
| M2 | Code splitting: lazy routes, preloading, vendor chunks, progress bar | #123 |
| M3 | Rendering: `memo`, `useCallback`, `useMemo`, debounced mention lookup, "when not to memo" | #124 |
| M4 | Images and lists: WebP resizing, thumbnails, `srcset`, lazy loading; virtualised Files list, chat infinite scroll | #125 |
| M5 | Lighthouse 90+: CLS, preconnect, fewer requests, splash, caching headers, ARIA fix | #126 |
| M6 | React Compiler comparison, the "after" report, README, PRD | this PR |

## 6. Risks and what happened

| Risk | What happened |
|---|---|
| Memoising for show | measured instead: one `memo` + two `useCallback` + one `useMemo` did the work; the cases left alone are documented with their numbers |
| Lighthouse noise hides real changes | median of 3 runs, every run shown; a 73-vs-90 swing was traced to the 1 MB avatar, not to the code |
| Code splitting makes navigation feel slower | found: transitions keep the old page visible. Fixed with preloading and a progress bar |
| Splitting/prefetching slows the first page | found: prefetching during load cost ≈0.3 s of LCP. Moved to after load |
| Virtualisation breaks accessibility | the Files list keeps the right `aria-setsize`; chat was not virtualised for this reason |
| A trade-off presented as a win | Files on mobile went 95 → 91 (react-window, a second download step); documented as the price of reaching every file and 17 MB fewer image bytes |

## 7. Open items

- **Not deployed.** Measured on a local production build with Lighthouse's simulated phone and network; no real CDN.
- **CORS preflights:** each page still sends 7–9. A same-origin proxy is recommended for production.
- **Unused JavaScript:** about 60 KB of react-dom and supabase-js that the first render doesn't run. Neither splits further.
- **Chrome only**, no real device.
- **The React Compiler** is documented as the recommendation for a new project (compiler + `memo` on long-list rows), not adopted here.
