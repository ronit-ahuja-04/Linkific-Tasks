# FlowLane + Redux Toolkit

**Day 11 Project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, Vite, Firebase (Auth, Firestore), `@hello-pangea/dnd`, **Redux Toolkit 2**, **react-redux 9**, Vitest
**PRD:** [Day11_PRD.md](../Day11_PRD.md) (the product's own PRD is [prd.md](./prd.md))
**Starting point:** [FlowLane](https://flow-lane.vercel.app/), my Kanban project manager (GitLab: `ahuja.ronit.0510/flowlane`). This folder is a copy. The original repo and the live site are untouched.

FlowLane keeps all its state in one huge `Dashboard` component. This version moves the shared state into a Redux store, and moves every Firestore read and write out of the components.

## Run
```bash
cd Day-11/flowlane-redux
npm install
cp .env.example .env    # then fill in your Firebase web app keys
npm run dev
npm test                # 87 unit tests, Firebase is mocked, no keys needed
npm run test:rules      # 23 security-rules tests (Firestore emulator, needs Java)
npm run test:e2e        # 50 browser tests: Chrome + Auth/Firestore emulators (see section 9)
npm run test:e2e:prod   # the same 50 tests against the production bundle
npm run test:all        # unit + rules + e2e
npm run build
```
Without `.env` the app still loads and shows the sign-in page, but sign-in is refused with the message "Firebase keys are required". Vite reads `.env` only at startup, so restart `npm run dev` after creating or editing it. The values are in the Firebase console (Project settings, your web app) and in your Vercel project's environment variables.

## 1. What changed

| Before | After |
| --- | --- |
| `Dashboard.jsx`: 1,287 lines, 22 `useState` calls, 9 Firestore `onSnapshot` effects, all writes inline | 836 lines, 3 `useState` calls (form fields only). State is read with `useSelector`, changed with `dispatch` |
| `App.jsx` keeps `user` in state and writes the profile document | `auth` slice, and a listener in `src/store/listeners.js` |
| `auth.currentUser` read directly in many places | `useSelector(selectUser)`, plain fields only |
| Drag and drop: `setData` then `updateDoc`, no rollback | Optimistic `dragTask` thunk with rollback if the write fails |
| Components import `firebase/firestore` | Only `src/store/` does (plus Chat, Messages and Calendar, see section 9) |
| No tests | 87 unit tests, 23 rules tests, 50 browser tests |

## 2. The store

Eight slices combined with `combineReducers`:

| Slice | State | Filled by | Notable actions and thunks |
| --- | --- | --- | --- |
| `auth` | `user`, `status`, `busy`, `error` | Firebase auth listener | `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOutUser` |
| `theme` | `mode` | user action, saved profile | `toggleTheme`, `loadUserTheme` |
| `users` | `byId` | Firestore listener | `usersReceived` |
| `projects` | `items`, `status` | Firestore listener | `createProject`, `ensureDefaultProject`, `deleteProject` |
| `board` | `tasks`, `columns`, `columnOrder`, `snapshots` | Firestore listener, drag and drop | `dragTask`, `createTask`, `deleteTask`, `saveTask`, `assignTaskUsers` |
| `invitations` | `items` | Firestore listener | `sendInvite`, `acceptInvite`, `declineInvite` |
| `notifications` | `items`, `toasts`, `unreadMessages` | Firestore listener | `dismissNotification`, `dismissAllNotifications`, `clearUnreadMessages`, `notifyProjectMembers` |
| `ui` | active tab, modals, messages, task panel | user actions | `tabChanged`, `modalOpened`, `taskPanelOpened`, ... |

```
src/store/
  index.js            configureStore + combineReducers + DevTools
  listeners.js        Firestore / Firebase Auth -> dispatch (reads)
  useFirebaseSync.js  hooks that start and stop the listeners
  slices/*.js         the eight slices and their thunks (writes)
src/lib/
  board.js            pure drag-and-drop logic (tested on its own)
  serialize.js        Firestore Timestamp -> number, error helpers
  notify.js           notification document writes
```

## 3. Day 11 requirements, where to look

| Day 11 task | In FlowLane |
| --- | --- |
| Todo app with Redux state | The Kanban board: `board` slice, `lib/board.js`, `pages/Dashboard.jsx` |
| User authentication state | `auth` slice, `pages/Auth.jsx`, `App.jsx` route guard |
| Shopping cart | Not applicable to this app. The cart lives in the Redux Market app (`Day-11/redux-app`) |
| Fetch data and store in Redux | `listeners.js` (live Firestore snapshots into slices), `loadUserTheme`, invite lookups |
| Multiple slices working together | The Dashboard reads 7 slices. `ui` reacts to `board` actions, `board` thunks read `auth` and `projects` |
| `configureStore`, `createSlice`, `createAsyncThunk` | `store/index.js`, `slices/*.js`, thunks in 6 slices |
| `useSelector` / `useDispatch` | `Dashboard.jsx`, `App.jsx`, `Auth.jsx`, `TaskPanel.jsx` |
| Loading, pending, rejected, error handling | Auth thunks, `sendInvite`, `createProject`, optimistic rollbacks |
| DevTools | Configured in `store/index.js`, steps in section 8 |

## 4. Redux concepts

**What is Redux and why use it here.** FlowLane's Dashboard shared a board, projects, users, invitations, notifications, modals and a task panel through one component's local state. Nothing else could reach it, and every change was tangled up with Firestore calls. A store gives one place to read it from and one way to change it.

**Unidirectional data flow**
```
UI event --dispatch--> action --> reducer --> new state --> useSelector --> UI re-renders
                         |
                     (thunk: async work, then dispatches more actions)
Firestore snapshot --dispatch--> action --> reducer ...
```
A drag does not edit the board. It dispatches `board/dragTask/pending` with the move, the reducer returns the new board, and the columns re-render.

**The three principles**
1. **Single source of truth:** one store with `state.auth`, `state.board`, `state.projects` and the rest.
2. **State is read-only:** change it only by dispatching actions. Even Firestore snapshots are dispatched as actions.
3. **Changes use pure functions:** reducers take the old state and an action and return the new state. The drag logic is a plain function in `lib/board.js` with no Redux or Firebase in it, so the reducer reuses it and tests cover it directly.

**What is in Redux and what stays local**

| In Redux | Local state |
| --- | --- |
| Signed-in user, theme | The new-project name and owner-email form fields |
| Projects, board, users, invitations | The invite email field |
| Notifications, toasts, unread count | Sign-in form fields and the sign-in/sign-up toggle |
| Which modals are open, the task panel | The task panel's title and description while editing |

**Redux vs Context API.** Context fits values that rarely change. When a context value changes, every component that reads it re-renders. Redux lets each component subscribe to just the piece it needs (`useSelector`), gives a standard way to change state, supports async logic through thunks, and has DevTools. FlowLane has live data from several Firestore listeners, optimistic writes and cross-cutting UI state, which is where Redux pays off.

## 5. Redux Toolkit pieces used

| API | Where | Why |
| --- | --- | --- |
| `configureStore` | `store/index.js` | Store, thunk middleware, serializability warnings, DevTools |
| `createSlice` | every slice | Reducers and generated action creators |
| `createAsyncThunk` | 6 slices | Pending, fulfilled, rejected actions for async work |
| `createSelector` | `projectsSlice`, `boardSlice` | Memoized derived data (`selectBoard`, `makeSelectProject`) |
| `extraReducers` | `auth`, `board`, `ui`, `projects` | Respond to thunk lifecycle actions and other slices' actions |
| `prepare` callback | `authStateChanged` | Turn a Firebase user into plain data before it reaches the reducer |
| `rejectWithValue` | auth, projects, invitations | A readable message as the error |
| `condition` option | `dragTask`, `deleteTask`, `ensureDefaultProject` | Skip a thunk that has nothing to do or already ran |
| `current` | `boardSlice` | Read the plain state inside a reducer |

## 6. Async operations

**Pending, fulfilled, rejected.** Sign-in is the simplest example: `pending` sets `busy: true` and clears the error, `fulfilled` sets `busy: false`, `rejected` stores the message (`rejectWithValue`) so the form can show it. In components, `await dispatch(thunk(arg)).unwrap()` turns a rejection into a thrown value, so `try/catch` decides whether to navigate or show a modal.

**Optimistic updates with rollback** (`boardSlice.js`). Drag a card and it moves at once: the `pending` case applies the move and saves the old board under `snapshots[requestId]`. If the Firestore write fails, `rejected` restores that snapshot and sets an error that the Dashboard shows in a modal. Each request has its own snapshot, so two overlapping drags cannot restore the wrong state. The same pattern covers creating, deleting and saving tasks.

**`condition`.** A drop in the same place, a drop outside a column, or moving a task out of Done changes nothing, so `dragTask` is skipped: no actions, no write. `ensureDefaultProject` uses it to create "My First Project" only once.

**Firestore listeners.** `onSnapshot` is not a one-shot request, so `listeners.js` dispatches into the store each time data arrives and returns an unsubscribe function. `useUserSync` and `useProjectSync` start them in effects and stop them on logout or when another project opens.

**Serializable state.** Firebase's user object and Firestore Timestamps are class instances. The reducer for `authStateChanged` keeps four plain fields, and `toPlain` turns Timestamps into numbers before anything is dispatched.

## 7. Bugs found and fixed

Found while moving the code, or by the browser tests (marked **E2E**):

| Bug | Fix |
| --- | --- |
| `Dashboard.jsx` called `serverTimestamp()` without importing it, so every notification write failed | Imported in the notification helper; a test checks the written document |
| `Auth.jsx` used `GoogleAuthProvider` without importing it, so Google sign-in threw after the popup | The thunk imports it; a test covers saving the OAuth token |
| Without Firebase keys the app crashed with `auth/invalid-api-key` before showing anything | Firebase is only initialised when keys exist; the sign-in page loads and explains what is missing |
| **E2E** Creating the first project opened a board listener before the server had the project, so Firestore answered `permission-denied` | A project is published to the UI only after the server confirms it, and stays published while later edits are pending |
| **E2E** Deleting a project (or opening an unknown project URL) opened a listener the server refuses | Listeners start only for projects the user belongs to; `permission-denied` on a project listener drops that project quietly |
| **E2E** Deleting your last project left the app empty, because the "create the first project" guard never reset | The guard is released once a project exists, and re-armed after a failed attempt |
| **E2E** Typing a title, then changing assignees, wiped the title and description | The task panel resets its form only when it opens or a different task is shown |
| The first project could be created twice by repeated Firestore snapshots, and by an empty snapshot from the cache | Thunk `condition` plus ignoring cache-only snapshots |
| Deleting a task made two separate writes | One write |
| **E2E** The drag-and-drop library warned about nested scroll containers (each column scrolled inside a scrolling board), and its auto-scroll could misbehave | The board is the only scroll container, columns stretch to the same height so each stays a drop target, and column headers stay pinned while scrolling |
| **E2E** Browser Issues hints: inputs without `autocomplete`, `id` or a label | Labels, ids, names and `autocomplete` added to the sign-in form |
| **E2E** Icon buttons with no accessible name (close, send), an unnamed priority select, the avatar as a plain div, a task card that was a "button" containing buttons | `aria-label`s, a real profile button, `role="dialog"` on modals, the card is a labelled group |
| **E2E** Low colour contrast (WCAG AA): grey helper text, orange text and white-on-orange buttons, red text, amber and green priority labels | Four small colour tokens (deeper orange and red, darker grey, in both themes) used only where text meets them |

**What changed visually, for transparency:** the board scrolls as one area with pinned column headers instead of each column scrolling on its own; the brand orange under white text and the red used as text are a shade deeper; helper text is slightly darker. Nothing else about the design was touched.

## 8. Redux DevTools

Configured in `src/store/index.js` (on outside production, named "FlowLane"). Install the **Redux DevTools** extension, run the app, open the **Redux** tab and try:
- **Inspect:** sign in and watch `auth/authStateChanged`, then the listener actions fill `projects`, `users` and `board`.
- **Diff:** drag a card and open the Diff tab on `board/dragTask/pending`.
- **Time travel:** drag the slider back through the actions and watch the board move back.
- **Failure path:** go offline in the browser's Network tab and drag a card. You will see `dragTask/pending`, then `dragTask/rejected`, and the card jumps back.

## 9. Tests

Four layers, from fastest to most realistic:

| Layer | Command | What it covers |
| --- | --- | --- |
| **Unit** (87) | `npm test` | Pure board logic, every slice and thunk (optimistic updates, rollback, overlapping requests, `condition`), the Firestore listeners, serialization, running without keys. Firebase is mocked, so no keys or network |
| **Security rules** (23) | `npm run test:rules` | Allowed operations and attacks against the Firestore emulator. They fail when a rule is weakened |
| **Browser end to end** (50) | `npm run test:e2e` | The real app in Chrome against the Auth and Firestore **emulators** with the real rules. Never touches your project: the emulator mode only works with a `demo-*` project id |
| **Accessibility** (3, part of the 50) | same | WCAG 2.1 A and AA with axe-core on every screen, light and dark, with zero violations required |

The browser tests (`e2e/`) cover:
- **Auth:** sign up, sign in, sign out, wrong password, duplicate email, weak password, session after reload, route protection.
- **Projects:** create (with and without an owner email), validation, switch, delete (cancel and confirm), deleting the last project, unknown URLs, settings, profile, theme persistence, calendar prompt.
- **Board:** create, edit, delete, priorities, cancel flows, drag by keyboard between and within columns, the Done column lock, persistence after reload, draft form kept while assigning.
- **Collaboration with two or three browsers at once:** invite, accept, decline, unknown and duplicate invites, live task and move sync, owner-only controls, assignment notifications, notifications page, project deletion seen by a member, assigning another owner.
- **Chat:** project chat live, the new-activity dot, direct messages, the unread badge, people search.

Every test also **fails on any console error, warning or browser "Issue" hint**, which is how most of the bugs above were found. The only exceptions, each commented in `e2e/fixtures.js`, are the browser's own log line for an expected rejected sign-in, the Firestore SDK retrying its write channel, and the Google popup script that the tests deliberately stub.

`npm run test:e2e:prod` builds the production bundle and runs the same suite against it. Both modes pass.

## 10. Firestore security rules

The Firebase project was still on the default "test mode" rules, which **expire after 30 days**. They expired on 16 Oct 2026, so every read and write failed with `Missing or insufficient permissions` (the live site too). `firestore.rules` replaces them with rules written for how FlowLane uses its data:

| Data | Rule in short |
| --- | --- |
| `users/{uid}` | Any signed-in user can read profiles. You write only your own. Others may only bump your `unreadMessages` counter (a direct message) |
| `users/{uid}/notifications` | You read and dismiss your own. Other signed-in users can create one for you |
| `projects/{id}` | Members read and edit the board. Only the owner changes the member list or deletes. An invited user may add only themselves |
| `projects/{id}/messages`, `typing` | Members only; you post as yourself |
| `invitations` | The invitee reads and answers their own; only project members can invite |
| `direct_messages/{a_b}/...` | Only the two people in the chat id, posting as themselves |
| everything else | Denied |

`npm run test:rules` runs 23 tests against the Firestore emulator (needs Java). They check what the app does and what an attacker must not be able to do, and I confirmed they fail when a rule is weakened. Deploy with `firebase deploy --only firestore:rules --project <your-project-id>`.

Known trade-off: an invitation is not verified when someone adds themselves to a project, so anyone who knows a project's id could join. Project ids are random 20-character strings, so this is hard to guess, but a stricter version would need the invitation id to be derived from the project and user ids.

## 11. Limits and honest notes

- **Chat, Messages and Calendar sync** still read and write Firebase directly. They were left out on purpose (see the PRD scope). They still receive a `notifyProjectMembers` prop from the Dashboard.
- **Not covered by the automated tests:** Google sign-in end to end (the popup needs real Google, so only the token handling is unit-tested), Google Calendar sync with a linked account, browsers other than Chrome, phone-sized screens (the app targets desktop and tablet), and a run against your real Firebase project. Please do a short manual pass there: sign in, drag a card, create and delete a task, invite someone, and watch the Redux DevTools.
- **Lint:** `npm run lint` has no errors and 4 warnings, all in Chat, Messages and Calendar (hook dependency lists and a setState in an effect). Those components were left as they were; changing them risks chat behaviour.
