---
title: SkillForge LMS
status: final
created: 2026-11-26
updated: 2026-11-26
---

# PRD: SkillForge LMS

## 0. Document Purpose

This PRD defines the functional, non-functional, and scope requirements for **SkillForge LMS** across the 6-day capstone (Days 25–30). It anchors shared vocabulary in the Glossary and provides numbered requirements (`FR-1`..`FR-22`) for downstream UX (`DESIGN.md` / `EXPERIENCE.md`), Architecture (`ARCHITECTURE-SPINE.md`), and Sprint Planning (`epics.md`).

## 1. Vision

**SkillForge LMS** gives self-paced learners and instructors a fast, accessible, end-to-end platform to publish courses, watch structured video lessons with persistent progress, validate skills with server-graded quizzes, and earn verifiable certificates. Designed for a 3-track, 6-day engineering sprint, every capability pairs a responsive Tailwind CSS v4 + Redux Toolkit UI with strict Supabase Postgres Row Level Security and RPC validation.

## 2. Target User

### 2.1 Jobs To Be Done
- **Student (Maya):** Find relevant courses quickly, learn through structured video lessons without losing her place, verify retention via quizzes, and obtain proof of completion.
- **Instructor (Prof. Dev):** Author and organize courses into modules, lessons, and assessments, publish cleanly, and see how learners engage and perform.
- **Admin (Alex):** Audit platform health, manage user roles, and verify issued certificates.

### 2.2 Non-Users (v1)
- Corporate L&D administrators requiring SCORM exports, SSO/SAML, or paid invoicing.

### 2.3 Key User Journeys
- **UJ-1. Maya discovers, enrolls, and completes a course:** Maya visits `/courses`, filters by `Frontend` and `Intermediate`, opens a course detail page, signs in, clicks **Enroll**, watches Lesson 1 at `1.25x` speed (progress saved at `04:12`), resumes the next day, completes remaining lessons, passes the module quiz at `85%`, and opens `/certificates/:code` to print/export her certificate.
- **UJ-2. Prof. Dev authors and publishes a new course:** Prof. Dev signs in as an `instructor`, opens `/instructor`, creates a draft course with a thumbnail, adds two modules and four lessons plus a 5-question quiz, flips status to `published`, and tracks new enrollments and completion percentages on Recharts charts.
- **UJ-3. Maya reviews a completed course:** After completing at least one lesson, Maya submits a 5-star rating and written review on `/courses/:slug`, updating the course's aggregate rating.
- **UJ-4. Alex verifies a certificate:** Alex visits `/certificates/:code` (public read-only verification view) and confirms learner name, course title, issue date, and verification hash match database records.

## 3. Glossary

- **User Profile** — Account record in `profiles` linked 1:1 to `auth.users`, carrying `role` (`student` | `instructor` | `admin`).
- **Course** — Top-level learning unit with metadata, `status` (`draft` | `published`), and ordered **Modules**.
- **Module** — Ordered section inside a **Course** grouping **Lessons** and optional **Quizzes**.
- **Lesson** — Video-centered learning unit with duration, markdown summary, and `is_preview` flag.
- **Enrollment** — Unique `(user_id, course_id)` link granting full lesson and quiz access.
- **Lesson Progress** — Per-user, per-lesson record storing `watched_seconds`, `is_completed`, and `last_watched_at`.
- **Quiz** — Assessment attached to a **Course** (and optionally a **Module**) with a `passing_score` percentage.
- **Quiz Attempt** — Submitted answer payload graded server-side via Postgres RPC with immutable `score_percent` and `passed`.
- **Course Review** — User rating (`1`–`5`) and optional comment on an enrolled **Course**.
- **Certificate** — Unique verifiable record issued when all required **Lessons** are complete and required **Quizzes** are passed.

## 4. Features

### 4.1 Authentication & Role-Based Access
**Description:** Users register and sign in via Supabase Auth (Email/Password or GitHub OAuth) and receive role-scoped routes and database permissions. Realizes UJ-1, UJ-2.

- **FR-1 (Must-Have):** Visitors can register with email/password or GitHub OAuth; first sign-in provisions a `profiles` row defaulting to `student`.
- **FR-2 (Must-Have):** Protected routes (`/dashboard`, `/learn/*`) require an authenticated session; `/instructor/*` requires `instructor` or `admin` role.
- **FR-3 (Nice-to-Have):** Admin role can promote/demote `student` <-> `instructor` roles via an Admin panel view.

### 4.2 Course Catalog, Search & Filtering
**Description:** Public catalog enabling fast discovery across categories, difficulty levels, and ratings. Realizes UJ-1.

- **FR-4 (Must-Have):** Guests and learners can browse published **Courses** on `/courses` with debounced keyword search.
- **FR-5 (Must-Have):** Users can filter courses by `category`, `level` (`beginner` | `intermediate` | `advanced`), and sort by newest, highest rated, or most enrolled.
- **FR-6 (Must-Have):** Course detail view (`/courses/:slug`) displays syllabus (**Modules** and **Lessons**), instructor info, aggregate rating, and preview lessons (`is_preview = true`) before enrollment.

### 4.3 Enrollment & Video Lesson Player
**Description:** Seamless course enrollment and an accessible video player with continuous progress persistence. Realizes UJ-1.

