---
title: SkillForge LMS Visual Design System
status: final
created: 2026-11-26
updated: 2026-11-26
colors:
  bg: '#f6f7f4'
  surface: '#ffffff'
  surface-2: '#eceee9'
  line: '#dcded6'
  ink: '#101418'
  muted: '#525866'
  brand: '#2563eb'
  brand-hover: '#1d4ed8'
  on-brand: '#ffffff'
  accent: '#0f766e'
  good: '#0b8a5d'
  warn: '#b45309'
  danger: '#dc2626'
typography:
  display: 'Space Grotesk Variable'
  body: 'Inter Variable'
  mono: 'JetBrains Mono Variable'
rounded:
  sm: '0.375rem'
  md: '0.625rem'
  lg: '1rem'
spacing:
  shell-max: '1280px'
  sidebar-w: '320px'
components:
  - CourseCard
  - LessonPlayerShell
  - ProgressBar
  - QuizQuestionCard
  - CertificateFrame
---

# DESIGN.md — SkillForge LMS

## Brand & Style

SkillForge LMS pairs crisp editorial clarity with focused studio ergonomics: high-contrast typography, generous breathing room for reading/video focus, and subtle semantic status badges (`In Progress`, `Completed`, `Passed`). Dark mode is class-based (`html.dark`) so learners watching videos at night get reduced glare while maintaining WCAG 2.2 AA contrast.

## Colors

Semantic CSS variables flip cleanly under `.dark` and map to Tailwind CSS v4 utilities via `@theme inline`:

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--bg` | `#f6f7f4` | `#0b0f14` | Page canvas |
| `--surface` | `#ffffff` | `#131922` | Cards, panels, modals |
| `--surface-2` | `#eceee9` | `#1c2431` | Subtle fills, skeleton tracks |
| `--line` | `#dcded6` | `#283244` | Hairline borders & dividers |
| `--ink` | `#101418` | `#f1f5f9` | Primary text |
| `--muted` | `#525866` | `#94a3b8` | Secondary captions & labels |
| `--brand` | `#2563eb` | `#3b82f6` | Primary CTAs, active tabs |
| `--accent` | `#0f766e` | `#14b8a6` | Progress fills, achievement highlights |
| `--good` | `#0b8a5d` | `#10b981` | Passed quiz, completed lesson |
| `--warn` | `#b45309` | `#f59e0b` | Draft status, partial progress |
| `--danger` | `#dc2626` | `#ef4444` | Validation errors, failed attempts |

## Typography

- **Display (`--font-display`):** `Space Grotesk Variable` for hero headings, course titles, and certificate headers.
- **Body (`--font-body`):** `Inter Variable` for catalog descriptions, lesson notes, quizzes, and dashboards.
- **Mono (`--font-mono`):** `JetBrains Mono Variable` for timestamps (`04:12 / 12:40`), quiz scores, and certificate verification codes (`SF-2026-...`).

## Layout & Spacing

- Max content container: `1280px` (`px-4 sm:px-6 lg:px-8`).
- Catalog grid: 1 column (`<640px`), 2 columns (`640px–1023px`), 3 columns (`>=1024px`).
- Video Learning View: 2-column split on desktop (`1fr 340px` syllabus drawer), stacked vertical layout on mobile.

## Elevation & Depth

- Flat hairline borders (`1px solid var(--line)`) over heavy drop shadows for cards; `shadow-md` reserved for sticky video bars, dropdowns, and toast alerts.

## Shapes

- Cards/panels: `rounded-xl` (`1rem`); buttons/inputs: `rounded-lg` (`0.625rem`); status pills: `rounded-full`.

## Components

- **CourseCard:** `16:9` thumbnail, level badge, title, instructor line, star rating + review count, optional progress bar when enrolled.
- **LessonPlayerShell:** Dark-framed `16:9` media container, custom control strip (play/pause, seek slider, speed selector `0.75x–2x`, timestamp, mark-complete toggle), collapsible syllabus drawer with completion checkmarks.
- **QuizQuestionCard:** Step header (`Question 2 of 5`), single-select radio option tiles with clear focus rings, explanation banner after grading.
- **CertificateFrame:** Landscape printable card (`@media print` A4 landscape) with border ornament, learner name, course title, issue date, instructor signature block, and monospace verification code.

## Do's and Don'ts

- **Do** preserve `16:9` aspect ratio placeholders (`aspect-video`) to prevent CLS during thumbnail/video load.
- **Don't** hardcode `#ffffff` or `#000000` colors; always use semantic `--surface`, `--ink`, and `--line` tokens.
