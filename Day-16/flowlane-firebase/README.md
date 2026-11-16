# FlowLane + Firebase: Storage, real-time dashboard and a setup guide

**Day 16 project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, Vite, Firebase (Auth, Firestore, Cloud Storage), Redux Toolkit, React Context, Vitest, Testing Library, Playwright
**PRD:** [Day16_PRD.md](../Day16_PRD.md)
**Starting point:** the Day 15 app (`Day-15/flowlane-auth`), copied unchanged and extended. Everything from Day 15 (GitHub sign-in, JWT-checking API, protected routes, three languages, dark mode) still works.

FlowLane is a collaborative task board with chat. It already ran on Firebase Auth and Firestore, so most of the Day 16 task list was met by it. Day 16 adds what was missing and documents the whole thing:

| New on Day 16 | Where it lives |
|---|---|
| **Profile photo**: upload, replace, remove (Cloud Storage) | Profile page: `AvatarUploader`, `lib/profilePhoto.js` |
| **Task images**: up to 6 per task, shown as thumbnails, opened full size, removed | Task panel: `TaskAttachments`, thunks in `boardSlice.js` |
| **Storage security rules**: images only, size limits, tied to the project | `storage.rules` |
| **Live tab**: a real-time dashboard (counts, bars, who has what, all projects, latest chat) | `LivePulse`, `lib/stats.js`, `lib/useLatestMessages.js` |
| This setup guide | below |

---

## Firebase setup guide (from an empty project to a running app)

### 1. Create the project
1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it → (Analytics is optional) → **Create**.

### 2. Turn on Authentication
Build → **Authentication** → **Get started** → **Sign-in method**:
- **Email/Password**: enable.
- **Google**: enable, choose a support email.
- (Day 15, optional) **GitHub**: see "Turn on GitHub sign-in" in `Day-15/flowlane-auth/README.md`.

Under **Settings → Authorized domains**, `localhost` is there by default. Add your hosting domain when you deploy.

### 3. Create the Firestore database
Build → **Firestore Database** → **Create database** → pick a location → **Start in production mode**. Production mode starts closed; the rules in step 6 open exactly what FlowLane needs. (Test mode expires after 30 days and then blocks everything. That already happened to this project once, on 16 October 2026.)

### 4. Turn on Cloud Storage
Build → **Storage** → **Get started** → choose a location. Firebase may ask you to switch the project to the **Blaze (pay as you go)** plan before it creates the default bucket; there is a free monthly allowance, and you can set a budget alert. If you would rather not, the app still works for everything except images, and the emulators (below) run every image feature locally for free.

### 5. Register the web app and copy its config
Project settings (gear icon) → **Your apps** → **`</>` Web** → register → copy the `firebaseConfig` values into a `.env` file:

```bash
cd Day-16/flowlane-firebase
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app   # exactly as the console shows it
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env` is git-ignored. These keys identify the project; they are not secrets. What protects the data is the rules in the next step. Without keys the app still starts and the sign-in page explains that they are missing.

### 6. Publish the security rules
```bash
npm install -g firebase-tools
firebase login
firebase use --add            # choose your project
firebase deploy --only firestore:rules,storage
```
`firestore.rules` and `storage.rules` are in this folder. Read them: each has a comment block that says who may do what.

### 7. Run it
```bash
npm install
npm --prefix server install     # only for the Day 15 Security tab and GitHub import
npm run dev                     # http://localhost:5173
```
Sign up, open **Profile** (the round avatar, top right), upload a photo. Open a task and add an image. Open the **Live** tab.

### Optional: run everything locally with the emulators (no cloud, no card, no Blaze)
```bash
npm run dev:local
```
This starts the Auth, Firestore and Storage emulators and the app together at http://localhost:5173, with the emulator settings passed in (your `.env` is ignored). It is a separate, empty world: sign up with any email, and everything including photo and image uploads works. Stop it with Ctrl+C and its data is gone. The emulators need Java. `src/lib/firebase.js` refuses to use the emulators with a project id that does not start with `demo-`, so it can never touch real data. The emulators need Java.

