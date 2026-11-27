# Task Breakdown, Estimates & 5-Phase Roadmap — SkillForge LMS (Days 25–30)

---

## 1. Milestones & Deadlines Across Days 25–30

| Phase / Day | Deadline | Milestone | Core Focus | Exit Gate |
| --- | --- | --- | --- | --- |
| **Day 25 (Setup)** | Day 25 EOD | **M0 — Blueprint & Scaffold** | Planning docs, RPG/LMS architecture, Postgres schema/RPCs, Vite + TS + Tailwind v4 + RTK shell | `typecheck`, `lint`, `format:check`, `test`, `build` green |
| **Phase 1 (Day 26)** | Day 26 EOD | **M1 — Core World, Auth, Pip & Realms** | RPG Plum/Violet/Gold theme, `Pip` SVG + `motion`, `xp.ts`/`badges.ts`, Auth + Class/Pip customizer, Course Realms `/courses`, Guild Hall `/guild` & `/c/:handle` | Unit tests for XP/levels/badges & Phase 1 UI routes pass |
| **Phase 2 (Day 27)** | Day 27 EOD | **M2 — Quest Path, Video Player & Reviews** | Winding Quest Path on `/courses/:slug`, 1-click Enroll, Theater Video Player with speed/shortcuts + `PipCorner`, Verified Reviews | Enrolled user watches lessons & submits star review |
| **Phase 3 (Day 28)** | Day 28 EOD | **M3 — Progress Sync, Streaks & Boss Quizzes** | Debounced 10s progress sync + resume + `>=90%` auto-complete, Server-graded Boss Quizzes (`submit_quiz_attempt` RPC), `RewardOverlay` confetti + remediation | Progress resumes accurately; zero XP farming; confetti fires on pass |
| **Phase 4 (Day 29)** | Day 29 EOD | **M4 — Dashboards, Certificates, Studio & Admin** | Student Command Center `/dashboard`, Printable Certificate `/certificates/:code`, Instructor Studio + Storage + Recharts, Admin Deck `/admin` | All 4 role flows (`Guest`, `Student`, `Instructor`, `Admin`) functional |
| **Phase 5 (Day 30)** | Day 30 EOD | **M5 — Testing, A11y, Perf & Demo** | Full Vitest + Playwright E2E, `@axe-core/playwright` WCAG 2.2 AA, lazy route splits, Lighthouse `>=90`, Day 30 final demo report | All automated suites green, zero a11y blockers |

---

## 2. Role Track Split (3-Intern Model)

- **Role 1 (Platform & Backend):** Supabase schema/migrations/RPCs, Auth + role guards, Instructor Studio CRUD + Storage uploads, Admin Deck.
- **Role 2 (UI, Companion & Design System):** Plum/Violet/Gold Tailwind v4 tokens, `Pip` SVG + `RewardOverlay`, Winding Quest Path, Reviews, Printable Certificate UI, WCAG 2.2 AA.
- **Role 3 (State, Game Engine, Player & QA):** `xp.ts`/`badges.ts` parity, Redux Toolkit slices, Guild Hall `/guild`, Theater Video Player + progress sync, Boss Quiz runner, Recharts analytics, Vitest & Playwright E2E.

---

## 3. Full Capstone Task List, Estimates & Assignments (48 Hours Total)

| ID | Task | Owner | Est. | Target Day | Status |
| --- | --- | --- | --- | --- | --- |
| T1.1 | Write Proposal, Tech Stack, Architecture, Wireframes & Workflow docs | Role 1 + 2 | 2.5h | Day 25 | Done |
| T1.2 | Create 12-table Postgres schema, RLS policies, Storage buckets, RPCs & `seed.sql` | Role 1 | 3.0h | Day 25 | Done |
| T1.3 | Scaffold Vite 8 + React 19 + strict TS + Tailwind v4 + oxlint/Prettier/Vitest | Role 1 | 2.0h | Day 25 | Done |
| T1.4 | Build design tokens, Web Audio FX, `Pip` SVG companion & `xp`/`badges` engine | Role 2 + 3 | 3.0h | Day 26 | Done |
| T1.5 | Build Auth flows (`/login`, `/register`, `/auth/callback`, `/character`), `ProtectedRoute`, persistence & demo switch | Role 1 | 2.5h | Day 26 | Done |
| T1.6 | Build UI Component Library (`Button`, `Card`, `Input`, `Modal`, `LoadingState`, `ErrorState`), `Navbar`/`Footer`/`404` & `COMPONENTS.md` | Role 2 + 3 | 3.0h | Day 26 | Done |
| T2.1 | Build Playable Quest Path map, inline Micro-Challenges & Course Reviews (`/courses/:slug`) | Role 2 + 3 | 3.5h | Day 27 | Done (Demo Mode) |
| T2.2 | Build Theater HTML5/embed Video Player (`0.75x–2x`, shortcuts, `PipCorner`) | Role 3 | 4.0h | Day 27 | Ready |
| T2.3 | Wire live Supabase enrollment & verified review persistence (`enrollments`, `course_reviews`) | Role 1 | 2.0h | Day 27 | Ready |
| T3.1 | Implement 10s debounced `lesson_progress` resume & `>=90%` auto-completion sync | Role 3 | 3.5h | Day 28 | Backlog |
| T3.2 | Connect Boss Quiz UI to `get_student_quiz_questions` & `submit_quiz_attempt` Postgres RPC | Role 1 + 3 | 3.5h | Day 28 | Backlog |
| T3.3 | Hook Confetti `RewardOverlay` & badge evaluator to live Postgres progress state | Role 2 | 2.0h | Day 28 | Done (Demo Mode) |
| T4.1 | Connect Student Command Center (`/dashboard`) to live enrolled stats & certs | Role 3 | 2.5h | Day 29 | Backlog |
| T4.2 | Build public verifiable `/certificates/:code` route + `claim_course_certificate` RPC | Role 2 + 1 | 2.5h | Day 29 | Backlog |
| T4.3 | Build Instructor Studio (`/instructor`) course/lesson/quiz CRUD, Storage & Recharts | Role 1 + 3 | 4.5h | Day 29 | Backlog |
| T4.4 | Build Admin Grandmaster Deck (`/admin`) role management & course moderation | Role 1 | 2.0h | Day 29 | Backlog |
| T5.1 | Add lazy route code-splitting (`< 500 kB` chunks) & Lighthouse optimization (`>= 90`) | Role 2 + 3 | 2.0h | Day 30 | Backlog |
| T5.2 | Verify full Colima local Supabase stack + Playwright E2E + `@axe-core` WCAG 2.2 AA | Role 3 + 1 | 3.0h | Day 30 | Backlog |
