# Tech Stack Decision Document — SkillForge LMS

This document evaluates each architectural axis requested in the Day 25 brief and records the final selection for **SkillForge LMS**.

---

## 1. Framework: React (Vite) vs. Next.js

| Criterion | **React 19 + Vite 8 (Chosen)** | Next.js 16 (App Router) |
| --- | --- | --- |
| Primary Learning Focus | Pure client-side SPA architecture, Redux Toolkit state, lazy route splitting | Full-stack SSR, RSC boundaries, Server Actions |
| Video Player & Interactive Studio | Zero hydration mismatch; instant client state across player, quiz, and Recharts | Requires `'use client'` boundaries on nearly every LMS page |
| Build & HMR Speed | Sub-second Vite HMR; clean static `dist/` output | Heavier server build + runtime |
| Prior Portfolio Coverage | Days 5–19 & 22/24 used Vite SPA | Days 20, 21 & 23 covered Next.js App Router + NextAuth |

**Decision:** **React 19 + Vite 8 + TypeScript** — ideal for a heavily interactive client SPA (video player, real-time progress UI, multi-step quiz runner, drag/reorder course builder, and Recharts dashboards) paired with strict Redux Toolkit state management.

---

## 2. Styling: Tailwind CSS v4 vs. Styled Components

| Criterion | **Tailwind CSS v4 (Chosen)** | Styled Components |
| --- | --- | --- |
| Bundle & Runtime Overhead | Zero runtime CSS-in-JS; compiled static CSS via `@tailwindcss/vite` | Runtime style injection overhead per render |
| Design Tokens & Dark Mode | Native `@theme inline` + CSS custom properties (`--bg`, `--surface`, `--brand`) | Requires `ThemeProvider` wrapping every test |
| Velocity in 6-Day Sprint | High-speed responsive layout utilities (`grid`, `aspect-video`, `print:`) | Slower boilerplate per wrapper component |

**Decision:** **Tailwind CSS v4 (`@tailwindcss/vite`)** with semantic light/dark CSS variables and `@fontsource-variable` fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`).

---

## 3. State Management: Redux Toolkit vs. React Context

| Criterion | **Redux Toolkit (Chosen)** | React Context + `useReducer` |
| --- | --- | --- |
| Cross-Feature Sync | Single predictable store linking `auth`, `catalog`, `player`, `quiz`, and `instructor` | Provider nesting and broad consumer re-renders on rapid video timestamp updates |
| Async & DevTools | `createAsyncThunk` lifecycle states (`pending`/`fulfilled`/`rejected`) + Redux DevTools time-travel | Manual loading/error flags per context |
| TypeScript Ergonomics | Typed `RootState`, `AppDispatch`, `useAppSelector`, `useAppDispatch` | Boilerplate per context |

**Decision:** **Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)** owns shared domain state; local component `useState` handles ephemeral form inputs and UI popovers.

---

## 4. Backend & Database: Supabase vs. Firebase vs. Custom API

| Criterion | **Supabase (Chosen)** | Firebase (Firestore + Auth) | Custom Express/Node API |
| --- | --- | --- | --- |
| Data Model Fit | Relational SQL (`courses -> modules -> lessons -> quizzes -> certificates`) with foreign keys & joins | Denormalized NoSQL requires duplicating counts & manual join queries | High setup overhead (ORM + migrations + auth + file uploads in 6 days) |
| Server-Side Grading | Postgres RPC (`submit_quiz_attempt`) grades quizzes atomically with zero client answer exposure | Requires Cloud Functions (Blaze billing for outbound/runtime setup) | Must build and host separate server |
| Access Control | Postgres Row Level Security (`student`, `instructor`, `admin`) + SQL tests | Firestore security rules | Custom JWT middleware per route |
| Local Dev Parity | Dockerized local Supabase (`supabase start`, migrations, `seed.sql`) | Firebase Emulator | Manual Postgres + Node setup |

**Decision:** **Supabase** (Postgres + RLS + RPC + Storage + local CLI), continuing the proven local-first workflow from Days 17, 21, 22, and 24.

---

## 5. Authentication: Supabase Auth vs. Custom JWT vs. NextAuth

| Criterion | **Supabase Auth (Chosen)** | Custom JWT | NextAuth (Auth.js) |
| --- | --- | --- | --- |
| Integration with RLS | Built-in `auth.uid()` inside Postgres RLS policies and RPCs | Must manually sign JWTs matching DB secrets | Built for Next.js server routes, not static Vite SPAs |
| Auth Methods | Email/Password + GitHub OAuth out of the box | Manual password hashing, refresh tokens, OAuth callbacks | Requires backend runtime |

**Decision:** **Supabase Auth** (Email/Password + GitHub OAuth) with a `handle_new_user` Postgres trigger creating a `profiles` record (`role = 'student'` default).

---

## 6. Tooling & Quality Gates

- **TypeScript (`~5.9.0`):** `strict: true`, `noUncheckedIndexedAccess: true`, `allowJs: false`.
- **Linting & Formatting:** `oxlint` (`typescript/no-explicit-any: error`, `react/rules-of-hooks: error`) + `prettier`.
- **Testing:** `vitest` + `@testing-library/react` for unit/slice/component tests; Playwright + `@axe-core/playwright` planned for Days 28–30 E2E and WCAG 2.2 AA verification.
