# Technical Architecture — SkillForge LMS

This document details the component hierarchy, Redux Toolkit state management flow, Supabase API/RPC integration plan, and Postgres database schema for **SkillForge LMS**.

---

## 1. Component Architecture Diagram

```mermaid
flowchart TD
  Main["main.tsx (Redux Provider + MotionProvider + BrowserRouter)"] --> App["App.tsx"]
  App --> Router["AppRouter"]
  Router --> Shell["AppShell (Nav HUD Pill, Sound/Theme Toggle, AppErrorBoundary, RewardOverlay)"]

  Shell --> Public["Public Pages"]
  Shell --> StudentGuard["ProtectedRoute (authenticated)"]
  Shell --> InstructorGuard["ProtectedRoute (instructor or admin)"]
  Shell --> AdminGuard["ProtectedRoute (admin)"]

  Public --> Home["HomePage (Interactive Pip Combo, Micro-Quest Arcade, Realms Preview)"]
  Public --> Catalog["CatalogPage (Search, Category/Level/Skill Filters, Progress Ribbons)"]
  Public --> Detail["RealmQuestPage (Quest Path Rail, Concept Cards, MicroChallengeCard, BossBattleArena, Reviews)"]
  Public --> Guild["GuildPage (Top-3 Championship Podium, Leaderboard Rows)"]
  Public --> Sheet["CharacterSheetPage (Mood Stage Backdrop, Pip Quotes, Skill Bars, Badges)"]
  Public --> AuthPages["LoginPage / RegisterPage (+ PipCustomizer)"]

  StudentGuard --> Character["CharacterPage (Class, Pip Tint & Accessory Editor)"]
  StudentGuard --> StudentDash["DashboardPage (Command Center, Daily Brain Sprint, Certificates Modal)"]

  InstructorGuard --> InstDash["InstructorStudio (Phase 4: Builder, Storage Uploads, Recharts Analytics)"]
  AdminGuard --> AdminDeck["AdminDeck (Phase 4: Role Management & Moderation)"]
```

### Folder Organization (`Day-25/skillforge-lms/src/`)

```text
src/
  app/
    store.ts              # configureStore combining auth, catalog, guild, quest, ui slices
    hooks.ts              # Typed useAppDispatch & useAppSelector
  components/
    AppErrorBoundary.tsx  # Route-level React Error Boundary with reload action
    MotionProvider.tsx    # LazyMotion (domMax async chunk) + reducedMotion="user"
    game/                 # CountUpValue, FloatingParticles, MicroChallengeCard, RewardOverlay
    layout/               # AppShell (HUD nav pill, sound/theme toggles, toast & reward portal)
    pip/                  # Animated Pip SVG (Egg -> Guardian) & PipCustomizer
  features/
    auth/                 # authSlice.ts, LoginPage, RegisterPage, CharacterPage
    catalog/              # catalogSlice.ts, CatalogPage
    dashboard/            # DashboardPage (Command Center + Certificate preview)
    guild/                # guildSlice.ts, GuildPage (Podium), CharacterSheetPage
    home/                 # HomePage (Pip Combo Hero + Instant Micro-Quest Arcade)
    quest/                # questSlice.ts, RealmQuestPage (Quest Path + Boss Battle + Reviews)
    ui/                   # uiSlice.ts (theme mode, Web Audio sound toggle, toast queue)
  lib/
    api/                  # authApi.ts, catalogApi.ts, guildApi.ts
    game/                 # xp.ts, badges.ts, pip.ts, catalog.ts, sfx.ts
    demoCurricula.ts      # Playable realm modules, slides, challenges & boss questions
    demoData.ts           # Seeded adventurers & course realms for zero-Docker Demo Mode
    supabase.ts           # Lazy-validated Supabase client singleton
  routes/
    AppRouter.tsx         # Route table
    ProtectedRoute.tsx    # Role-based route guard (student / instructor / admin)
  styles/
    index.css             # Tailwind CSS v4 + Plum/Violet/Gold light & dark semantic tokens
  types/
    lms.ts                # Shared strict TypeScript domain interfaces
```

---

## 2. State Management Flow (Redux Toolkit + Supabase)

```mermaid
sequenceDiagram
  actor Learner
  participant UI as RealmQuestPage / MicroChallengeCard
  participant Store as Redux Store (questSlice)
  participant API as src/lib/api/ (Demo Mode or Supabase RPC)
  participant SB as Supabase Postgres (RLS + RPC)

  Learner->>UI: Solves inline challenge & clears Quest Node / Boss
  UI->>Store: dispatch(completeQuestNode / passRealmBoss)
  Store->>API: Award anti-farmed XP delta & check level/badges
  API->>SB: submit_quiz_attempt / lesson_progress (when Supabase Live)
  SB-->>API: 200 OK (score %, XP delta, completion state)
  Store-->>UI: Render RewardOverlay confetti & advance Pip down Quest Path
```

### Slice Ownership Matrix

