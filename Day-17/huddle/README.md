# Huddle: a team workspace on Supabase

**Day 17 project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, Vite, supabase-js, a local Supabase stack (PostgreSQL 17, GoTrue Auth, PostgREST, Realtime, Storage), Vitest, Testing Library, pgTAP, Playwright
**PRD:** [Day17_PRD.md](../Day17_PRD.md)
**Comparison:** [FIREBASE_VS_SUPABASE.md](../FIREBASE_VS_SUPABASE.md)

Huddle is a small team workspace: chat rooms, notes with full-text search, file sharing, a profile page and a dashboard. It exists to use every part of Supabase for real, and every page says which supabase-js call or SQL feature it is showing.

| Task from the brief | Where it is |
|---|---|
| Supabase project, client, environment variables | `src/lib/supabase.js`, `.env`, `supabase/config.toml` |
| Email and password, magic link, OAuth (Google, GitHub), password reset | `src/auth/AuthContext.jsx`, `src/pages/auth/` |
| Tables, relations, constraints, indexes | `supabase/migrations/` |
| Row Level Security (35 policies) | `supabase/migrations/` (every table has RLS on) |
| CRUD with filters, ordering, limit and ranges | Notes page, `src/lib/notes.js`, the Query lab |
| Realtime (changes, typing, presence) | Chat page, Notes ("live" badge), `src/components/chat/useRoomChannel.js` |
| Storage (public and private buckets, signed URLs) | Files page, Profile picture, chat attachments |
| RPC, full-text search, computed columns, triggers | `search_notes`, `unread_counts`, `workspace_stats`; generated `fts` and `slug` columns; five triggers |
| Firebase vs Supabase | [FIREBASE_VS_SUPABASE.md](../FIREBASE_VS_SUPABASE.md) |

## Run it (local Supabase, no account needed)

You need Node 20+, Docker (Docker Desktop, or Colima on a Mac) and about 4 GB of memory for the containers.

```bash
cd Day-17/huddle
npm install
npm run db:start      # starts Postgres, Auth, REST, Realtime, Storage and a mail catcher; applies the migrations and the seed
npm run env:local     # writes .env with the local API URL and the public anon key
npm run dev           # http://localhost:5176
```

- The demo accounts are `ada@example.com` and `grace@example.com`, password `demo-password-123` (they exist only in the local seed).
- Emails (sign-up confirmation is off locally; magic links and password resets are sent) land in the mail catcher at http://127.0.0.1:54324.
- `npm run db:reset` wipes the database and re-applies the migrations and the seed. `npm run db:stop` stops the containers.
- The Studio dashboard, log collection, image transforms and edge functions are not started (`-x` in `db:start`) to keep the stack small.

### Use a Supabase cloud project instead

1. Create a project at supabase.com (free tier).
2. `npx supabase login`, then `npx supabase link --project-ref <your-ref>`.
3. `npx supabase db push` applies the migrations (the seed is **not** applied to a cloud project).
4. Copy the project URL and the **anon / publishable** key (Project settings, API) into `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never use the `service_role` / secret key in the browser.
5. Authentication, URL configuration: set the Site URL to where the app runs and add `/auth/callback` and `/auth/reset` to the redirect URLs. Turn on Email confirmations if you want them.
6. Realtime is enabled by the last migration (the `supabase_realtime` publication). Storage buckets are created by the migration too.

### Turn on Google or GitHub sign-in

The buttons appear only when the server has the provider enabled (the app reads `/auth/v1/settings`).

1. Create an OAuth app at the provider. Callback URL for local development: `http://127.0.0.1:54321/auth/v1/callback`. For a cloud project it is `https://<ref>.supabase.co/auth/v1/callback`.
2. Local: copy `supabase/.env.example` to `supabase/.env`, fill in the id and secret, set `enabled = true` for the provider in `supabase/config.toml`, then `npx supabase stop && npm run db:start`.
   Cloud: Authentication, Sign in / Providers in the dashboard.
3. The secrets live in `supabase/.env` (git-ignored) or in the dashboard, never in the repo.

**Not verified here:** a real Google or GitHub sign-in (it needs your own OAuth app). The flow up to the provider redirect, and the callback handling, are tested; the provider's own consent screen is not.

## How it works

```
Browser (React + supabase-js)  ──HTTP──►  Kong gateway ──► GoTrue   (sign-up, sign-in, magic link, OAuth)  issues a JWT
   anon key + the user's JWT                           ├─► PostgREST (from().select()/insert()/rpc())     runs SQL AS the user
                                                       ├─► Storage   (upload, signed URLs)                 policies on storage.objects
                              ──WebSocket──►  Realtime (postgres_changes, Broadcast, Presence)  reads the WAL, filters with RLS
                                                              all of it ──► PostgreSQL 17 (the one source of truth)
```

The browser only ever holds the **anon key** (public) and the signed-in user's **JWT**. PostgREST puts the JWT's claims into the Postgres session, so `auth.uid()` inside a policy is the signed-in user. That is why the security rules live in the database and a client cannot get around them.

### Schema (9 tables)

`profiles` (one per auth user, created by a trigger), `notes`, `tags`, `note_tags` (many to many), `files`, `rooms`, `room_members`, `messages`, `notifications`.

- **Generated columns:** `rooms.slug` (from the name) and `notes.fts`, a `tsvector` with a GIN index for full-text search.
- **Indexes:** composite (`owner_id, created_at desc`), partial (pinned notes only, unread notifications only), GIN for search, and foreign-key indexes.
- **Constraints:** `check` on username format and priority range, unique `(owner_id, name)` for tags, `on delete cascade` for everything owned by a user.

