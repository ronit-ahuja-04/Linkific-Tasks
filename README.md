# Linkific Tasks: Month 1 Training Portfolio

**Author:** Ronit Ahuja
**Programme:** Linkific internship, Month 1 (training phase)
**Status:** Days 1–8 delivered

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
| 8   | Tailwind CSS                             | HackHQ Tailwind: full restyle, design tokens, dark mode          | [README](Day-08/hackhq-tailwind/README.md)                                                                       |

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