| Slice | Owns | Key Thunks / Actions |
| --- | --- | --- |
| `authSlice` | `userId`, `email`, `profile`, `mode`, `status` | `hydrateAuth`, `signInWithEmail`, `signUpUser`, `signInWithGithub`, `saveProfile`, `signOutUser` |
| `catalogSlice` | `realms`, `filters` (`query`, `category`, `level`, `skillTag`, `sort`), `status` | `fetchRealms`, `setCatalogQuery`, `setCatalogCategory`, `setCatalogLevel`, `resetCatalogFilters` |
| `guildSlice` | `entries`, `status`, `error` | `fetchGuildLeaderboard` |
| `questSlice` | `enrolledCourseIds`, `completedLessonIds`, `passedQuizCourseIds`, `claimedCertificateIds`, `arcadeSolvedIds`, `sessionEarnedXp`, `activeReward` | `enrollInRealm`, `completeQuestNode`, `passRealmBoss`, `claimRealmCertificate`, `solveArcadeChallenge`, `addRealmReview`, `dismissReward` |
| `uiSlice` | `theme` (`light` \| `dark`), `soundEnabled`, `toasts` | `toggleTheme`, `toggleSound`, `pushToast`, `dismissToast` |

---

## 3. API & Supabase Integration Plan

| Operation | Transport | Auth / RLS Rule |
| --- | --- | --- |
| Browse & filter courses | `supabase.from('courses').select(...)` | Public read for `status = 'published'`; owner read for drafts |
| Load course detail & reviews | `courses` + `modules` + `lessons` + `course_reviews` | Published courses public; enrolled/owner sees all lesson URLs |
| Fetch Guild Hall leaderboard | `supabase.from('guild_leaderboard').select('*')` | Read-only SQL view summing lesson/quiz XP without client overrides |
| Enroll in course | `supabase.from('enrollments').insert({ course_id })` | `auth.uid() = user_id` and target course `status = 'published'` |
| Save video watch position | `supabase.from('lesson_progress').upsert(...)` | `auth.uid() = user_id` and user is enrolled in parent course |
| Fetch quiz questions (student) | `supabase.rpc('get_student_quiz_questions', { p_quiz_id })` | RPC omits `correct_option_index` and `explanation` for enrolled learners |
| Grade quiz submission | `supabase.rpc('submit_quiz_attempt', { p_quiz_id, p_answers })` | `SECURITY DEFINER` verifies enrollment, grades server-side, awards score-delta XP |
| Claim completion certificate | `supabase.rpc('claim_course_certificate', { p_course_id })` | Verifies 100% lessons completed + all course quizzes passed |
| Verify public certificate | `supabase.from('certificates').select(...).eq('certificate_code', code)` | Public read-only by `certificate_code` |
| Award mentor badge | `supabase.from('mentor_badges').insert(...)` | `is_instructor_or_admin()` verified by RLS |
| Upload thumbnail / lesson video | `supabase.storage.from('course-thumbnails' \| 'lesson-videos').upload(...)` | Folder prefix `/{userId}/...` enforced by Storage RLS policy |

---

## 4. Database Schema (Postgres ERD)

```mermaid
erDiagram
  profiles {
    uuid id PK
    text handle UK
    text full_name
    text role
    text character_class
    int pip_tint
    int pip_accessory
    text bio
    text avatar_url
    timestamptz created_at
  }
  courses {
    uuid id PK
    uuid instructor_id FK
    text slug UK
    text title
    text subtitle
    text category
    text skill_tag
    text level
    text status
    int xp_reward
    text thumbnail_url
    int estimated_minutes
  }
  modules {
    uuid id PK
    uuid course_id FK
    text title
    int position
  }
  lessons {
    uuid id PK
    uuid module_id FK
    text title
    text video_url
    int duration_seconds
    text difficulty
    int xp_reward
    int position
    boolean is_preview
  }
  enrollments {
    uuid id PK
    uuid user_id FK
    uuid course_id FK
    timestamptz enrolled_at
    timestamptz completed_at
  }
  lesson_progress {
    uuid id PK
    uuid user_id FK
    uuid lesson_id FK
    int watched_seconds
    boolean is_completed
    timestamptz last_watched_at
  }
  quizzes {
    uuid id PK
    uuid course_id FK
    uuid module_id FK
    text title
    int passing_score
    int xp_reward
  }
  quiz_questions {
    uuid id PK
    uuid quiz_id FK
    text prompt
    jsonb options
    int correct_option_index
    text explanation
    uuid remediation_lesson_id FK
    int remediation_seconds
    int position
  }
  quiz_attempts {
    uuid id PK
    uuid user_id FK
    uuid quiz_id FK
    jsonb answers
    int score_percent
    boolean passed
    timestamptz attempted_at
  }
  course_reviews {
    uuid id PK
    uuid user_id FK
    uuid course_id FK
    int rating
    text comment
    timestamptz created_at
  }
  mentor_badges {
    uuid id PK
    uuid user_id FK
    uuid awarded_by FK
    text name
    text icon
    text reason
    timestamptz awarded_at
  }
  certificates {
    uuid id PK
    uuid user_id FK
    uuid course_id FK
    text certificate_code UK
    timestamptz issued_at
  }

  profiles ||--o{ courses : "instructs"
  profiles ||--o{ enrollments : "owns"
  profiles ||--o{ lesson_progress : "tracks"
  profiles ||--o{ quiz_attempts : "submits"
  profiles ||--o{ course_reviews : "authors"
  profiles ||--o{ mentor_badges : "earns"
  profiles ||--o{ certificates : "receives"
  courses ||--|{ modules : "has"
  modules ||--|{ lessons : "has"
  courses ||--o{ enrollments : "receives"
  courses ||--o{ quizzes : "contains"
  modules ||--o{ quizzes : "contains"
  courses ||--o{ course_reviews : "gets"
  courses ||--o{ certificates : "issues"
  lessons ||--o{ lesson_progress : "measured_by"
  lessons ||--o{ quiz_questions : "remediates"
  quizzes ||--|{ quiz_questions : "defines"
  quizzes ||--o{ quiz_attempts : "graded_in"
```
