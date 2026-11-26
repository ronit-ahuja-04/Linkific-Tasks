# Wireframes & Mockups — SkillForge LMS

Low-fidelity screen wireframes covering both **Desktop (`1280px`)** and **Mobile (`375px`)** viewports for the core LMS routes.

---

## 1. Course Catalog (`/courses`)

### Desktop (`1280px`)
```text
+----------------------------------------------------------------------------------+
| [SkillForge]   Catalog   My Learning   Instructor Studio      [Theme] [Sign In]  |
+----------------------------------------------------------------------------------+
| Explore Courses                                                                  |
| [ Search courses, topics, or instructors...                  ] [Sort: Popular v] |
+--------------------+-------------------------------------------------------------+
| Filters            |  +-------------------+  +-------------------+  +---------+  |
| Category           |  | [16:9 Thumbnail]  |  | [16:9 Thumbnail]  |  | [16:9]  |  |
| [ ] All            |  | Frontend • Interm |  | Backend • Begin   |  | ...     |  |
| [x] Frontend       |  | React Arch Lab    |  | Supabase Mastery  |  |         |  |
| [ ] Backend        |  | ★ 4.8 (42) • 3h   |  | ★ 4.9 (19) • 4h   |  |         |  |
|                    |  +-------------------+  +-------------------+  +---------+  |
| Level              |                                                             |
| (*) Any            |  +-------------------+  +-------------------+  +---------+  |
| ( ) Beginner       |  | [16:9 Thumbnail]  |  | ...               |  | ...     |  |
| ( ) Intermediate   |  +-------------------+  +-------------------+  +---------+  |
+--------------------+-------------------------------------------------------------+
```

### Mobile (`375px`)
```text
+-------------------------------+
| [SkillForge]    [Theme] [Menu]|
+-------------------------------+
| Explore Courses               |
| [ Search courses...         ] |
| [ Filters (2) ] [ Sort v    ] |
+-------------------------------+
| +---------------------------+ |
| | [16:9 Thumbnail]          | |
| | Frontend • Intermediate   | |
| | React Architecture Lab    | |
| | ★ 4.8 (42) • 3h 20m       | |
| +---------------------------+ |
| +---------------------------+ |
| | [16:9 Thumbnail]          | |
| +---------------------------+ |
+-------------------------------+
```

---

## 2. Course Detail (`/courses/:slug`)

```text
+----------------------------------------------------------------------------------+
| <- Back to Catalog                                                               |
+---------------------------------------------+------------------------------------+
| [Frontend] [Intermediate]                   |  +------------------------------+  |
| React Architecture & Design Patterns        |  | [ 16:9 Preview Video / Thumb ] |  |
| Built by Prof. Dev • ★ 4.8 (42 reviews)     |  +------------------------------+  |
|                                             |  Progress: 0% • 12 lessons         |
| What you'll learn                           |  [     Enroll in Course (Free)   ] |
| - Feature-sliced folders & Redux Toolkit    |  Includes: 3 modules, 2 quizzes,   |
| - Server-validated workflows                |            Verifiable Certificate  |
+---------------------------------------------+------------------------------------+
| Curriculum                                                                       |
| v Module 1: Component Design Foundations (3 lessons • 38m)                       |
|    [Play] 1.1 Composition & Inversion of Control       [Preview]  12:10          |
|    [Lock] 1.2 Compound Components in TypeScript                   14:05          |
|    [Quiz] Module 1 Check (5 questions • 70% to pass)                             |
+----------------------------------------------------------------------------------+
| Student Reviews                                                                  |
| [ Write a Review: ★★★★★  | Comment box...                 | Submit Review ]      |
| - Maya S. ★★★★★  "Clear lessons and super responsive quiz feedback."             |
+----------------------------------------------------------------------------------+
```

---

## 3. Video Lesson Player (`/learn/:courseId/lessons/:lessonId`)

```text
+----------------------------------------------------------------------------------+
| <- Course Overview   React Architecture Lab        Progress: [██████░░░░] 60%     |
+---------------------------------------------------+------------------------------+
| +-----------------------------------------------+ | Course Syllabus              |
| |                                               | | v Module 1 (3/3 done)        |
| |              [ 16:9 VIDEO STAGE ]             | |   [x] 1.1 Composition        |
| |                                               | |   [x] 1.2 Compound Pattern   |
| |  [>] 04:12 / 12:10  [====o-----]  [1.25x] [F] | |   [x] Quiz 1 (Passed 80%)  |
| +-----------------------------------------------+ | v Module 2 (1/3 done)        |
|                                                   |   [>] 2.1 Redux Toolkit      |
| Lesson 2.1: Typed Redux Toolkit Slices            |   [ ] 2.2 Async Thunks       |
| [x] Mark as Completed         [Next Lesson ->]    |   [ ] Quiz 2 (Locked/Open)   |
|                                                   +------------------------------+
| Lesson Summary & Resources                                                       |
| - Use createAsyncThunk for network lifecycles...                                 |
+----------------------------------------------------------------------------------+
```

---

## 4. Quiz Assessment & Certificate (`/learn/:courseId/quiz/:quizId` & `/certificates/:code`)

```text
Quiz View:
+-----------------------------------------------------------------------+
| Module 2 Assessment        Question 2 of 5         Pass threshold: 70%|
| [████░░░░░░] 40%                                                      |
|                                                                       |
| Why should quiz grading happen in a Postgres RPC instead of React?    |
|  ( ) Faster CSS transitions                                           |
|  (*) Prevents exposing answer keys or forging passing scores           |
|  ( ) Avoids using TypeScript                                          |
|                                                                       |
| [ <- Previous ]                                    [ Next / Submit -> ]|
+-----------------------------------------------------------------------+

Certificate View (/certificates/SF-2026-8F4A2C) [Print / Save PDF]:
+=======================================================================+
|                        SKILLFORGE LMS                                 |
|                  CERTIFICATE OF COMPLETION                            |
|                                                                       |
|                   This certifies that                                 |
|                       Maya Sharma                                     |
|            has successfully completed the course                      |
|            React Architecture & Design Patterns                       |
|                                                                       |
|   Issued: Nov 30, 2026    Instructor: Prof. Dev    ID: SF-2026-8F4A2C |
+=======================================================================+
```

---

## 5. Student & Instructor Dashboards (`/dashboard` & `/instructor`)

```text
Student Dashboard (/dashboard):
+-----------------------------------------------------------------------+
| Welcome back, Maya        3 Enrolled   |   1 Completed   |   1 Cert   |
| Continue Learning:                                                    |
| +---------------------------------+  +------------------------------+ |
| | React Architecture Lab    60%   |  | Supabase Mastery       100%  | |
| | [██████░░░░]  [Resume at 04:12] |  | [██████████] [View Cert]     | |
| +---------------------------------+  +------------------------------+ |
+-----------------------------------------------------------------------+

Instructor Studio (/instructor):
+-----------------------------------------------------------------------+
| Instructor Studio                                  [ + New Course ]   |
| +--------------------+ +--------------------+ +---------------------+ |
| | Total Enrollments  | | Avg Completion     | | Avg Quiz Score      | |
| |       148          | |       74%          | |        83%          | |
| +--------------------+ +--------------------+ +---------------------+ |
| +---------------------------------+  +------------------------------+ |
| | Enrollments Over Time (Recharts)|  | Quiz Avg by Course (Recharts)| |
| |   /‾\   /‾‾                     |  |  ███  ████  ██               | |
| +---------------------------------+  +------------------------------+ |
| My Courses: [ React Architecture Lab (Published) ] [ Edit ] [ Stats ] |
+-----------------------------------------------------------------------+
```
