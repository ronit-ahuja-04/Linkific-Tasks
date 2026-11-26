# Team Collaboration & Workflow — SkillForge LMS

**Repository Placement:** Everything for Days 25–30 lives inside `ronit-ahuja-04/Linkific-Tasks/Day-25/` (with an optional standalone GitHub Organization/Projects guide below if the team mirrors or tracks tasks in GitHub Projects).

---

## 1. Team Roles & Responsibilities (3-Intern Model)

Even when executed solo across focused tracks, separating ownership by role prevents merge conflicts and keeps PRs cleanly scoped:

| Role | Track | Primary Ownership | Key Files / Modules |
| --- | --- | --- | --- |
| **Role 1 — Tech Lead / Platform & Backend** | Backend, Auth, Instructor & Infra | Supabase schema/migrations, RLS policies, Postgres RPCs, Auth flow, Storage uploads, Instructor Course Builder, CI/build scripts | `supabase/`, `src/lib/`, `src/features/auth/`, `src/features/instructor/` |
| **Role 2 — Frontend UI & Design System Lead** | Design System, Catalog & Reviews | Tailwind v4 theme tokens, dark mode, `AppShell`, Course Catalog search/filters, Course Detail, Reviews, Certificate UI, WCAG 2.2 AA | `src/styles/`, `src/components/`, `src/features/catalog/`, `src/features/reviews/`, `src/features/certificates/` |
| **Role 3 — State, Player & QA Lead** | Redux State, Player, Quizzes & QA | Redux Toolkit store, `playerSlice` + Video Player + resume sync, `quizSlice` + Quiz runner, Student Dashboard, Recharts analytics, Vitest & Playwright E2E | `src/app/`, `src/features/player/`, `src/features/quizzes/`, `src/features/dashboard/`, `test/`, `e2e/` |

---

## 2. Git Branching & Pull Request Workflow

1. **Protected `main` convention:** Never commit feature code directly to `main` after Day 25 setup.
2. **Branch naming:**
   - `day25/setup-plan-and-scaffold`
   - `day26/<track>-<feature>` (e.g., `day26/auth-role-guards`, `day26/catalog-search-filters`)
   - `day27/<track>-<feature>` ... `day30/polish-e2e-docs`
3. **Commit convention:** Atomic conventional commits (`feat(lms): ...`, `fix(lms): ...`, `docs(day25): ...`, `test(lms): ...`).
4. **Code Review Process (Required before merge):**
   - Author runs locally: `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`.
   - PR description states: **What changed**, **How it was verified**, and **Screenshots** for UI changes.
   - Reviewer checks: strict TypeScript (zero `any`), RLS impact, accessibility (keyboard + contrast + labels), and test coverage.
   - Target review turnaround: **< 2 hours** during sprint hours; merge via merge commit (`--no-ff`) or GitHub PR merge to preserve milestone history.

---

## 3. Daily Standup Schedule (15 Minutes)

- **Time:** Daily at **10:00 AM IST** (Days 25–30) — strictly **15 minutes**.
- **Format:**
  - **Minutes 0–12 (4 min × 3 roles):**
    1. *Yesterday:* Which story/PR shipped?
    2. *Today:* Which story ID (`1.2`, `2.1`, etc.) moves to `in-progress` / `review`?
    3. *Blockers:* Schema, RLS, API contract, or failing test blocking another track?
  - **Minutes 12–15:** Sync `sprint-status.yaml` / GitHub Project board and agree on integration checkpoints (e.g., schema freeze before UI integration).

---

## 4. Setting Up GitHub Organization / Repo & GitHub Projects Board

Because `gh` CLI is not installed in this environment and the active code stays inside `Linkific-Tasks/Day-25/`, use these exact steps in GitHub if you also want an external GitHub Org + Project board for team tracking:

1. **GitHub Organization / Repo (optional mirror or team org):**
   - Go to `github.com/organizations/new` -> create e.g. `linkific-skillforge-team` (Free plan) -> invite the 2–3 team members with **Write** access.
   - Either add teammates as collaborators on `Linkific-Tasks` or create `skillforge-lms` inside the org and push `Day-25/skillforge-lms` with `git subtree push`.
   - Enable branch protection on `main`: *Require a pull request before merging (1 approval)* + *Require status checks (`typecheck`, `lint`, `test`, `build`)*.
2. **GitHub Projects Board Setup:**
   - Open your GitHub repo/org -> **Projects** -> **New Project** -> choose **Board** template.
   - Configure 5 columns matching BMAD `sprint-status.yaml`:
     - `Backlog` | `Ready` | `In Progress` | `In Review` | `Done`
   - Add custom fields: `Epic` (`E1..E6`), `Owner` (`Role 1 / 2 / 3`), `Day` (`Day 25..30`), `Estimate (hrs)`.
   - Seed issues directly from the task list in [TASK_BREAKDOWN.md](./TASK_BREAKDOWN.md).