### Things that go wrong
| You see | Cause |
|---|---|
| Upload stuck, then "Could not reach file storage" (Chrome shows a CORS error on `firebasestorage.googleapis.com`) | Storage was never turned on for the project (step 4): the bucket does not exist. `firebase deploy --only storage` says "Storage has not been set up" too. No Blaze plan, no bucket: use `npm run dev:local` |
| "File storage is not set up" | `VITE_FIREBASE_STORAGE_BUCKET` is empty in `.env`; restart `npm run dev` after editing it |
| "The storage bucket was not found" | Storage was not turned on (step 4) |
| "You are not allowed to do that" on an upload | The Storage rules were not deployed (step 6), or you are not the project's owner (only the owner adds task images) |
| Everything is "permission denied" | Firestore rules missing or expired (step 3 and 6) |
| Google sign-in popup says unauthorized domain | Add the domain under Authentication → Settings → Authorized domains |

---

## The Day 16 task list, item by item

| Task | How it is met | Where |
|---|---|---|
| Firebase in React: config file, init app, Auth, Firestore | One module exports `auth`, `db` and `storage`, with an emulator switch | `src/lib/firebase.js` |
| Email and password; Google sign-in; sign up, sign in, sign out; current user; `onAuthStateChanged` | Yes. The user lives in a React Context | `src/context/AuthContext.jsx`, `src/pages/Auth.jsx` |
| Collections and documents; add, get, update, delete | `projects`, `users`, `invitations`, `direct_messages`, and sub-collections (`messages`, `notifications`, `typing`) | `src/store/`, `src/lib/` |
| Queries: `where`, `orderBy`, `limit` | `where('members', 'array-contains', uid)` and `where('inviteeEmail', '==', email)`; `orderBy` on chat and notifications; `orderBy` + `limit(5)` in the Live tab's chat feed | `store/listeners.js`, `components/Chat.jsx`, `lib/useLatestMessages.js` |
| Real-time listeners with `onSnapshot` | Every list in the app is a listener. They are stopped when a screen closes | `store/listeners.js`, `store/useFirebaseSync.js` |
| Chat with real-time messages | Project chat and one-to-one chat, with a typing indicator and unread counts | `components/Chat.jsx`, `MessagesView.jsx` |
| Live notifications | A `notifications` sub-collection per user, shown as toasts | `lib/notify.js`, `store/slices/notificationsSlice.js` |
| Collaborative todo list | The Kanban board: when one person drags a card, everyone sees it move | `pages/Dashboard.jsx`, `store/slices/boardSlice.js` |
| Real-time dashboard data | **New:** the Live tab | `components/LivePulse.jsx`, `lib/stats.js` |
| Storage: setup, upload images, download URLs, display, delete | **New:** profile photo and task images | `lib/storage.js`, `AvatarUploader.jsx`, `TaskAttachments.jsx`, `storage.rules` |
| Complete app: auth, profile in Firestore, CRUD, real-time, image upload, protected routes | FlowLane as a whole. The profile document is `users/{uid}`; routes are guarded by `components/RouteGuards.jsx` | |
| README with Firebase setup guide | This file | |

---

## What was added

### Image uploads (Cloud Storage)

```
Browser ──uploadBytesResumable──► Cloud Storage   avatars/{uid}/{id}-{name}
   │                                              projects/{projectId}/tasks/{taskId}/{id}-{name}
   └─ getDownloadURL ─► saved in Firebase Auth (photoURL) and Firestore (users/{uid}),
                        or as an entry on the task document (tasks.{taskId}.attachments)
```

- **Upload with progress.** `uploadFile` in `lib/storage.js` wraps `uploadBytesResumable` and reports 0 to 100.
- **Display.** The download URL is a long-lived `https` link, used as an `<img src>`. Only `http(s)` URLs are ever rendered, because anyone on a project can write the entry.
- **Delete.** Replacing or removing a photo deletes the old file. Removing an image deletes its file. Deleting a task or a project deletes its images (best effort: one file that cannot be deleted does not block the rest).
- **Limits.** PNG, JPEG, GIF or WebP only (SVG can carry scripts, so it is refused). Photos under 2 MB, task images under 5 MB, six per task. The browser checks first for a friendly message; `storage.rules` is the real protection.
- **Race-safe lists.** A task's images are changed with `arrayUnion` and `arrayRemove`, so two people attaching at the same moment cannot overwrite each other.
- **Live for everyone.** The Firestore listeners already keep the board current, so a teammate sees a new photo or image without reloading.

`storage.rules` in one table:

| Path | Read | Create / update | Delete |
|---|---|---|---|
| `avatars/{uid}/*` | any signed-in user | that user, image, under 2 MB | that user |
| `projects/{id}/tasks/{task}/*` | members of that project | the project's owner, image, under 5 MB | the project's owner |
| anything else | nobody | nobody | nobody |

