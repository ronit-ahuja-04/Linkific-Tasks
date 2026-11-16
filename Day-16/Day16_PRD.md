# PRD: FlowLane + Firebase Storage and a live dashboard (Day 16)

| Field     | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                            |
| Programme | Linkific internship, Month 1 (training phase), Day 16                  |
| Date      | Monday, 16 November 2026                                               |
| Repo path | `Linkific-Tasks/Day-16/flowlane-firebase`                              |
| Builds on | Day 15 `flowlane-auth` (copied unchanged, then extended)               |
| Status    | **Built.** Merged via PRs #76 to #81 (see section 6)                  |
| Companion | `flowlane-firebase/README.md` (the Firebase setup guide)               |

---

## 1. Summary

Day 16 is Firebase end to end: authentication, Firestore, real-time listeners and file uploads, finished as one complete app. FlowLane (the project from Days 11 to 15) already runs on Firebase Auth and Firestore, so the task list is mostly met by it. This day does two things:

1. Closes the two gaps in the task list: **file uploads** (Cloud Storage) and a **real-time dashboard**.
2. Writes down the whole Firebase story (setup guide, data model, security rules, how each task item maps to code) so a reviewer can follow it without asking.

## 2. Goals

- Image upload with Firebase Storage: upload with progress, download URLs, display, delete.
- A real-time dashboard whose numbers change by themselves when anyone on the project changes the board.
- Keep everything from Day 15 working: its tests keep passing.
- A README that takes someone from an empty Firebase console to a running app.

Non-goals: video or document uploads, image resizing or compression, resumable uploads across page reloads, a server of our own for uploads (the browser talks to Storage directly, protected by `storage.rules`).

## 3. Scope

In: profile photo, task image attachments, the Live tab, Storage security rules, tests for each, the README.
Out: anything the Day 16 task list does not name. GitHub and JWT (Day 15) are untouched.

## 4. Design

### 4.1 Mapping the task list

| Day 16 task | Where it is met |
| --- | --- |
| Setup Firebase in React; config file; init app, Auth, Firestore | `src/lib/firebase.js` (Auth, Firestore and, new, Storage; emulator switch) |
| Email and password; Google sign-in; sign up, sign in, sign out; current user; `onAuthStateChanged` | `src/context/AuthContext.jsx`, `src/pages/Auth.jsx` (since earlier days, extended on Day 15) |
| Collections and documents; CRUD; queries; `where`, `orderBy`, `limit` | `projects`, `users`, `invitations`, `direct_messages` collections. `where` in `store/listeners.js`; `orderBy` and `limit` in the chat and in the Live tab's feed |
| Real-time listeners (`onSnapshot`) | `store/listeners.js` (projects, board, users, notifications, invitations), `Chat.jsx`, `useLatestMessages` |
| Chat with real-time messages | `Chat.jsx` (project chat and direct messages, typing indicator) |
| Live notifications | `notifications` sub-collection, toasts (since earlier days) |
| Collaborative todo list | The Kanban board: drag a card and every teammate sees it move |
| Real-time dashboard data | **New:** the Live tab (`LivePulse.jsx`, `lib/stats.js`) |
| Firebase Storage: setup, upload, download URLs, display, delete | **New:** `lib/storage.js`, `storage.rules`, `AvatarUploader.jsx`, `TaskAttachments.jsx` |
| Complete app: auth, profile in Firestore, CRUD, real-time, image upload, protected routes | FlowLane as a whole (`users/{uid}` profile, `RouteGuards.jsx`) |
| README with Firebase setup guide | `flowlane-firebase/README.md` |

### 4.2 Decisions

| Decision | Why |
| --- | --- |
| Extend FlowLane instead of building a new blog, chat or todo app | It already is a chat, a collaborative todo list and a dashboard on Firebase. A second, smaller app would show less. |
| Images go straight from the browser to Storage | No server to run. The protection is `storage.rules`, which is tested against the emulator. |
| Images only (PNG, JPEG, GIF, WebP), 2 MB for photos and 5 MB for attachments, six per task | SVG is refused on purpose: it can carry scripts. Limits are checked in the browser (a friendly message) and in the rules (the real protection). |
| Attachment rules read the project's Firestore document | A file is reachable only by people on the project. Only the owner adds or deletes, matching who can edit the board. |
| The task keeps a small entry per image (`id, name, url, path, size, ...`), written with `arrayUnion` / `arrayRemove` | Two people attaching at once cannot overwrite each other. The `path` is kept so the file can be deleted. |
| The Live tab computes from the board already in Redux | Nothing new is fetched or polled. The numbers are live because the board is. The "All your projects" table needs no extra listener because the projects listener already receives whole project documents. |
| A cleared photo is saved as an empty string | Found by a test: the Auth backend rejects `photoURL: null`. |

## 5. Requirements

| # | Requirement | Verified by |
| --- | --- | --- |
| F1 | A user can upload, replace and remove a profile photo; teammates see it without reloading | unit, browser |
| F2 | The old file is deleted when a photo is replaced or removed | browser (checks Storage itself) |
| F3 | The owner can add up to six images to a task, see them, open them and remove them | unit, browser |
| F4 | Teammates see attachments live; non-owners can neither add nor remove | browser, rules |
| F5 | Deleting a task or a project deletes its image files | unit, browser |
| F6 | Only images under the size limit are accepted, in the browser and by the rules | unit, rules, browser |
| F7 | The Live tab shows task, done, in-progress, high-priority and image counts, per-column and per-priority bars, who has what, and all projects | unit, browser |
| F8 | Those numbers change without a refresh when a teammate changes the board | browser (two users) |
| F9 | New screens are accessible (WCAG 2.1 AA) in light and dark, and translated into English, Spanish and Hindi | axe tests, i18n tests |

## 6. Milestones

| # | Milestone | PR |
| --- | --- | --- |
| M1 | Start from the Day 15 app | #76 |
| M2 | Storage layer, rules and rules tests | #77 |
| M3 | Profile photo and task image attachments | #78 |
| M4 | Live dashboard, README setup guide, PRD | #79 |
| M5 | Local emulator mode (`npm run dev:local`), upload timeout and its fix | #80, #81 |
| M6 | Submission documents (report, PDF, standup script) | #82 |

## 7. Verification

Last full run (`npm run test:all`): 556 unit, 110 server and 38 rules tests passed; of 134 browser tests 132 passed and 2 failed (flaky tests from earlier days, see the README). Details are in the README, section "Tests".

## 8. Risks

| Risk | Handling |
| --- | --- |
| Real Firebase Storage was not exercised, only the emulator | Said plainly in the README. The setup guide lists what to check on a real project. |
| New Firebase projects may need the Blaze (pay as you go) plan to create the default bucket | Documented. The emulators run every image feature for free. |
| Orphaned files if a delete fails half-way | Deleting is best effort and ordered so the app never shows a broken image. Documented under Limits. |

## 9. Deliverables

- `Day-16/flowlane-firebase/`: the app, `storage.rules`, tests
- `Day-16/flowlane-firebase/README.md`: the Firebase setup guide
- This PRD
