# Lumo

**Learn a little. Light up a lot.** A game-driven learning world with an AI guide, Wisp. Courses are islands, lessons are lanterns, and the fog of forgetting (spaced repetition) brings learners back.

- **Capstone:** Linkific internship, Days 25–30. Day 27 rebuilds Day 25–26's SkillForge as Lumo; each day's version lives in its own `Day-N/lumo` folder
- **Design prototype:** [Lumo canvas](https://claude.ai/artifact/8rXkMpS2MWU91gR5NQAcdR) (every screen, the cast, the flows)
- **Plan:** local `Day-27/DAY27_PLAN.md`
- **Stack:** React 19, Vite 8, strict TypeScript, Tailwind CSS 4, Redux Toolkit, React Router 7, Supabase (Postgres, Auth, Row Level Security, Storage, Realtime). Zero-cost by design: Supabase free plan, Vercel Hobby, and the Gemini API free tier for the AI parts (later milestones).

## Status

| Milestone | What                                                                                | State                                                                  |
| --------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| M1        | Foundation: design tokens, characters, schema + RLS + pgTAP, auth, the four roles   | **done**                                                               |
| M2        | Studio CRUD, uploads, Explore search, Realtime job status (Day 27 brief)            | **done**                                                               |
| M2b       | Video spike: script → local voice → captions → animated Remotion video              | **done**                                                               |
| M3        | Learner loop: lessons, server-graded quizzes, rewards, fog review                   | **done**                                                               |
| M4        | AI pipeline: topic → script + quiz → code check → rendered video → review → publish | **built** (tested with the stand-in AI; the Gemini run needs your key) |
| M5        | Certificates, comeback, admin review and Wisp safety                                |                                                                        |
| M6        | E2E, accessibility, performance, deployment                                         |                                                                        |

## Run it locally

Needs Node 20+, Docker (Colima on this Mac) and about 4 GB of free memory.

```bash
cd Day-27/lumo
npm install
npm run db:start      # local Supabase on ports 54420–54424 (separate from Huddle's 543xx)
npm run env:local     # writes .env with the local URL and the public anon key
npm run dev           # http://localhost:5180
```

With Colima, the Supabase CLI needs to be told where Docker is: `export DOCKER_HOST=unix://$HOME/.colima/default/docker.sock`.

To try "Ask Wisp to draft a unit", run the content worker in a second terminal: `npm run worker` (see [Wisp drafts a unit](#wisp-drafts-a-unit-m4)).

Applying new migrations to an existing local database (keeps your data): `npx supabase migration up`.

Demo accounts (local only), password `lumo-demo-123`:

| Account          | Role       | Lands on          |
| ---------------- | ---------- | ----------------- |
| maya@lumo.local  | learner    | the map           |
| sam@lumo.local   | learner    | the map           |
| riya@lumo.local  | instructor | the course studio |
| admin@lumo.local | admin      | people & roles    |

## Wisp drafts a unit (M4)

An instructor with no content types a topic ("Arrays: lists of values") and Wisp drafts a whole unit: an animated video and a quiz. The worker (`npm run worker`) runs on this Mac and reports every step live in the studio:

| Step   | What happens                                                                                                                                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Write  | One AI request returns the whole unit as structured JSON: unit title, a 60-second video script (scenes and lines), 3–4 questions with explanations and a note for every wrong option                                                                                                                        |
| Check  | Shape, lengths, duplicate options, valid answer index; an unusable draft gets one retry with the problems listed                                                                                                                                                                                            |
| Verify | Every "what does this print?" question is run in a sandbox (a separate Node process with the permission model on, inside an empty VM context: no files, network, `process` or modules, 1-second limit). A wrongly marked answer is corrected; a question whose code doesn't print what it claims is dropped |
| Save   | A **hidden** draft unit: learners can't see it (database policies), and every answer key is marked "needs checking"                                                                                                                                                                                         |
| Render | The [video package](video/README.md) records the narration (Kokoro, local) and renders it with the island's guardian; one retry, then the lesson falls back to its transcript                                                                                                                               |
| Review | The instructor opens and saves each question; **Publish unit** stays disabled until all are checked (`publish_unit()` enforces it)                                                                                                                                                                          |

**Free-quota handling:** a per-minute limit is waited out; the daily limit parks the job as "waiting for quota" with the time it will try again (after Google's midnight-Pacific reset), and it resumes by itself. One request per unit keeps a whole course well inside the free tier.

### Add your Gemini key (free, no card)

1. Create a key at [aistudio.google.com](https://aistudio.google.com) → **Get API key**. The free tier needs no billing account; when the free quota is used up, requests just fail and wait. (On the free tier Google may use prompts to improve its products; Lumo's prompts contain only the course and the topic.)
2. Save it into `.env.worker` (gitignored, readable only by you) without it appearing on screen:

```bash
cd ~/Desktop/Linkific-Tasks/Day-27/lumo && read -s "k?Gemini API key: " && printf 'GEMINI_API_KEY=%s\n' "$k" > .env.worker && chmod 600 .env.worker && unset k && echo saved
```

3. Restart `npm run worker`: it says `AI = Gemini (free tier)`. Without a key it uses a stand-in that writes a generic draft with no AI, so the whole pipeline can be tried for free. Set `LUMO_RENDER=0` to skip video rendering.

## The learner loop (M3)

1. **Meet Wisp:** a new learner's first screen is a short chat: pick an island, a daily goal (3/10/20/30 min) and how Wisp should talk (cheeky, calm or coach). Learners who already know some of the topic get a two-question placement check; both right starts them at unit 2 (unit 1 stays open).
2. **The map** shows finished, current, skipped and locked lessons, the daily flame (lit or not yet today, in the learner's timezone) and Light.
3. **A lesson:** the video bite with captions and a transcript, then the questions one at a time (keys 1–6 and Enter work). The server grades each answer and only then reveals the right one; Wisp explains, including the note for the exact wrong option picked. A miss comes back at the end until it's right.
4. **Rewards:** Light (once per lesson), the flame, level-ups and Wisp's growth stage.
5. **The fog:** every idea a lesson checks is scheduled with FSRS. When one is due, Gloom's fog covers its unit on the map; a review (up to 10 ideas) clears it, +2 Light per idea that was really due. Misses come back in 10 minutes; remembered ideas move days ahead.

Wisp's explanations come from the lesson's own (instructor-checked) text, in the chosen personality. Explanations in Wisp's own words through the AI arrive with M4, grounded in the same text.

## What the course studio does (M2)

| Day 27 brief               | In Lumo                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| CRUD                       | Courses, units, lessons and questions: create, edit, reorder (one atomic call), delete or hide                                             |
| Forms with validation      | Course, lesson and question forms check the same rules as the database, show errors next to each field and move focus to the first one     |
| Data display               | Island cards, the path (units and lessons with type, length, questions, video), question cards with the correct option and "checked" badge |
| Search and filter          | Explore: words (title, island, summary), topic and level, all in the URL; the studio list filters by status                                |
| API calls, loading, errors | Typed API layer, skeletons and loading states, one error model, toasts for every save and failure                                          |
| Real-time                  | Wisp's workshop: a generation job's progress arrives live over Supabase Realtime, and the drafted unit appears without a reload            |
| File uploads               | Lesson videos (MP4/WebM, 50 MB): drag and drop or pick, type and size checked first, real progress, cancel, duration read from the file    |

Edge cases handled: a course link that's already taken, two options that say the same thing, a removed option (the right answer and the notes move with it), an empty course sent for review, a live course (lessons can be hidden, not deleted, so learners keep their progress), a second draft job while one is running, a job nobody picks up, leaving mid-upload, a replaced video (the old file is deleted), and a failed save after upload (the new file is deleted).

## How security works

The browser holds only the public anon key and the signed-in user's token; **Postgres decides everything**:

- **Every table has Row Level Security.** Live courses are public; drafts are visible only to their owner and admins.
- **Answer keys live in their own table** that learners can't read at all. Answers are graded by `submit_answer()` on the server, which reveals the key only after an answer is committed.
- **Points can't be faked.** Learners have column-level update rights only on their name, handle, timezone, goal and Wisp persona. Light, flames and roles change only inside `SECURITY DEFINER` functions.
- **Light is awarded once per lesson** (`complete_lesson()`), and the daily flame is computed in the learner's own timezone, with an Ember covering one missed day.
- **New accounts are always learners**, whatever the sign-up form sends. Roles change only through `set_user_role()`: admin-only, written to the audit log, and it refuses to remove the last admin.
- **Status rules:** instructors move their course between draft and in review; only admins publish or archive.
- **Lesson media is private.** Videos sit in a private bucket under `<course id>/…`; a file can be read only by someone who can see its course, through short-lived signed links, so drafts never leak. Uploads, replacements and deletes are allowed only for the course's editors.
- **A question is never saved without its key.** `save_question()` writes both in one transaction and checks that the correct option exists and no two options are the same. Questions Wisp drafts stay "unverified" until a person saves them.
- **Live content can't be hard-deleted** (a trigger refuses it), because learner progress would cascade away; lessons are hidden instead. Courses are soft-deleted through `delete_course()`, which is audit-logged, and only admins can remove a live one.
- **The learner loop can't be gamed from the browser:** lessons complete only when every question has a correct server-graded attempt (`complete_lesson()`), Light is awarded once per lesson, review Light only for ideas that were actually due (`review_answer()`), the FSRS schedule is computed in Postgres (`fsrs_next()`), and the flame helper (`bump_flame()`) can't be called by clients. Placement only moves the START marker, so nothing is awarded by it.
- **Generation jobs:** only one active job of a kind per course (a unique index), editors can cancel, and only the worker (service role, server side) writes progress.
- **AI content is never shown unreviewed:** drafted units are unpublished, which hides them and their lessons and questions from learners (row-level policies, and the review function skips them), and `publish_unit()` refuses while any answer key is unchecked. The AI key lives only in the worker's `.env.worker`, never in the browser.

## Tests

```bash
npm test          # unit + component tests (Vitest)
npm run db:test   # pgTAP: the security rules above, inside the real database
npm run typecheck && npm run lint && npm run format:check
```

## Project layout

```
src/
  components/characters   Wisp (4 stages × 5 moods), Byte, Nova, Gloom, Guardian
  components/ui           Button, Field, Select/TextArea fields, Dialog, skeletons, Loading, ErrorPanel
  components/layout       LearnerShell (bottom tabs / side rail), StaffShell (sidebar)
  features/               welcome, auth, map, explore, me, studio, admin, toast
  lib/                    supabase client, error model, typed API (courses, studio, storage), game rules, useAsync
  routes/                 router, role guard, home per role
supabase/
  migrations/             the schema, policies, functions, storage buckets
  seed.sql                demo accounts, Code Reef, Starfall Lagoon (draft) and three more live islands
video/                    lesson videos: script → narration (Kokoro) → captions → Remotion render (see video/README.md)
scripts/
  write-env.mjs           writes .env for the local stack (public anon key only)
  ai-worker.mjs           the content worker (npm run worker): write → check → verify → save → render
  ai/                     the draft format and prompt, AI providers (Gemini, stand-in), the code sandbox
  tests/database/         pgTAP tests
```