The task rules read the project's Firestore document (`firestore.get`), so a file is reachable only by people on the project. They match who can edit the board in the UI: the owner.

### The Live tab

A fourth view next to Board and Activity. It shows task, done, in-progress, high-priority-not-done and image counts; tasks per column and per priority as bars; who has how many open and done tasks; every project the user belongs to; and the five newest chat messages. A line at the top says "Live" and how long ago the last update arrived.

It polls nothing. The numbers are computed (`lib/stats.js`, pure functions) from the board already in Redux, which a Firestore `onSnapshot` listener keeps current. When anyone changes the board, the snapshot arrives, the store changes and the numbers change; a change flashes briefly (not for people who prefer reduced motion). The "All your projects" table needs no extra listener: the projects listener already receives whole project documents. Bars carry a text alternative and never rely on colour alone.

---

## Tests

```bash
npm test               # unit and component tests (Firebase mocked)
npm run test:server    # the Day 15 Express API
npm run test:rules     # Firestore and Storage security rules, against the emulators (needs Java)
npm run test:e2e       # the real app in Chrome against the Auth, Firestore and Storage emulators
npm run test:all       # all of the above
```

| Layer | Count | New on Day 16 |
|---|---|---|
| Unit and component | 556 | storage helpers, profile photo flow, avatar uploader, task attachments (component and Redux thunks), stats, Live tab, latest-messages hook |
| Server | 110 | none |
| Security rules | 38 | 15: avatars (own folder, images only, 2 MB, who can read or delete), attachments (owner only, members read, outsiders and signed-out refused, 5 MB, unknown project), everything else closed |
| Browser (Chrome, emulators) | 134 | profile photo (upload, replace, remove, files checked in Storage itself, teammate sees it live), task images (add, reload, remove, delete task, read-only for members, live for members), Live tab (two users, counts change without reload, who has what, chat feed), axe WCAG 2.1 AA on every new screen in light and dark |

Every browser test fails on an unexpected console error or warning.

**Last full run (`npm run test:all`):** 556 unit, 110 server and 38 rules tests all passed; of 134 browser tests 132 passed and 2 failed. Both are flaky ones from earlier days, not Day 16 code: "the people search filters the list" passed 3 of 3 when rerun alone, and "the GitHub token is rejected, the dialog offers Reconnect" fails the same way when run several times in a row in the untouched Day 15 app (it passes when run once, and passed in the previous full run).

## Bugs the tests found

- **Removing a photo failed with "Something went wrong".** Firebase Auth rejects `updateProfile({ photoURL: null })` ("photoUrl must be a string"), although `null` is documented as the way to clear it. An empty string works, and the app treats it as "no photo".
- **A removed photo's file stayed in Storage, one run in six.** The file's path was read from the Firestore user document, and right after a page load a plain read can come from a half-empty local cache. Reading from the server fixed most runs; the lasting fix was to take the path from the photo's own URL, which already contains it (Firestore is only the fallback).
- **The two security-rules test files broke each other.** They share one Firestore emulator and each clears it, so they now run one after the other.
- **`.visually-hidden` was never defined** in the stylesheet (the Settings language legend used it). It is now, which the file inputs also need.
- The Day 12 test of the project tabs assumed two tabs; it now covers three.

## Limits

- **Real Firebase Storage was not exercised.** Every image feature ran against the Storage emulator, which applies the real rules but is not Google's service. The first deploy to a real project should be checked by hand: upload a photo, add a task image, remove both, and check that the files disappear from the Storage console.
- New projects may need the Blaze plan before Storage can be turned on (step 4).
- Deleting files is best effort. If a delete is refused or the connection drops, the file stays in Storage (an orphan). The app never shows a broken image, because the entry is removed first.
- Deleting a project removes the images of the project that is open (the one whose delete button you pressed); that is the only board whose tasks the browser holds.
- Only the project owner can add task images, the same people who can edit tasks.
- Images are uploaded as they are: no resizing or compression.
- The Live tab shows the open project's numbers live; the other projects' totals come from the project list and are as fresh as that listener.
- Only Chrome was tested, and no real phone.

## Day 15 features

GitHub sign-in and issue import, the JWT-verifying Express API, remember me, password reset, email verification, idle logout and the Security tab are unchanged. See `Day-15/flowlane-auth/README.md` for how they work and how to turn GitHub sign-in on.
