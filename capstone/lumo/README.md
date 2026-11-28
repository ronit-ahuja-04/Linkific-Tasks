# Lumo

**Learn a little. Light up a lot.** A game-driven learning world with an AI guide, Wisp. Courses are islands, lessons are lanterns, and the fog of forgetting (spaced repetition) brings learners back.

- **Capstone:** Linkific internship, Days 25–30 (rebuilt from Day 25–26's SkillForge from Day 27 on)
- **Design prototype:** [Lumo canvas](https://claude.ai/artifact/8rXkMpS2MWU91gR5NQAcdR) (every screen, the cast, the flows)
- **Plan:** local `Day-27/DAY27_PLAN.md`
- **Stack:** React 19, Vite 8, strict TypeScript, Tailwind CSS 4, Redux Toolkit, React Router 7, Supabase (Postgres, Auth, Row Level Security, Storage, Realtime). Zero-cost by design: Supabase free plan, Vercel Hobby, and the Gemini API free tier for the AI parts (later milestones).

## Status

| Milestone | What                                                                              | State    |
| --------- | --------------------------------------------------------------------------------- | -------- |
| M1        | Foundation: design tokens, characters, schema + RLS + pgTAP, auth, the four roles | **done** |
| M2        | Studio CRUD, uploads, Explore search, Realtime job status (Day 27 brief)          | next     |
| M3        | Learner loop: lessons, server-graded quizzes, rewards, fog review                 |          |
| M4        | AI pipeline: outline → scripts → quizzes → rendered videos                        |          |
| M5        | Certificates, comeback, admin review and Wisp safety                              |          |
| M6        | E2E, accessibility, performance, deployment                                       |          |

## Run it locally

Needs Node 20+, Docker (Colima on this Mac) and about 4 GB of free memory.

```bash
cd capstone/lumo
npm install
npm run db:start      # local Supabase on ports 54420–54424 (separate from Huddle's 543xx)
npm run env:local     # writes .env with the local URL and the public anon key
npm run dev           # http://localhost:5180
```

With Colima, the Supabase CLI needs to be told where Docker is: `export DOCKER_HOST=unix://$HOME/.colima/default/docker.sock`.

Demo accounts (local only), password `lumo-demo-123`:

| Account          | Role       | Lands on          |
| ---------------- | ---------- | ----------------- |
| maya@lumo.local  | learner    | the map           |
| sam@lumo.local   | learner    | the map           |
| riya@lumo.local  | instructor | the course studio |
| admin@lumo.local | admin      | people & roles    |

## How security works

The browser holds only the public anon key and the signed-in user's token; **Postgres decides everything**:

- **Every table has Row Level Security.** Live courses are public; drafts are visible only to their owner and admins.
- **Answer keys live in their own table** that learners can't read at all. Answers are graded by `submit_answer()` on the server, which reveals the key only after an answer is committed.
- **Points can't be faked.** Learners have column-level update rights only on their name, handle, timezone, goal and Wisp persona. Light, flames and roles change only inside `SECURITY DEFINER` functions.
- **Light is awarded once per lesson** (`complete_lesson()`), and the daily flame is computed in the learner's own timezone, with an Ember covering one missed day.
- **New accounts are always learners**, whatever the sign-up form sends. Roles change only through `set_user_role()`: admin-only, written to the audit log, and it refuses to remove the last admin.
- **Status rules:** instructors move their course between draft and in review; only admins publish or archive.

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
  components/ui           Button, Field, Loading, ErrorPanel + style builders
  components/layout       LearnerShell (bottom tabs / side rail), StaffShell (sidebar)
  features/               welcome, auth, map, explore, me, studio, admin
  lib/                    supabase client, error model, typed API, game rules, useAsync
  routes/                 router, role guard, home per role
supabase/
  migrations/             the schema, policies, functions, storage buckets
  seed.sql                demo accounts and the Code Reef course
  tests/database/         pgTAP tests
```
