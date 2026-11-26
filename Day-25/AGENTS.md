# AGENTS.md — Day 25 Capstone (SkillForge LMS)

<!-- BEGIN bmad-project-context -->
## Project Context

- **Product:** **SkillForge LMS** — Gamified Learning Management System (Days 25–30 Team Capstone, inspired by `Day-23/intern-quest`).
- **Project Root (BMAD):** `/Users/ronitahuja/Desktop/Linkific-Tasks/Day-25`
- **App Root:** `/Users/ronitahuja/Desktop/Linkific-Tasks/Day-25/skillforge-lms`
- **Stack:** React 19 + Vite 8 + TypeScript 5.9 (`strict: true`, `allowJs: false`) + Tailwind CSS v4 (plum/violet/gold tactile RPG tokens) + Motion (`motion/react`) + React Router v7 + Redux Toolkit + Recharts + Supabase (Postgres, Auth, RLS, Storage, RPC).

## Verified Commands (run inside `Day-25/skillforge-lms/`)

- Dev server: `npm run dev` (port `5178`)
- Typecheck: `npm run typecheck` (`tsc --noEmit`)
- Lint: `npm run lint` (`oxlint`)
- Format check: `npm run format:check` (`prettier --check .`)
- Unit/component tests: `npm test` (`vitest run`)
- Production build: `npm run build` (`tsc --noEmit && vite build`)
- Local Supabase: `npm run db:start`, `npm run db:reset`, `npm run env:local`, `npm run db:stop`

## Architectural Invariants & Guardrails

1. **Strict TypeScript:** Zero `any` (`typescript/no-explicit-any` is an error in `.oxlintrc.json`), `noUncheckedIndexedAccess: true`.
2. **State ownership:** Auth/character session, course realms catalog, guild leaderboard, active player/progress, quiz state, and instructor/admin CRUD live in typed Redux Toolkit slices (`src/features/*/*Slice.ts`); ephemeral UI inputs stay local.
3. **Anti-farming XP & grading authority:** Never trust client-supplied XP, badges, quiz scores, or certificate eligibility. Lesson XP awards once per `(user_id, lesson_id)` completion; quiz XP awards once per passed quiz plus score-improvement delta inside Postgres RPCs/views (`submit_quiz_attempt`, `get_guild_leaderboard`, `claim_course_certificate`).
4. **Role-based RLS:** `prevent_non_admin_role_change` blocks profile role self-escalation; `/instructor` requires `instructor | admin`; `/admin` requires `admin`.
5. **Respect reduced motion:** Wrap animated Pip/Reward components in `<MotionConfig reducedMotion="user">`.
6. **Never leak secrets:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in `.env`; never put `service_role` keys in client code.
<!-- END bmad-project-context -->