- **FR-7 (Must-Have):** Authenticated learners can enroll in a published **Course** in one click, creating an **Enrollment** row.
- **FR-8 (Must-Have):** Video player (`/learn/:courseId/lessons/:lessonId`) supports play/pause, seek, playback speed (`0.75x`, `1x`, `1.25x`, `1.5x`, `2x`), keyboard shortcuts, and syllabus sidebar navigation.
- **FR-9 (Must-Have):** Player periodically persists `watched_seconds` (debounced every 10s + on pause/unload) and resumes from the saved timestamp on return.
- **FR-10 (Must-Have):** Learners can mark a **Lesson** complete manually or auto-complete at `>= 90%` watched duration, updating course completion `%`.

### 4.4 Quizzes & Assessments
**Description:** Interactive multiple-choice assessments with server-authoritative grading. Realizes UJ-1, UJ-2.

- **FR-11 (Must-Have):** Enrolled learners can take a **Quiz** (`/learn/:courseId/quiz/:quizId`) navigating question-by-question with answer selection.
- **FR-12 (Must-Have):** Submitting a quiz calls Postgres RPC `submit_quiz_attempt`, which grades answers server-side, stores a **Quiz Attempt**, and returns score, pass/fail status, and per-question explanations.
- **FR-13 (Nice-to-Have):** Optional countdown timer per quiz and attempt-history comparison table.

### 4.5 Certificates & Verification
**Description:** Printable completion certificates backed by cryptographic-style verification codes. Realizes UJ-1, UJ-4.

- **FR-14 (Must-Have):** Once course lessons are `100%` complete and course quizzes are passed, learner can trigger `claim_course_certificate` RPC to generate a **Certificate** with a unique `certificate_code`.
- **FR-15 (Must-Have):** `/certificates/:code` renders a styled Certificate UI with print-to-PDF (`@media print`) layout and public verification lookup.
- **FR-16 (Nice-to-Have):** Client-side PNG/SVG certificate download export button.

### 4.6 Student & Instructor Dashboards
**Description:** Personalized dashboards for tracking learning progress and managing course authoring/analytics. Realizes UJ-1, UJ-2.

- **FR-17 (Must-Have):** Student Dashboard (`/dashboard`) displays enrolled courses, resume-last-lesson CTAs, overall completion progress bars, quiz scores, and earned certificates.
- **FR-18 (Must-Have):** Instructor Studio (`/instructor`, `/instructor/courses/:id`) lets instructors create, edit, reorder, and publish/unpublish courses, modules, lessons, and quizzes, including thumbnail/video uploads to Supabase Storage.
- **FR-19 (Must-Have):** Instructor Dashboard displays interactive **Recharts** analytics (enrollments over time, lesson completion funnel, average quiz scores per course).

### 4.7 Course Reviews & Ratings
**Description:** Verified learner feedback loop on published courses. Realizes UJ-3.

- **FR-20 (Must-Have):** Enrolled learners can submit/update one **Course Review** (`1`–`5` stars + text comment) per course.
- **FR-21 (Must-Have):** Course detail page displays paginated reviews and real-time computed average rating + count.
- **FR-22 (Nice-to-Have):** Filter reviews by star rating.

## 5. Non-Goals (Explicit)

- No Stripe/real payment processing in v1 (all published courses use free enrollment).
- No live streaming / WebRTC video rooms or real-time classroom chat.
- No custom Express/NestJS microservice — Supabase PostgREST + RPC + Storage serves all backend needs.

## 6. MVP Scope

### 6.1 In Scope (Must-Have, Days 26–29)
- FR-1, FR-2, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-14, FR-15, FR-17, FR-18, FR-19, FR-20, FR-21.

### 6.2 Out of Scope / Stretch (Day 30 if schedule permits)
- FR-3 (Admin user-role management UI), FR-13 (Quiz countdown timer), FR-16 (Direct SVG/PNG download), FR-22 (Star-rating review filter).

## 7. Cross-Cutting NFRs

- **Type Safety:** TypeScript `strict: true`, `allowJs: false`, zero `any`.
- **Accessibility:** WCAG 2.2 AA compliance (semantic landmarks, keyboard-navigable player/quiz/menus, `>= 4.5:1` contrast, `aria-live` status feedback).
- **Security:** Supabase RLS enabled on all tables; `correct_option_index` hidden from direct client `SELECT` on `quiz_questions` until graded or accessed by course instructor.
- **Performance:** Route-level `React.lazy` splitting on player, quiz, and Recharts instructor studio; Lighthouse >= 90 on key routes.

## 8. Success Metrics

- **SM-1:** 100% of Must-Have FRs (`FR-1..FR-21` excluding Nice-to-Haves) pass Vitest + Playwright E2E checks by Day 30.
- **SM-2:** Zero `tsc --noEmit` or `oxlint` errors and Lighthouse Accessibility >= 95.
- **SM-C1 (Counter-metric):** Do not trade off RLS security (e.g., returning quiz answers directly in catalog queries) for faster quiz prototyping.

## 9. Open Questions

1. Should external YouTube/Vimeo embed URLs be supported alongside direct MP4 uploads in `lessons.video_url`? *(Default assumption: yes — adapter detects MP4/WebM vs YouTube URL.)*

## 10. Assumptions Index

- `[ASSUMPTION]` All courses in the v1 capstone are free-to-enroll (`price_cents` omitted from v1 schema).
- `[ASSUMPTION]` Local development runs against Dockerized local Supabase (`supabase/seed.sql`) with demo instructor and student accounts.
