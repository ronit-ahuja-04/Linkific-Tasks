# Day 26 — Core Features Development (SkillForge LMS)

**Programme:** Linkific Internship — Month 1 Capstone (Day 26 of Days 25–30)  
**Active Codebase:** [`Day-25/skillforge-lms/`](../Day-25/skillforge-lms/)  
**Component Library Docs:** [`Day-26/COMPONENTS.md`](COMPONENTS.md) · **Live Showcase:** `/components`

---

## 1. Daily Standup (15 Minutes)

- **Yesterday (Day 25):** Completed capstone planning, BMAD specs, 12-table Postgres RLS + anti-farming RPC schema (`20261126000001_initial_schema.sql`), Vite 8 + React 19 + strict TypeScript + Tailwind v4 + Redux Toolkit scaffold, and shipped the playable Phase 1 RPG loop in Demo Mode (`Pip`, Home Micro-Quest Arcade, Winding Quest Map, Guild Hall, Character Sheets).
- **Today (Day 26):** Build the reusable typed UI Component Library (`Button`, `Card`, `Badge`, `Input`, `Select`, `Textarea`, `Modal`, `LoadingState`, `ErrorState`) + `/components` showcase + `COMPONENTS.md`; decompose `AppShell` into `Navbar`, `Footer`, `PageHeader`, and `AppShell`; add dedicated `404` (`NotFoundPage`) and `/auth/callback` routes; harden persistent authentication (`rememberMe` storage, `onAuthStateChange` subscription, form validation, password visibility toggle) and persistent `uiSlice` preferences; ship across 4 stacked feature branches / PRs with full Vitest coverage.
- **Blockers:** Local Docker/Colima Postgres remains optional while Demo Mode covers local/offline runs; `gh` CLI is not installed locally, so feature branches are pushed to `origin` ready for GitHub PR merge.

---

## 2. Day 26 Task Coverage Matrix

| Day 26 Objective | Status | Where Implemented |
| --- | --- | --- |
| **Daily standup** (Yesterday / Today / Blockers) | Done | Section 1 above |
| **Authentication:** Login & Register pages | Done | [`LoginPage.tsx`](../Day-25/skillforge-lms/src/features/auth/LoginPage.tsx), [`RegisterPage.tsx`](../Day-25/skillforge-lms/src/features/auth/RegisterPage.tsx) |
| **Authentication:** Redux auth state (`authSlice`) | Done | [`authSlice.ts`](../Day-25/skillforge-lms/src/features/auth/authSlice.ts) |
| **Authentication:** Protected routes & role guards | Done | [`ProtectedRoute.tsx`](../Day-25/skillforge-lms/src/routes/ProtectedRoute.tsx) |
| **Authentication:** Persistent login (`rememberMe` + session hydration + `onAuthStateChange`) | Done | [`authApi.ts`](../Day-25/skillforge-lms/src/lib/api/authApi.ts), [`App.tsx`](../Day-25/skillforge-lms/src/App.tsx) |
| **Authentication:** Logout functionality + toast feedback | Done | [`Navbar.tsx`](../Day-25/skillforge-lms/src/components/layout/Navbar.tsx), [`authSlice.ts`](../Day-25/skillforge-lms/src/features/auth/authSlice.ts) |
| **Authentication:** OAuth integration & callback route | Done | [`AuthCallbackPage.tsx`](../Day-25/skillforge-lms/src/features/auth/AuthCallbackPage.tsx), `startGithubOAuth()` |
| **Core Components:** Navigation / Header | Done | [`Navbar.tsx`](../Day-25/skillforge-lms/src/components/layout/Navbar.tsx) |
| **Core Components:** Footer | Done | [`Footer.tsx`](../Day-25/skillforge-lms/src/components/layout/Footer.tsx) |
| **Core Components:** Layout components (`AppShell`, `PageHeader`) | Done | [`AppShell.tsx`](../Day-25/skillforge-lms/src/components/layout/AppShell.tsx), [`PageHeader.tsx`](../Day-25/skillforge-lms/src/components/layout/PageHeader.tsx) |
| **Core Components:** Reusable UI (`Button`, `Card`, `Input`, `Select`, `Textarea`, `Modal`, `Badge`) | Done | [`src/components/ui/`](../Day-25/skillforge-lms/src/components/ui/) |
| **Core Components:** Loading & Error states | Done | [`LoadingState.tsx`](../Day-25/skillforge-lms/src/components/ui/LoadingState.tsx), [`ErrorState.tsx`](../Day-25/skillforge-lms/src/components/ui/ErrorState.tsx), [`AppErrorBoundary.tsx`](../Day-25/skillforge-lms/src/components/AppErrorBoundary.tsx) |
| **Routing:** React Router main, dynamic (`/courses/:slug`, `/c/:handle`), callback, showcase, and 404 | Done | [`AppRouter.tsx`](../Day-25/skillforge-lms/src/routes/AppRouter.tsx), [`NotFoundPage.tsx`](../Day-25/skillforge-lms/src/features/ui/NotFoundPage.tsx) |
| **State Management:** Redux Toolkit store, initial state, actions/reducers, UI pref persistence | Done | [`store.ts`](../Day-25/skillforge-lms/src/app/store.ts), [`uiSlice.ts`](../Day-25/skillforge-lms/src/features/ui/uiSlice.ts), [`auth-store.test.tsx`](../Day-25/skillforge-lms/test/auth-store.test.tsx) |
| **Git Collaboration:** Feature branches, atomic commits, PR links & code review trail | Done (stacked branches pushed) | Section 3 below |
| **Component Library:** Variants, strict TypeScript interfaces, interactive showcase & documentation | Done | [`COMPONENTS.md`](COMPONENTS.md), [`ComponentLibraryPage.tsx`](../Day-25/skillforge-lms/src/features/ui/ComponentLibraryPage.tsx) |