### Row Level Security

| Table | Who can do what |
|---|---|
| `profiles` | everyone signed in reads; only the owner updates (a trigger creates it, so there is no insert policy) |
| `notes` | read my own and `team` ones; write only my own |
| `tags`, `note_tags` | read all tags; I manage my own tags and links on my own notes |
| `files` | I manage mine; room members read files attached to messages they can see |
| `rooms`, `room_members` | public rooms are readable and joinable; private rooms only by members |
| `messages` | read and send in rooms I can access; edit and delete only my own |
| `notifications` | read mine; the client may only set `read_at` (column-level privilege); the rows are created by a trigger |
| `storage.objects` | `avatars` public to read, write only under my own folder; `attachments` private, owner or room member |

Two tricks to know: policies are written `(select auth.uid())` so Postgres evaluates it once per query, not once per row; and policies that look into another table which itself has policies (for room membership) go through `security definer` helper functions, otherwise Postgres reports infinite recursion.

### Functions and triggers

| Name | Kind | What |
|---|---|---|
| `handle_new_user` | trigger on `auth.users` | creates the profile from the sign-up metadata |
| `add_room_creator` | trigger | the creator becomes a member of their new room |
| `notify_mentions` | trigger on `messages` | `@username` in a message creates a notification |
| `set_updated_at`, `mark_message_edited` | triggers | bookkeeping columns |
| `search_notes(q)` | RPC | `websearch_to_tsquery`, `ts_rank`, `ts_headline` (marks matches with `[[ ]]`, not HTML) |
| `unread_counts()`, `mark_room_read(room)` | RPC | unread badges |
| `workspace_stats()` | RPC | the dashboard numbers in one round trip |
| `is_room_member`, `can_access_room` | `security definer` helpers | used by policies to avoid recursion |

The RPCs are `security invoker`: they run with the caller's rights, so RLS still applies inside them (a search never returns someone's private note).

## The pages

- **Dashboard:** numbers from `rpc('workspace_stats')`, my rooms, recent notes and files.
- **Chat:** public and private rooms, live messages (`postgres_changes`), typing indicators (Broadcast), who is online (Presence), edit and delete, `@mentions`, file attachments, unread badges. A bell in the header lists notifications, also live.
- **Notes:** create, edit, delete; tags (many to many); visibility `private` or `team`; filters (`eq`, `gt`, `lt`, `ilike`, `order`, `range` pagination); full-text search that understands word forms (`run` finds `running`) and operators (`-word`, `"exact phrase"`); a live badge when a teammate's team note arrives.
- **Files:** upload (10 MiB limit, types checked by the bucket), download, delete, and **signed URLs** with an expiry and a countdown; two demos show a public URL opening and a private one being refused.
- **Query lab:** 34 runnable examples of the supabase-js calls with the SQL they become, including RLS demos that show what RLS filtered out. The writes only touch your own notes titled `lab-scratch-...` and delete them right after (a button removes any leftovers).
- **Profile:** name, username, bio, avatar upload (public bucket), change password, **sign out on all devices**, linked sign-in methods.

## Tests

```bash
npm test                 # 256 unit and component tests (fake supabase client)
npm run db:test          # 77 pgTAP assertions inside the real database
npm run test:e2e         # 49 browser tests against the real local stack
npm run test:e2e:prod    # the same against the production bundle
npm run lint
```

| Layer | What |
|---|---|
| Unit / component (Vitest, Testing Library) | auth context and guards, every page and component with a fake client, the query builders, error mapping, escaping of `like` input |
| Database (pgTAP) | policies from the point of view of several users and of `anon`, triggers, constraints, RPCs, storage policies |
| Browser (Playwright, Chrome) | sign-up creates a profile, magic link and password reset through the mail catcher, two browsers chatting live, unread badges, notes CRUD and search, uploads and signed URLs, the Query lab, axe WCAG 2.1 AA on every page in light and dark, no horizontal scroll at 375 px, and **15 attacks that call the API directly with the anon key or another user's token** and must be refused |

The browser tests run against the real stack, not mocks, so they found problems unit tests cannot: see below.

## Bugs the tests found

- **"My files" showed other people's files.** The policies let room members read files attached to messages (so a room can download them). Policies are combined with OR, so `select * from files` returned those too. The list now filters by `owner_id` explicitly: RLS says what you **may** see, the query still has to say what you **want**.
- **Sign out on all devices left the other device signed in.** The access token (a JWT) stays valid until it expires. The app now checks `getUser()` (a server call) after `getSession()` and drops a session the server no longer knows.
- **Unread badges went stale** when two messages arrived together. Counting locally was replaced by asking the database (`unread_counts`) and using only the newest answer; the count is also refreshed when the channel (re)connects.
- **The Query lab and Profile pages scrolled sideways on a phone** (a long code line widened a grid column).
- **Chrome offered to save the new password under the wrong user:** the password forms carry a hidden username field.
- Supabase's default limits (2 emails an hour, 30 sign-ups per 5 minutes) would break the tests, so `config.toml` raises them for local use only.

## Limits and what is not done

- Real Google and GitHub sign-in are unverified (need your own OAuth apps); the cloud project path is documented but was not run, only the local stack.
- Only Chrome was tested, and no real phone (the 375 px check is a Chrome viewport).
- Realtime `postgres_changes` is not guaranteed delivery: if a client is offline it misses events. The app refetches on (re)connect where it matters (unread counts) and the lists refetch when you open them.
- File deletion removes the Storage object and the row in two calls, not one transaction.
- There is no Edge Function, no email templates and no rate limiting beyond Supabase's defaults.
- The seed users and the relaxed rate limits are for local development only.
