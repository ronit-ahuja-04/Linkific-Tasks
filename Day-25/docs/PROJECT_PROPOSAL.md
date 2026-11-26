# Project Proposal — SkillForge LMS (RPG Edition)

**Project:** SkillForge LMS (Days 25–30 Team Capstone)  
**Author / Owner:** Ronit Ahuja (`Day-25` Linkific Month 1 Training)  
**Design Heritage:** Combines full LMS workflows with the character-driven RPG system from [Intern Quest](../../Day-23/intern-quest/README.md) (**Pip** SVG companion, classes, XP levels, automatic badges, confetti rewards, and The Guild Hall leaderboard).

---

## 0. Brainstorming Evaluation (Why Option D Won)

| Option | Core Flows Evaluated | Why Picked / Not Picked |
| --- | --- | --- |
| A. Social Media Dashboard | Auth, posts CRUD, likes/comments, follow, notifications, uploads | Covered adjacent feed/chat mechanics in Days 15–17 (`FlowLane` & `Huddle`) |
| B. E-Commerce Platform | Catalog filters, Redux cart, wishlist, orders, admin, Stripe UI | Good Redux practice, less room for visual progression & learning loops |
| C. Project Management Tool | Kanban drag/drop, assignments, comments, Recharts | Very close to Days 11–16 (`FlowLane` Kanban + `SalesPulse` Recharts) |
| **D. Learning Management System (Chosen)** | **Catalog, Video Player, Progress Sync, Quizzes, Certs, Dashboards, Reviews + RPG Progression** | **Combines every Month-1 skill (Redux, Auth/RLS, Storage Uploads, Recharts) with a game progression loop** |

---

## 1. Problem & Vision

Traditional LMS apps feel passive and sterile: learners drop off mid-course when video players forget playback position, quizzes lack helpful feedback, and progress feels invisible. **SkillForge LMS** transforms every course into a **Realm**, every lesson into a **Quest Node**, and every quiz into a **Boss Battle**, guided by **Pip** — an evolving SVG companion who grows from an Egg to a crowned Guardian as you level up.

---

## 2. Feature List (Must-Have vs. Nice-to-Have)

| ID | Feature | Priority | Phase | Notes |
| --- | --- | --- | --- | --- |
| F1 | Email/Password + GitHub OAuth & Character Class onboarding | **Must-Have** | Phase 1 | Choose Class + Pip tint & accessory on sign-up |
| F2 | Role-based route guards (`student`, `instructor`, `admin`) | **Must-Have** | Phase 1 | Client route guards + Postgres RLS & trigger protection |
| F3 | Animated SVG **Pip** companion (`egg -> sprout -> sprite -> guardian`) | **Must-Have** | Phase 1 | Reacts with moods (`happy`, `proud`, `worried`, `sleepy`, `fired_up`) |
| F4 | **Course Realms Catalog** (`/courses`) with search, category/level/skill filters | **Must-Have** | Phase 1 | Shows XP reward, skill tag, difficulty, ratings |
| F5 | **The Guild Hall** (`/guild`) leaderboard & public Character Sheet (`/c/:handle`) | **Must-Have** | Phase 1 | Ranked by anti-farmed Total XP with live Pip avatars & skill bars |
| F6 | **Winding Quest Path** Course Detail (`/courses/:slug`), preview & 1-click enroll | **Must-Have** | Phase 2 | Duolingo-style node progression + syllabus accordion |
| F7 | Course Ratings & Verified Reviews (1–5 stars + comment) | **Must-Have** | Phase 2 | One review per enrolled learner per course |
| F8 | **Theater Video Player** (`/learn/:courseId/lessons/:lessonId`) + `PipCorner` | **Must-Have** | Phase 2–3 | Speed (`0.75x–2x`), keyboard shortcuts, resume timestamp, `>=90%` complete |
| F9 | **Server-Graded Boss Quizzes** (`/learn/:courseId/quiz/:quizId`) | **Must-Have** | Phase 3 | `submit_quiz_attempt` RPC + smart timestamp remediation (no lockout hearts) |
| F10 | Confetti **`RewardOverlay`**, XP count-up, Level-Ups & Auto Badges | **Must-Have** | Phase 3 | `First Quest`, `Boss Slayer`, `Polyglot`, `Course Conqueror`, `Streak Keeper`, `Trusted Critic` |
| F11 | **Verifiable Guild Certificate** (`/certificates/:code`) | **Must-Have** | Phase 4 | Printable A4 view with Character Class, Level, Pip crest & verification ID |
| F12 | **Student Command Center** (`/dashboard`) | **Must-Have** | Phase 4 | Pip hero, Level/Skill bars, Streak flame, Badges, Resume CTAs, Certs |
| F13 | **Instructor Studio** (`/instructor`, `/instructor/courses/:id`) + **Recharts** | **Must-Have** | Phase 4 | Course/Module/Lesson/Quiz CRUD, Storage uploads, custom mentor badges, charts |
| F14 | **Admin Grandmaster Deck** (`/admin`) | **Must-Have** | Phase 4 | Role management (`student`/`instructor`/`admin`), course & certificate moderation |
| F15 | Quiz countdown timer & direct PNG certificate canvas export | **Nice-to-Have** | Phase 5 | Stretch items if schedule permits |

