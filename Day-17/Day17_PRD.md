# PRD: Huddle, a team workspace on Supabase (Day 17)

| Field     | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                            |
| Programme | Linkific internship, Month 1 (training phase), Day 17                  |
| Date      | Tuesday, 17 November 2026                                              |
| Repo path | `Linkific-Tasks/Day-17/huddle`                                         |
| Status    | **Built.** Run against the local Supabase stack (cloud project is documented, not run) |
| Companion | `huddle/README.md`, `FIREBASE_VS_SUPABASE.md`                          |

---

## 1. Summary

Day 17 is Supabase: PostgreSQL, authentication, Row Level Security, CRUD with filters, Realtime, Storage and SQL functions. Huddle is a small team workspace (chat rooms, notes with full-text search, file sharing, profile, dashboard) built so that every one of those topics is used in a real feature and explained on the page that uses it. It is a new app, not an extension of FlowLane, so the comparison with Firebase comes from two real implementations.

## 2. Goals

- A React app that talks to Supabase only through supabase-js and the anon key.
- Authentication: email and password, magic link, Google and GitHub sign-in, password reset, change password, sign out everywhere, protected routes.
- A relational schema with constraints and indexes, and Row Level Security on every table.
- CRUD with filters (`eq`, `gt`, `lt`, `ilike`), ordering, limit and range pagination.
- Realtime: live messages and notes, typing indicators, presence.
- Storage: a public bucket (avatars) and a private bucket (attachments) with signed URLs.
- SQL features: RPC functions, full-text search, generated columns, triggers.
- Runs locally with one command and no account; the README explains the cloud setup.
- A Firebase vs Supabase comparison document.
- Tests at every level, including attacks on the API that bypass the UI.

## 3. Non-goals

- Edge Functions, email templates, phone or multi-factor authentication.
- Offline support, push notifications, message threads, reactions, search in chat.
- A production deployment (hosting, a cloud project, custom domain).
- Replacing FlowLane or changing Days 10 to 16.

## 4. Users

A small team: members sign up, join rooms, share notes and files. Two visibility levels exist for notes (`private`, `team`) and for rooms (public, private).

## 5. Requirements

### 5.1 Authentication
| # | Requirement |
|---|---|
| A1 | Sign up with email, password, username and full name; a database trigger creates the profile. |
| A2 | Sign in with password; sign in with a magic link; sign in with Google or GitHub when the server has the provider enabled (buttons appear only then). |
| A3 | Forgot password sends an email; the link opens a reset form; the answer is the same for any address. |
| A4 | Signed-out visitors can only see the sign-in, register and forgot pages; signed-in users are sent away from them; a protected page returns the user to where they were going after sign-in. |
| A5 | Change password; sign out on this device; sign out on all devices (the other device must notice). |
| A6 | The session survives a reload and is shared by tabs. |

### 5.2 Data and security
| # | Requirement |
|---|---|
| D1 | Tables: profiles, notes, tags, note_tags, files, rooms, room_members, messages, notifications. |
| D2 | Row Level Security is on for every table and for storage objects. A user can never read someone else's private note, private room, private file or notification, and can never write as someone else. |
| D3 | Notifications cannot be created by a client, and a client can only change `read_at`. |
| D4 | Generated columns (`rooms.slug`, `notes.fts`), partial and composite indexes, check and unique constraints. |
| D5 | Triggers: profile on sign-up, creator joins the room, mentions create notifications, timestamps, edited flag. |
| D6 | RPCs: `search_notes`, `unread_counts`, `mark_room_read`, `workspace_stats`. They run with the caller's rights. |

### 5.3 Features
| # | Requirement |
|---|---|
| F1 | **Notes:** create, edit, delete, tags, visibility, pin, priority; filters; 6 per page; full-text search with ranking, word forms, exclusion and phrases; highlighted snippets that cannot inject HTML. |
| F2 | **Chat:** public and private rooms; messages appear live in other windows; edit and delete own messages; typing indicator; who is online; `@mentions`; attachments; unread badges that reset when a room is opened. |
| F3 | **Notifications:** a bell with a live count and a list; mark read. |
| F4 | **Files:** upload up to 10 MiB, list, download, delete, signed URL with chosen expiry and a countdown; the list shows only my files. |
| F5 | **Profile:** edit details, avatar in a public bucket, linked sign-in methods. |
| F6 | **Dashboard:** numbers from one RPC call, my rooms, recent notes and files. |
| F7 | **Query lab:** every supabase-js call used, runnable, with the SQL it becomes and the real result; RLS demos show what was filtered. |

### 5.4 Quality
- Accessible: WCAG 2.1 AA (axe) on every page in light and dark themes; keyboard usable; labelled forms; live regions for status.
- Responsive: no horizontal scrolling at 375 px.
- Light and dark themes.
- No secret in the repository: only the public anon key is used by the app; the service role key is never used; OAuth secrets live in git-ignored files.
- User-supplied text is rendered as text (no `dangerouslySetInnerHTML`).

## 6. Architecture

React 19 + Vite, React Router, Context for auth, theme and toasts, supabase-js as the only data layer. A local Supabase stack (Docker) provides Postgres 17, GoTrue, PostgREST, Realtime, Storage, Kong and a mail catcher. Migrations in `supabase/migrations`, demo data in `supabase/seed.sql`, database tests in `supabase/tests/database`.

## 7. Acceptance and results

| Check | Result |
|---|---|
| Unit and component tests (Vitest) | 256 pass |
| Database tests (pgTAP) | 77 assertions pass |
| Browser tests against the real stack (Playwright, Chrome) | 49 pass, in the dev server and in the production bundle |
| Of which attacks through the API without the UI | 15 (anon reads and writes, forged owners, another user's rows, notifications, storage, tampering with `read_at`) |
| Accessibility | axe WCAG 2.1 AA clean on every page, light and dark |
| Lint, build | clean |

## 8. Risks and how they were handled

| Risk | Handling |
|---|---|
| A missing policy looks like an empty result, not an error | pgTAP and API-level tests assert both what is returned and what is refused |
| Policies recursing into each other | `security definer` helper functions |
| Policies combine with OR, so a list shows more than intended | explicit `owner_id` filters; found and fixed by a browser test |
| Access tokens outlive "sign out everywhere" | `getUser()` check on load |
| Realtime events are not guaranteed | refetch on connect and on open; lists never depend only on events |
| Supabase default limits break tests | raised in the local `config.toml` only |

## 9. Out of scope / not verified

- A real Google or GitHub sign-in (needs the user's own OAuth apps).
- A Supabase cloud project (the steps are in the README; only the local stack ran).
- Browsers other than Chrome, and real phones.
