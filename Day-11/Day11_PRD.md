# PRD: HackHQ Redux, global state with Redux Toolkit (Day 11)

| Field     | Value                                                     |
| --------- | --------------------------------------------------------- |
| Owner     | Ronit Ahuja                                               |
| Programme | Linkific internship, Month 1 (training phase), Day 11     |
| Date      | Thursday, 5 November 2026                                 |
| Repo path | `Linkific-Tasks/Day-11/hackhq-redux`                      |
| Builds on | Day 10 `hackhq-styled`                                    |
| Status    | **Shipped.** Merged via PR #52.                    |
| Companion | `hackhq-redux/README.md`                                  |

---

## 1. Summary

Days 7 to 10 changed how HackHQ is routed and styled. Day 11 changes where its state lives. The shared state that `App.jsx` kept in `useState` and `useLocalStorage` and passed down as props moves into one Redux Toolkit store, read with `useSelector` and changed with `useDispatch`. The directory's API calls move from the `useFetch` hook to `createAsyncThunk`. No new product features. The Day 10 folder stays untouched; Day 11 starts as a copy in a new folder.

## 2. Goals

| ID | Goal |
| -- | ---- |
| G1 | Understand Redux: store, actions, reducers, the three principles, unidirectional data flow |
| G2 | Decide what belongs in Redux and what stays in local state, and say why |
| G3 | Set up Redux Toolkit: `configureStore`, `createSlice`, `createAsyncThunk`, `Provider` |
| G4 | Build at least 3 slices working together |
| G5 | Connect components with `useSelector` and `useDispatch` |
| G6 | Handle an API call with an async thunk, including pending, fulfilled and rejected states |
| G7 | Configure and use Redux DevTools |

## 3. Non-goals

- The migration itself adds no features and no visual changes (Day 10 styling stays). The one exception is the wishlist in 4.5, added afterwards.
- No RTK Query, no `redux-persist`, no extra middleware libraries.
- No TypeScript.
- `src/lib/` pure logic is reused as it is. Reducers call it.

## 4. Design

### 4.1 Mapping of the Day 10 deliverables list to HackHQ

| Task from the Day 11 list | HackHQ implementation |
| ------------------------- | --------------------- |
| Todo app with Redux state | `tasks` slice, checklist station (add, toggle, edit, reorder, undo delete) |
| User authentication state | `auth` slice (organizer login and logout, protects `/organizer`) |
| Shopping cart with Redux | `cart` slice, swag station and product page |
| Fetch data and store in Redux | `users` slice with `fetchUsers` and `fetchUserPosts` thunks |
| Multiple slices working together | 11 slices combined with `combineReducers` |

### 4.2 Slices

`theme`, `auth`, `cart`, `tasks`, `announcements`, `schedule`, `laps`, `toasts`, `ui`, `users`, `wishlist`. Each lives in `src/store/slices/` with its actions and selectors. State shape and persisted keys are in the README.

### 4.3 What stays local

Search text, filter tabs, coupon input, edit-in-place text, modal open flags and form values while typing stay in `useState`, because only one component uses them.

### 4.4 Decisions

| Decision | Reason |
| -------- | ------ |
| Keep the old localStorage keys | Existing browser data keeps working after the move |
| One `persist.js` subscribes to the store | Replaces the per-hook storage effects with a single place |
| `prepare` callbacks for ids and timestamps | Keeps reducers pure |
| Toast handlers parked in `toastActions.js` | Functions are not serializable and must not be in the store |
| Abort stale requests with the thunk `signal` | Same guarantee `useFetch` gave through `AbortController` |
| `src/hooks/useFetch.js` kept in the repo | It is still a valid reference for the Day 6 pattern |

### 4.5 New feature: swag wishlist

One small feature added on top of the migration, to show a new slice joining the existing ones.

| Part | Behaviour |
| ---- | --------- |
| Heart button | On each swag card and the product page. Toggles the product in the wishlist and shows a toast |
| `/wishlist` page | Saved products with total price, remove, move to cart, move all to cart, clear, and an empty state |
| Nav badge | Saved count next to "Wishlist" in the sidebar and drawer |
| Cart rules | Moving to the cart respects the 10-per-item limit; an item that cannot be added stays saved and the user is told |
| Persistence | `hackhq_wishlist` in localStorage |

Design notes: the slice stores only product ids and resolves products from the catalog with a memoized selector, so a stale id is ignored. `moveToCart` is a thunk that coordinates the wishlist, cart and toast slices in one place.

## 5. Requirements

| ID | Requirement | Verified by |
| -- | ----------- | ----------- |
| R1 | `@reduxjs/toolkit` and `react-redux` installed, `Provider` wraps the app | `package.json`, `main.jsx` |
| R2 | At least 3 slices created with `createSlice` | `src/store/slices/` (11) |
| R3 | `useSelector` and `useDispatch` used in components | checklist, swag, directory, toasts, announcements, schedule, clock |
| R4 | An async thunk for an API call with loading, success and error states | `usersSlice.js`, unit tests |
| R5 | Redux DevTools configured | `configureStore` options, README section 7 |
| R6 | Global state works across routes and survives a reload | persistence tests, manual check |
| R7 | All earlier behaviour unchanged | 134 earlier tests, server render of every route |
| R8 | New store logic has unit tests | `test/store.test.js`, `test/persist.test.js` |
| R9 | README explains Redux concepts | `hackhq-redux/README.md` |
| R10 | Wishlist: heart toggle, `/wishlist` page, move to cart respecting the cart limit, nav badge, persistence | `test/wishlist.test.js`, `test/persist.test.js`, render check |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | Store, slices, async thunks, persistence, component migration, tests, README | `day11/redux-toolkit` | #52 |
| M2 | Feature: swag wishlist | `day11/wishlist` | #54 (this change) |

## 7. Verification

- `npm run build`, `npx eslint .` (0 errors) and `npm test` (168 passing: 134 earlier plus 34 for the store, persistence and wishlist).
- Server-side render of every route against the real store without errors, plus `/wishlist` rendered empty and with saved items, and the hearts on `/swag` and the product page. This caught a leftover `laps` reference in `App.jsx`, which was fixed.
- **Not done:** a manual browser pass with the Redux DevTools extension (inspect, diff, time travel, replay), and clicking through the flows (wishlist heart and move to cart, add to cart, complete tasks, organizer login, directory search, undo toast, reload persistence).

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Behaviour drift while moving state | Reuse the same pure `src/lib` functions; keep the 134 earlier tests green |
| Over-using Redux for local UI state | Written rule in the README on what stays local |
| Non-serializable values in the store | Toast handlers kept in a registry; RTK's serializability check stays on |
| Race between rapid directory searches | Abort the previous thunk in the effect cleanup; aborted requests are not errors |
| Hand-moved persistence loses user data | Same keys and shapes as before; tests load old-format data |

## 9. Deliverables

- React app with Redux Toolkit (`Day-11/hackhq-redux`)
- 11 Redux slices
- `useSelector` and `useDispatch` examples across the app
- Async thunk for an API call
- Redux DevTools configured
- Global state working across routes with persistence
- README explaining Redux concepts
