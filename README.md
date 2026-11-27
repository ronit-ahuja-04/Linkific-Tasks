# Linkific Tasks: Month 1 Training Portfolio

**Author:** Ronit Ahuja
**Programme:** Linkific internship, Month 1 (training phase)
**Status:** Days 1–26 delivered (Days 25–30 Capstone in progress)

One repository, one folder per training day. Days 1–3 are small standalone deliverables. From Day 5 onward the work compounds into a single product, **HackHQ**, a control room for a 24-hour hackathon, rebuilt each day around the concept being taught.

---

## 1. Product requirements (programme level)

### Problem
The training programme asks for a new core web skill every day. Isolated toy exercises prove each skill once and then get thrown away, so nothing shows how the skills fit together.

### Goal
Deliver every day's task as real, reviewable work: planned first, built in small milestones, merged through pull requests, tested and documented. From Day 5, make each day build on the last so the repo reads as one product evolving.

### Requirements

| #   | Requirement                                                                                       | How it is met                                                     |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| R1  | Each day covers its full task scope, with no skipped learning objectives                          | Per-day task coverage matrices in each README                     |
| R2  | Each day is documented: README, plus a PRD or plan where the task is non-trivial                  | See the index below                                               |
| R3  | Work ships via feature branch → atomic conventional commits → PR → merge commit                   | `git log --merges`, PRs #1–#36 and later                          |
| R4  | Scope guardrails are respected (for example: only the hooks or APIs the day's task names)         | Guardrails listed in the Day 5–7 READMEs                          |
| R5  | Behaviour is verified, not assumed                                                                | Vitest suites from Day 5; lint and build clean                    |
| R6  | UI is responsive, accessible and supports dark mode from Day 5 onward                             | Semantic HTML, ARIA, keyboard support, theme tokens               |

### Out of scope
Backend services, authentication against a real server, and any library the day's task does not name.

### Success criteria
- Every day has a merged PR trail and a README a reviewer can follow without asking.
- Every app day installs, lints, tests and builds from a clean checkout.
- The HackHQ app keeps all earlier features working while the stack underneath changes.

---

## 2. Day-by-day index

| Day | Topic                                    | Deliverable                                                      | Docs                                                                                                            |
| --- | ---------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | HTML5, CSS3, responsive design           | 4 compounding projects: responsive nav, card grid, blog, portfolio | [README](Day-01/README.md) · [PRD](Day-01/PRD.md)                                                                |
| 2   | Modern JavaScript                        | Practice scripts plus four client-side apps (ES6+, DOM, async)   | [README](Day-02/README.md) · [PRD](Day-02/PRD.md) · [Architecture](Day-02/ARCHITECTURE.md)                       |
| 3   | Git, GitHub, npm                         | `repo-report` CLI using the GitHub REST API, lodash and date-fns | [README](Day-03/README.md)                                                                                       |
| 4   | React basics                             | DevHub: components, props, keys, composition, conditional UI     | [README](Day-04/README.md)                                                                                       |
| 5   | React state and events                   | HackHQ control room: 5 stations, State Lab, State X-ray, 58 tests | [README](Day-05/README.md) · [PRD](Day-05/docs/Day5_PRD.md) · [Architecture](Day-05/docs/Day5_TECH_STACK_AND_ARCHITECTURE.md) |
| 6   | `useEffect` and custom hooks             | HackHQ Live: debounced directory, hack clock, localStorage       | [README](Day-06/hackhq-live/README.md) · [Plan](Day-06/DAY6_PLAN.md)                                              |
| 7   | React Router and navigation              | HackHQ Router: real URLs for every station, protected routes     | [README](Day-07/hackhq-router/README.md) · [PRD](Day-07/Day7_PRD.md) · [Architecture](Day-07/Day7_TECH_STACK_AND_ARCHITECTURE.md) · [Design spec](Day-07/Day7_DESIGN_SPEC.md) |
| 8   | Tailwind CSS                             | HackHQ Tailwind: full restyle, design tokens, dark mode          | [README](Day-08/hackhq-tailwind/README.md) · [PRD](Day-08/Day8_PRD.md)                                           |
| 9   | Bootstrap 5                              | HackHQ Bootstrap: redesign with two new features                 | [PRD](Day-09/Day9_PRD.md) · [Baseline](Day-09/BASELINE.md) · [Bootstrap vs Tailwind](Day-09/BOOTSTRAP_VS_TAILWIND.md) |
| 10  | styled-components                        | HackHQ Styled: styled-components redesign                        | [PRD](Day-10/Day10_PRD.md) · [Report](Day-10/DAY10_REPORT.md) · [Comparison](Day-10/STYLING_COMPARISON.md)          |
| 11  | Redux Toolkit                            | FlowLane: board, chat and notifications on Redux Toolkit         | [PRD](Day-11/Day11_PRD.md) · [Report](Day-11/DAY11_REPORT.md)                                                    |
| 12  | React Context                            | FlowLane with Context for auth, theme and language               | [PRD](Day-12/Day12_PRD.md) · [Report](Day-12/DAY12_REPORT.md) · [Comparison](Day-12/STATE_MANAGEMENT_COMPARISON.md) |
| 13  | Lodash                                   | DataDesk: a Lodash lab                                           | [PRD](Day-13/Day13_PRD.md) · [Report](Day-13/DAY13_REPORT.md) · [Lodash vs native](Day-13/LODASH_VS_NATIVE.md)     |
| 14  | Recharts                                 | SalesPulse: a Recharts dashboard                                 | [PRD](Day-14/Day14_PRD.md) · [Report](Day-14/DAY14_REPORT.md) · [Chart guide](Day-14/CHART_CHOICE_GUIDE.md)        |
| 15  | Authentication, JWT, OAuth               | FlowLane with GitHub sign-in, issue import and a JWT-checking API | [README](Day-15/flowlane-auth/README.md) · [PRD](Day-15/Day15_PRD.md) · [Report](Day-15/DAY15_REPORT.md)          |
| 16  | Firebase: Storage and real-time          | FlowLane with image uploads, a live dashboard and a setup guide  | [README](Day-16/flowlane-firebase/README.md) · [PRD](Day-16/Day16_PRD.md) · [Report](Day-16/DAY16_REPORT.md)       |
| 17  | Supabase                                 | Huddle: a team workspace on Supabase (Postgres, Auth, Row Level Security, Realtime, Storage) | [README](Day-17/huddle/README.md) · [PRD](Day-17/Day17_PRD.md) |
| 18  | TypeScript for React                     | A TypeScript workbook, and SalesPulse converted to strict TypeScript with zero `any` | [Workbook](Day-18/ts-basics/README.md) · [SalesPulse TS](Day-18/salespulse-ts/README.md) · [PRD](Day-18/Day18_PRD.md) |
| 19  | Advanced TypeScript, typed Redux         | An advanced-TypeScript workbook, and SalesPulse on a fully typed Redux Toolkit store | [Workbook](Day-19/ts-advanced/README.md) · [SalesPulse](Day-19/salespulse-ts-adv/README.md) · [PRD](Day-19/Day19_PRD.md) |
| 20  | Next.js fundamentals                     | Dispatch: a Next.js App Router blog with SSG, ISR, SSR and CSR shown live | [README](Day-20/nextjs-blog/README.md) · [PRD](Day-20/Day20_PRD.md) |
| 21  | Next.js advanced and deployment          | Intern Quest: the internship logbook as an RPG, with NextAuth, API routes, proxy.ts, Supabase, deployed on Vercel (the live site runs the Day 23 version since Day 23) | [README](Day-21/intern-quest/README.md) · [Deployment guide](Day-21/intern-quest/docs/DEPLOYMENT.md) · [PRD](Day-21/Day21_PRD.md) |
| 22  | UI/UX design principles                  | Huddle redesigned: a design system (tokens, Inter, a living style guide), every page rebuilt on it, WCAG 2.2 AA with every fix tested | [README](Day-22/huddle-redesign/README.md) · [Design system](Day-22/huddle-redesign/DESIGN.md) · [Accessibility audit](Day-22/huddle-redesign/ACCESSIBILITY_AUDIT.md) · [Before/after](Day-22/huddle-redesign/docs/GALLERY.md) · [PRD](Day-22/Day22_PRD.md) |
| 23  | CORS, error handling and debugging        | Intern Quest made to fail well: a measured inventory of 33 failures before and after, one error model, error boundaries at every level, skeletons, toasts, a public CORS API with a live lab on a second origin, and a debugging guide ([live](https://intern-quest-smoky.vercel.app)) | [README](Day-23/intern-quest/README.md) · [Error inventory](Day-23/intern-quest/docs/ERROR_INVENTORY.md) · [CORS](Day-23/intern-quest/docs/CORS.md) · [Debugging](Day-23/intern-quest/docs/DEBUGGING.md) · [CORS lab](Day-23/quest-card-embed/README.md) · [PRD](Day-23/Day23_PRD.md) |
| 24  | Performance optimisation                 | Huddle made fast, measured by one script before and after: lazy routes with preloading, `React.memo`/`useCallback`/`useMemo` where they pay (12,902 → 128 renders per 5 messages), images resized to WebP in the browser (Files 17 MB → 8 KB), a virtualised Files list, Lighthouse 90+ on every page on mobile and 100 on desktop, and the React Compiler compared with memoising by hand | [README](Day-24/huddle-fast/README.md) · [Performance](Day-24/huddle-fast/docs/PERFORMANCE.md) · [Before](Day-24/huddle-fast/docs/perf/before.md) / [after](Day-24/huddle-fast/docs/perf/after.md) · [PRD](Day-24/Day24_PRD.md) |
| 25  | Capstone planning & architecture         | SkillForge LMS: Day 25–30 capstone architecture, Postgres RLS + anti-farming RPC schema, Phase 1 RPG foundation + playable Micro-Quest Arcade, Quest Path & Boss Battles | [README](Day-25/README.md) · [Proposal](Day-25/docs/PROJECT_PROPOSAL.md) · [Tech stack](Day-25/docs/TECH_STACK_DECISION.md) · [Architecture](Day-25/docs/ARCHITECTURE.md) · [Task breakdown](Day-25/docs/TASK_BREAKDOWN.md) · [PRD](Day-25/_bmad-output/planning-artifacts/prds/prd-Day-25-2026-11-26/prd.md) · [App](Day-25/skillforge-lms/README.md) |
| 26  | Core features development                | SkillForge LMS core kit & auth: typed UI Component Library + `/components` showcase, decomposed `Navbar`/`Footer`/`PageHeader`, `404` route, persistent auth & `/auth/callback`, `uiSlice` persistence, and 34 Vitest specs across 4 stacked PR branches | [README](Day-26/README.md) · [Component docs](Day-26/COMPONENTS.md) · [App](Day-25/skillforge-lms/README.md) |

---

## 3. The HackHQ thread (Days 5–8)

```text
Day 5  hackhq (state)  ->  Day 6  hackhq-live  ->  Day 7  hackhq-router  ->  Day 8  hackhq-tailwind
useState, events          useEffect, hooks         React Router 7            Tailwind CSS 4
```

| Day | What changed                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------- |
| 5   | Stations built with `useState` only: check-in counter, checklist, team form, swag cart, theme switch      |
| 6   | Side effects: debounced search with abort, hack clock with cleanup, viewport badge, safe localStorage     |
| 7   | One-screen toggling replaced by real routes. Refresh, bookmark and Back now work. Protected routes added  |
| 8   | The 5,400-line hand-written stylesheet replaced by Tailwind utilities and ~230 lines of tokens and base CSS. Behaviour, routes and tests unchanged |

---

## 4. Running a project

Every app day (4–8) is a Vite project with the same scripts:

```bash
cd Day-08/hackhq-tailwind
npm install
npm run dev
npm run lint
npm test
npm run build
```

Days 1–2 open directly in a browser (see each README). Day 3 is a Node CLI (`cd Day-03 && npm install`).

---

## 5. Working agreement

- **Plan first.** Non-trivial days start with a PRD or plan, then split into milestones.
- **Small, conventional commits.** `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- **One branch per milestone**, merged with a merge commit via a pull request.
- **Verify before claiming done.** Lint, tests and build are run; docs record what was actually checked.

## 6. Stack at a glance

HTML5 · CSS3 · JavaScript (ES2020+) · Node.js 20+ · Git/GitHub · npm · React 19 · Vite · React Router 7 · Tailwind CSS 4 · Vitest · ESLint