---

## 3. Git Collaboration & Stacked PR Trail

Work was split by track into four feature branches with atomic conventional commits (`feat(ui):`, `feat(layout):`, `feat(routing):`, `feat(auth):`, `feat(state):`, `docs(day26):`) pushed to `origin`:

| PR Track | Branch | Atomic Commits | Scope & Code Review Notes |
| --- | --- | --- | --- |
| **PR 1 — UI Kit** | `day26/ui-component-library` | `cf2728c`, `53f4659` | Added `Button`, `Card`, `Badge`, `Input`, `Select`, `Textarea`, `Modal`, `LoadingState`, `ErrorState`, `/components` showcase, refactored `CatalogPage`/`GuildPage`/`DashboardPage`/`AppErrorBoundary`, and added `test/ui.test.tsx`. Verified 0 `any`, 0 `oxlint` warnings (`variants.ts` separation). |
| **PR 2 — Layout & Routing** | `day26/layout-routing-404` | `7ec854e`, `3a86900` | Extracted `Navbar`, `Footer`, `PageHeader`, updated `AppShell` sticky footer, replaced `*` redirect with `NotFoundPage` (404), refactored `ProtectedRoute`, and added `test/layout-routing.test.tsx`. |
| **PR 3 — Auth & Redux** | `day26/auth-persistence-and-redux` | `975b082`, `2fc8e5a` | Added `rememberMe` (`localStorage` vs `sessionStorage`), `subscribeToAuthChanges()`, `/auth/callback` (`AuthCallbackPage`), password visibility toggles + validation on `LoginPage`/`RegisterPage`, `hydrateUiPrefs()` in `uiSlice`, and `test/auth-store.test.tsx`. |
| **PR 4 — Docs & Index** | `day26/docs-and-standup` | *(this PR)* | Added `Day-26/COMPONENTS.md`, `Day-26/README.md`, updated `Day-25` sprint/task tracking and root `README.md`. |

---

## 4. Running & Verifying

```bash
cd Day-25/skillforge-lms
npm install
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run dev
```

Visit **`http://localhost:5178`**, **`http://localhost:5178/components`** (Component Library), **`http://localhost:5178/login`**, or any unknown path such as **`http://localhost:5178/missing`** (404 page).

---

## 5. Verification Results

| Check | Outcome |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | Pass (`0` errors, `strict: true`, `noUncheckedIndexedAccess: true`) |
| `npm run lint` (`oxlint`) | Pass (`0` warnings, `0` errors across `69` files) |
| `npm run format:check` (`prettier --check .`) | Pass (all matched files formatted cleanly) |
| `npm test` (`vitest run`) | Pass (`34` tests across `5` files: `game.test.ts`, `ui.test.tsx`, `layout-routing.test.tsx`, `auth-store.test.tsx`, `app.test.tsx`) |
| `npm run build` (`tsc --noEmit && vite build`) | Pass (`dist/assets/index-*.js`, `dist/assets/motion-features-*.js`, `dist/assets/index-*.css`) |
