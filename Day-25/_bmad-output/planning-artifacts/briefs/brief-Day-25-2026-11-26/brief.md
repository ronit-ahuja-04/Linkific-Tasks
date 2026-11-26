---
title: SkillForge LMS
status: final
created: 2026-11-26
updated: 2026-11-26
---

# Product Brief: SkillForge LMS

## Executive Summary

**SkillForge LMS** is a focused, full-featured Learning Management System built as the Days 25–30 Linkific internship capstone. It unifies structured video courses, real-time lesson progress tracking, server-graded quizzes, verifiable completion certificates, and role-based Student and Instructor dashboards into a single responsive web application.

Most beginner LMS clones stop at static course cards and client-only mock state, leaving authentication, access control, progress persistence, and quiz grading insecure or ephemeral. SkillForge solves this by pairing a strictly typed React 19 + Redux Toolkit frontend with Supabase Postgres, Row Level Security (RLS), Auth, Storage, and Postgres RPCs so every enrollment, video timestamp, quiz grade, and certificate verification code is durable and auditable.

## The Problem

- **Learners** lose momentum when video players forget playback position, quizzes lack immediate structured feedback, and course completion provides no verifiable proof of mastery.
- **Instructors** lack a lightweight studio to organize courses into modules and lessons, attach assessments, and inspect enrollment/completion trends in one view without wrestling with complex enterprise tools.
- **Engineering interns** on a 6-day capstone sprint need clear role boundaries, shared state contracts, and verifiable database rules so parallel frontend and backend tracks do not drift or break each other.

## The Solution

SkillForge LMS delivers two cohesive experiences powered by one shared schema:
1. **Learner Experience:** Browse and filter published courses, read verified student reviews, enroll in one click, stream lessons with playback-speed controls and automatic resume timestamps, pass module/course quizzes, and unlock a printable/verifiable Certificate of Completion.
2. **Instructor Studio:** Create and publish courses, structure modules and video lessons, author multiple-choice quizzes, and inspect enrollment, completion rate, and average quiz score charts via Recharts.

## What Makes This Different

- **Honest enforcement:** Quiz grading and certificate eligibility run inside Postgres RPCs with RLS (`student`, `instructor`, `admin`) rather than trusting client-side React state.
- **Evidence-driven engineering:** Strict TypeScript (`no explicit any`), typed Redux Toolkit slices, unit/component Vitest coverage, and Playwright + accessibility checks carried over from Days 17–24.
- **Focused 6-day scope:** Built on proven patterns from the team's Month 1 portfolio without reinventing custom backend servers or payment gateways.

## Who This Serves

- **Maya (Student / Self-Paced Learner):** Wants a distraction-free video player that remembers where she left off, clear progress percentages, quizzes to check understanding, and a shareable completion certificate.
- **Prof. Dev (Instructor / Course Creator):** Wants an intuitive studio to draft courses, upload thumbnails/videos, structure modules, publish quizzes, and monitor learner engagement.
- **Alex (Platform Admin / Reviewer):** Needs visibility into user roles, published courses, and certificate verification codes.

## Success Criteria

- **Core learner loop works end-to-end:** Sign up/in -> Enroll -> Watch lesson (resume saved) -> Pass quiz -> Claim and verify certificate.
- **Core instructor loop works end-to-end:** Create course -> Add modules/lessons/quiz -> Publish -> See live analytics on Instructor Dashboard.
- **Quality gates:** Zero TypeScript errors (`tsc --noEmit`), zero `oxlint` errors, WCAG 2.2 AA accessibility compliance, and passing Vitest + Playwright suites.

## Scope

**In Scope (Days 25–30):**
- Course catalog with search, category/level/rating filters, and sort.
- Email/password + GitHub OAuth authentication and role-based route protection (`student`, `instructor`, `admin`).
- HTML5/embed video player with playback controls and persistent `lesson_progress` tracking.
- Timed/untimed multiple-choice quizzes graded server-side via Postgres RPC.
- Printable & code-verifiable Certificate UI.
- Student Dashboard, Instructor Studio + Recharts analytics, and Course Reviews/Ratings.

**Out of Scope (v1):**
- Paid checkout / Stripe billing (courses are free/open-enrollment in v1).
- Live video conferencing or peer-to-peer chat rooms.
- SCORM/xAPI enterprise package imports or native mobile apps.