---

## 3. User Roles & Permissions

| Capability | Guest | Student | Instructor | Admin |
| --- | --- | --- | --- | --- |
| Browse Course Realms, Guild Hall (`/guild`), Character Sheets (`/c/:handle`), Verify Certs | Yes | Yes | Yes | Yes |
| Watch `is_preview = true` lessons | Yes | Yes | Yes | Yes |
| Customize Pip & Class, Enroll, Earn XP/Badges, Take Boss Quizzes, Claim Certs, Review | No | Yes | Yes | Yes |
| Create/edit/publish own Course Realms, Modules, Lessons, Quizzes & award mentor badges | No | No | Own courses | All courses |
| View Instructor Recharts analytics | No | No | Own courses | All courses |
| Manage user roles, moderate any course, audit/revoke certificates (`/admin`) | No | No | No | Yes |

---

## 4. Pages & Routing Structure

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Playful Hero Showcase with animated Pip, How It Works, Featured Realms & Guild preview |
| `/courses` | Public | Filterable Course Realms catalog with XP & skill badges |
| `/courses/:slug` | Public | Winding Quest Path syllabus, preview player, enroll CTA & reviews |
| `/guild` | Public | Guild Hall XP Leaderboard with Pip avatars, levels & skill tags |
| `/c/:handle` | Public | Public Adventurer Character Sheet (Pip, level, skill bars, badges, earned certs) |
| `/certificates/:code` | Public | Printable/verifiable Guild Certificate |
| `/login`, `/register` | Guest | Sign in / Sign up + Character Class & Pip selection |
| `/dashboard` | Authenticated | Student Command Center (Pip, XP bars, badges, enrolled Realms, certs) |
| `/character` | Authenticated | Edit Class, Pip tint & accessories (`None`, `Glasses`, `Scarf`, `Bow`, `Headphones`, `Freckles`) |
| `/learn/:courseId/lessons/:lessonId` | Enrolled / Owner | Theater Video Player + Quest Path sidebar + `PipCorner` |
| `/learn/:courseId/quiz/:quizId` | Enrolled / Owner | Boss Quiz battle + `RewardOverlay` confetti celebration |
| `/instructor`, `/instructor/courses/:id` | Instructor / Admin | Course/Lesson/Quiz Builder + Recharts analytics + Mentor Badges |
| `/admin` | Admin | User role management, course moderation & certificate audit |

---

## 5. API Endpoints & Supabase RPC Plan

SkillForge LMS uses typed Supabase PostgREST queries + Postgres RPCs (see [ARCHITECTURE.md](./ARCHITECTURE.md) Section 3 for RLS enforcement details):

| Endpoint / RPC | Method / Type | Purpose |
| --- | --- | --- |
| `/rest/v1/courses` | REST `GET/POST/PATCH` | Fetch published Course Realms or manage instructor-owned realms |
| `/rest/v1/enrollments` | REST `GET/POST` | Enroll authenticated learners (`auth.uid() = user_id`) |
| `/rest/v1/lesson_progress` | REST `POST` (`upsert`) | Save `watched_seconds` and `is_completed` idempotently per `(user_id, lesson_id)` |
| `/rest/v1/course_reviews` | REST `GET/POST/PATCH` | Verified 1–5 star ratings + review comments |
| `/rest/v1/guild_leaderboard` | REST `GET` (View) | Ranked Guild Hall totals without client-forged XP |
| `/rest/v1/rpc/get_student_quiz_questions` | RPC (`POST`) | Fetch quiz prompts without exposing `correct_option_index` or answers |
| `/rest/v1/rpc/submit_quiz_attempt` | RPC (`SECURITY DEFINER`) | Server-grade Boss Quiz, record attempt, and credit non-farmed XP deltas |
| `/rest/v1/rpc/claim_course_certificate` | RPC (`SECURITY DEFINER`) | Verify 100% completion + passed quizzes and issue certificate code |

---

## 6. Third-Party Integrations

- **Supabase Auth (Email/Password + GitHub OAuth):** Session management, JWT claims in RLS, and `handle_new_user` profile provisioning.
- **Supabase Storage (`course-thumbnails`, `lesson-videos`):** Instructor media uploads scoped per `/{userId}/...` folder policy.
- **Recharts (`recharts`):** Instructor Studio analytics charts (enrollments trend, completion funnel, average Boss Quiz scores).
- **Motion (`motion/react` `LazyMotion`):** Async-loaded spring animations, `layoutId` pills, Quest Path transitions, and confetti overlay (`reducedMotion="user"`).
- **@fontsource-variable (`Space Grotesk`, `Inter`, `JetBrains Mono`):** Self-hosted typography with zero external Google Fonts network requests.

