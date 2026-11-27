# SkillForge LMS (`Day-26/skillforge-lms`)

Gamified Learning Management System capstone app for Days 25–30 — pairing structured LMS architecture with **Pip** (an evolving SVG companion), playable micro-challenges, Quest Maps, Boss Battles, The Guild Hall leaderboard, and role-based Supabase security.

## Stack

- **Frontend:** React 19, Vite 8, TypeScript 5.9 (`strict: true`, `noUncheckedIndexedAccess`), Tailwind CSS v4, Motion (`motion/react` `LazyMotion`), React Router v7, Redux Toolkit, Recharts, Lucide Icons, Web Audio Synth FX (`src/lib/game/sfx.ts`)
- **Backend:** Supabase (Postgres + Row Level Security + Auth + Storage + anti-farming RPCs)
- **Tooling:** `oxlint`, Prettier, Vitest, Testing Library

## Local Commands

```bash
npm install
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm run dev
```

Open **`http://localhost:5178`**. Without `.env`, the app runs in **`Demo Mode`** using seeded realms (`React Architecture`, `Supabase Security`, `Tailwind v4 Design Systems`, `Full-Stack Testing`), local quest progression, and quick-switch demo accounts (`@maya`, `@dev`, `@alex`).

## Local Supabase Setup (requires Colima or Docker Desktop)

```bash
colima start # if using Colima on macOS
npm run db:start
npm run env:local
npm run db:reset
npm run dev
```
