# PRD: FlowLane + Redux Toolkit (Day 11)

| Field     | Value                                                            |
| --------- | ---------------------------------------------------------------- |
| Owner     | Ronit Ahuja                                                      |
| Programme | Linkific internship, Month 1 (training phase), Day 11           |
| Date      | Thursday, 5 November 2026                                        |
| Repo path | `Linkific-Tasks/Day-11/flowlane-redux`                           |
| Builds on | FlowLane (GitLab `ahuja.ronit.0510/flowlane`, live at flow-lane.vercel.app), copied, original untouched |
| Status    | **Built.** Merged via PR #59.                                    |
| Companion | `flowlane-redux/README.md`                                       |

---

## 1. Summary

Day 11 teaches Redux and Redux Toolkit. The deliverable is my own project, **FlowLane** (a Kanban project manager on React and Firebase), moved onto a Redux store. Its state lived in one 1,287-line `Dashboard` component with 22 `useState` calls and nine Firestore listeners. The Redux version moves that state into 8 slices and all Firestore reads and writes into listeners and thunks. The UI and CSS are unchanged.

Related work in the same folder: `Day-11/redux-app` (Redux Market, a small shop with todos, login and a cart that covers the item FlowLane has no equivalent for).

## 2. Goals

| ID | Goal |
| -- | ---- |
| G1 | Understand Redux: store, actions, reducers, the three principles, unidirectional data flow |
| G2 | Decide what belongs in Redux and what stays local, and say why |
| G3 | Set up Redux Toolkit: `configureStore`, `createSlice`, `createAsyncThunk`, `Provider` |
| G4 | Build at least 3 slices that work together |
| G5 | Connect components with `useSelector` and `useDispatch` |
| G6 | Handle async work with thunks: loading, error handling, optimistic updates |
| G7 | Configure and use Redux DevTools |

## 3. Scope

**In scope (Core).** Auth, theme, projects, board (the todo part, with drag and drop), users, invitations, notifications and toasts, and UI state (modals, task panel, tabs).

**Out of scope.** Chat, Messages and Google Calendar sync stay as they are, reading Firebase directly. No new product features, no visual changes, no TypeScript, no RTK Query. A shopping cart does not exist in FlowLane, so it is covered by Redux Market.

## 4. Design

### 4.1 Mapping the Day 11 build list

| Day 11 task | FlowLane implementation |
| ----------- | ----------------------- |
| Todo app with Redux state | Kanban board in the `board` slice, with pure logic in `lib/board.js` |
| User authentication state | `auth` slice wrapping Firebase Auth (email, Google, sign-out), plain user fields only |
| Shopping cart with Redux | Not applicable here; see `Day-11/redux-app` |
| Fetch data and store in Redux | Firestore listeners dispatching into slices; thunks for theme, invites, project creation |
| Multiple slices working together | 8 slices; the Dashboard reads 7 of them; `ui` reacts to `board` actions |

### 4.2 Decisions

| Decision | Reason |
| -------- | ------ |
| Firestore reads go through listeners that dispatch actions; writes go through thunks | Components stop depending on Firebase, and the store can be tested with Firebase mocked |
| Optimistic updates with rollback keyed by `requestId` | Drag and drop stays instant, and a failed write cannot leave the board wrong |
| `condition` on thunks | Skip no-op drags and run the first-project creation once |
| Only plain fields of the Firebase user in the store; Timestamps become numbers | Redux state must be serializable |
| Form fields stay in local state | Only one component needs them |
| Kept the component props and markup | Chat, Messages, Calendar and the UI keep working unchanged |

## 5. Requirements

| ID | Requirement | Verified by |
| -- | ----------- | ----------- |
| R1 | `@reduxjs/toolkit` and `react-redux` installed; `Provider` wraps the app | `package.json`, `main.jsx` |
| R2 | At least 3 slices | 8 slices in `src/store/slices/` |
| R3 | `useSelector` and `useDispatch` in components | Dashboard, App, Auth, TaskPanel |
| R4 | Async thunks with loading, success and error handling | auth, projects, invitations, board thunks; unit tests |
| R5 | Optimistic update with rollback | `dragTask`, `createTask`, `deleteTask`, `saveTask`; tests |
| R6 | No component imports Firestore for in-scope state | grep: Firebase only in `src/store/`, `lib/` and the 3 out-of-scope components |
| R7 | Redux DevTools configured | `store/index.js`; README section 8 |
| R8 | Behaviour unchanged; UI changed only to fix defects found by testing (board scrolling, accessibility names, colour contrast) | 50 browser tests, README section 7 lists each change |
| R9 | README explains Redux concepts | `flowlane-redux/README.md` |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | FlowLane moved to Redux: store, slices, listeners, thunks, component refactor, tests, README | `day11/flowlane-redux` | #59 |

## 7. Verification

| Layer | Result |
| ----- | ------ |
| Build and lint | `npm run build` passes; `oxlint` has no errors (4 warnings in the out-of-scope Chat, Messages and Calendar components) |
| Unit tests (`npm test`) | 87 passing: board logic, every slice and thunk, listeners, serialization, running without keys; Firebase mocked |
| Security rules (`npm run test:rules`) | 23 passing against the Firestore emulator; they fail when a rule is weakened |
| Browser end to end (`npm run test:e2e`) | 50 passing in Chrome against the Auth and Firestore emulators with the real rules: auth, projects, board and drag and drop, three-user collaboration, chat and direct messages, accessibility. Every test fails on any console error, warning or browser Issue hint |
| Production bundle (`npm run test:e2e:prod`) | The same 50 pass against the built app, in two consecutive runs |
| Accessibility | axe-core WCAG 2.1 A and AA: zero violations on every screen in light and dark |
| Production Firebase | Rules deployed and the release matches the repo file; an anonymous request gets a 403 |

The browser tests found 9 real defects that the unit tests could not (listed in the README, section 7): two listener races, the empty app after deleting the last project, the wiped task form, nested scrolling in drag and drop, and several accessibility problems.

**Not covered:** Google sign-in end to end and a linked Google Calendar (need real Google), browsers other than Chrome, phone-sized screens, and a manual run against the real Firebase project with real data.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Not verified by a real sign-in or real Google | Emulator-based browser tests with the real rules, plus a short manual pass listed in the README |
| Firestore rules too open or too strict | Least-privilege rules with an emulator test per operation the app performs; known self-join trade-off documented |
| Listener leaks or double subscriptions | Each listener returns an unsubscribe; hooks start and stop them; tests check cleanup |
| Rollback restoring the wrong state | One snapshot per request id; overlapping-failure test |
| Non-serializable data in the store | Plain-user conversion and `toPlain`; tests |
| Chat and Messages still talk to Firebase directly | Documented limit; out of scope for Day 11 |

## 9. Deliverables

- React app with Redux Toolkit (`Day-11/flowlane-redux`)
- 8 Redux slices
- `useSelector` and `useDispatch` examples across the app
- Async thunks for Firebase writes and reads, including optimistic updates with rollback
- Redux DevTools configured
- Global state management working across the Dashboard, task panel, notifications and invitations
- README explaining Redux concepts
