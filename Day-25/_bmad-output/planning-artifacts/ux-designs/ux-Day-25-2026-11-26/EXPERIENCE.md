---
title: SkillForge LMS Experience Contract
status: final
created: 2026-11-26
updated: 2026-11-26
---

# EXPERIENCE.md — SkillForge LMS

## Foundation

- **Form-factor:** Responsive web SPA (desktop `1280px+`, tablet `768px`, mobile `375px`).
- **UI System:** Custom Tailwind CSS v4 design tokens (`{colors.*}`, `{typography.*}`) defined in `DESIGN.md` with `lucide-react` icons.

## Information Architecture

- **Top Navigation (`AppShell`):** Brand logo (`SkillForge`), `Catalog` (`/courses`), `My Learning` (`/dashboard`, authenticated), `Instructor Studio` (`/instructor`, instructor/admin), Theme toggle (Light/Dark), and Auth/Profile menu.
- **Learning Mode (`/learn/:courseId/*`):** Focused header with "Back to Course", overall course progress indicator, lesson/quiz title, and collapsible syllabus drawer.

## Voice and Tone

- Encouraging, concise, action-oriented microcopy (`"Resume at 04:12"`, `"Score 85% — Passed"`, `"1 lesson left to unlock your certificate"`). Errors always state what failed and offer a retry CTA.

## State Patterns

- **Loading:** Structural skeletons (`bg-surface-2 animate-pulse`) preserving card and player dimensions.
- **Empty States:** Helpful prompts with next action (e.g., Student Dashboard with 0 enrollments links directly to `/courses`).
- **Error & Offline:** Inline error banner with retry button; toast live region (`aria-live="polite"`) for save confirmations (`"Progress saved"`, `"Review posted"`).

## Interaction Primitives

- **Video Player Keyboard Shortcuts:** `Space`/`k` play-pause, `ArrowLeft`/`ArrowRight` seek `-5s`/`+5s`, `m` mute, `f` fullscreen.
- **Quiz Stepper:** Arrow/Tab navigation across radio options; explicit confirmation before final submission; immediate breakdown of correct vs incorrect answers post-submit.

## Accessibility Floor

- Semantic `<header>`, `<nav>`, `<main>`, `<aside>` landmarks and skip-to-content link.
- Visible `focus-visible` outlines (`outline-2 outline-brand`).
- Respect `prefers-reduced-motion` for transitions and progress bar animations.

## Key Flows

1. **UJ-1 (Enroll & Watch):** `/courses` -> search/filter -> `/courses/:slug` -> Enroll -> `/learn/:courseId/lessons/:lessonId` -> watch & resume -> auto/manual complete -> quiz -> `/certificates/:code`.
2. **UJ-2 (Author Course):** `/instructor` -> New Course -> add modules & lessons -> add quiz -> Publish -> verify student enrollment stats in Recharts chart.
3. **UJ-3 (Review Course):** Enrolled learner submits 1–5 star review on `/courses/:slug` -> average rating updates immediately.
4. **UJ-4 (Verify Certificate):** Anyone opens `/certificates/:code` -> verified learner/course metadata renders cleanly and prints to PDF.
