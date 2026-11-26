---
project_name: SkillForge LMS
status: ready
created: 2026-11-26
updated: 2026-11-26
stepsCompleted: [1, 2, 3, 4]
---

# Epics and Stories — SkillForge LMS (Days 25–30)

## Epic Overview

| Epic | Day | Goal | Priority |
| --- | --- | --- | --- |
| E1: Foundation, Schema & Auth | Day 25–26 | Project scaffold, Supabase schema/RLS/seed, Redux store, Auth flows | Must-Have |
| E2: Course Catalog, Detail & Reviews | Day 26–27 | Search, filter, sort, course syllabus preview, enrollment, reviews | Must-Have |
| E3: Video Player & Progress Tracking | Day 27–28 | Video player controls, playback speed, debounced resume & completion | Must-Have |
| E4: Quizzes, Assessments & Certificates | Day 28–29 | Server-graded quiz engine, results breakdown, verifiable certificate UI | Must-Have |
| E5: Student & Instructor Dashboards | Day 29 | Student dashboard, Instructor course/quiz builder, Recharts analytics | Must-Have |
| E6: Polish, A11y, E2E & Capstone Demo | Day 30 | Vitest + Playwright + axe a11y + Lighthouse 90+ + final presentation docs | Must-Have |

---

## E1: Foundation, Schema & Auth

### Story 1.1: Project Scaffold, Tooling & Database Schema (Day 25)
- **Given** a fresh `Day-25/skillforge-lms` workspace
- **When** dependencies are installed and checks run
- **Then** strict TypeScript, Tailwind CSS v4 tokens, Redux store shell, `oxlint`, Prettier, Vitest, and `0001_initial_schema.sql` + `seed.sql` are verified ready.

### Story 1.2: Authentication & Role-Guarded Routing (Day 26)
- **Given** a visitor on `/login` or `/register`
- **When** they sign up/in via email+password or GitHub OAuth
- **Then** Supabase issues a session, `authSlice` hydrates their `profiles.role`, and protected student/instructor routes enforce access.

## E2: Course Catalog, Detail & Reviews

### Story 2.1: Course Catalog with Search, Filters & Sort (Day 26)
- **Given** published courses in Postgres
- **When** a user searches by keyword or filters by category/level on `/courses`
- **Then** `catalogSlice` updates results cleanly with loading skeletons and empty-state recovery.

### Story 2.2: Course Detail, Preview & One-Click Enrollment (Day 27)
- **Given** a published course on `/courses/:slug`
- **When** an authenticated student clicks **Enroll**
- **Then** an `enrollments` row is created via RLS and the CTA switches to **Start / Resume Learning**.

### Story 2.3: Course Ratings & Reviews (Day 27)
- **Given** an enrolled student on `/courses/:slug`
- **When** they submit a 1–5 star rating and review comment
- **Then** the `course_reviews` record is persisted and the course average rating recalculates.

## E3: Video Player & Progress Tracking

### Story 3.1: Accessible Video Player & Syllabus Sidebar (Day 27)
- **Given** an enrolled learner on `/learn/:courseId/lessons/:lessonId`
- **When** they play, seek, change playback speed (`0.75x–2x`), or select lessons in the sidebar
- **Then** the player updates cleanly via keyboard or mouse controls.

### Story 3.2: Persistent Lesson Progress & Auto-Completion (Day 28)
- **Given** an active video session
- **When** 10 seconds elapse, playback pauses, or >= 90% of duration is watched
- **Then** `lesson_progress` saves `watched_seconds` and `is_completed`, updating course completion percentage on reload.

## E4: Quizzes, Assessments & Certificates

### Story 4.1: Quiz Runner & Server-Authoritative Grading (Day 28)
- **Given** an enrolled learner on `/learn/:courseId/quiz/:quizId`
- **When** they submit answers
- **Then** Postgres RPC `submit_quiz_attempt` grades answers server-side, records the attempt, and displays score, pass/fail badge, and explanations.

### Story 4.2: Certificate Eligibility, UI & Public Verification (Day 29)
- **Given** a learner with 100% completed lessons and passing quizzes
- **When** they claim their certificate and open `/certificates/:code`
- **Then** `claim_course_certificate` issues a unique `certificate_code` and renders a printable A4 landscape Certificate UI.

## E5: Student & Instructor Dashboards

### Story 5.1: Student Dashboard (Day 29)
- **Given** a signed-in student on `/dashboard`
- **When** the dashboard loads
- **Then** it renders enrolled course cards, exact completion percentages, resume-lesson links, latest quiz scores, and earned certificates.

### Story 5.2: Instructor Course Builder & Recharts Analytics (Day 29)
- **Given** an `instructor` user on `/instructor`
- **When** they create/edit a course, upload a thumbnail, add modules/lessons/quizzes, or inspect analytics
- **Then** RLS permits mutations on their own courses and Recharts displays enrollment, completion, and quiz-score charts.

## E6: Polish, A11y, E2E & Capstone Demo

### Story 6.1: Full Test Coverage, Accessibility & Lighthouse Audit (Day 30)
- **Given** the integrated SkillForge LMS app
- **When** Vitest, Playwright E2E, axe-core, and Lighthouse run against the production build
- **Then** all critical flows pass with zero WCAG 2.2 AA violations and >= 90 Lighthouse scores.
