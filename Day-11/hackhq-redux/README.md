# HackHQ Redux: global state with Redux Toolkit

**Day 11 Project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, React Router 7, Vite 8, styled-components 6, **Redux Toolkit 2** and **react-redux 9**, Vitest 4
**PRD:** [Day11_PRD.md](../Day11_PRD.md)
**Starting point:** the Day 10 app (`Day-10/hackhq-styled`). The state that used to live in `App.jsx` (`useState`, `useLocalStorage`, props passed down several levels) now lives in one Redux store. Features and styling are unchanged.

## Run

```bash
cd Day-11/hackhq-redux
npm install
npm run dev     # http://localhost:5173
npm test        # 193 unit tests, 59 of them for the store, persistence and the features
npm run build
```

Install the **Redux DevTools** browser extension, open the app, then open the "Redux" tab in DevTools. See section 7.

## 1. What changed

| Before (Day 10)                                                       | After (Day 11)                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `useState` and `useLocalStorage` in `App.jsx`, passed down as props   | 14 Redux Toolkit slices in `src/store/slices/`                       |
| `cart`/`setCart`, `laps`/`onAddLap`, `savedIds`/`onToggleSaved` props | `useSelector` and `useDispatch` inside the components that need them |
| `useFetch` hook for the directory and posts                           | `createAsyncThunk` with `pending`, `fulfilled`, `rejected` handling  |
| Toasts array in `App.jsx` with `setTimeout`                           | `toasts` slice plus a `notify` thunk                                 |
| Each hook wrote its own localStorage key                              | One `persist.js` subscribes to the store and writes the same keys    |
| Pure logic in `src/lib/`                                              | Unchanged. Reducers call those same functions                        |

## 2. Redux concepts

**What is Redux and why use it.** One store holds the app's shared state. Components read from it and send it actions. Everything that changes state goes through the same small set of reducers, so the state is predictable and easy to inspect.

**Unidirectional data flow.**

```
UI event --dispatch--> action --> reducer --> new state in store --> useSelector --> UI re-renders
```

Components never change state directly. They dispatch an action such as `addItem('p1')`, a reducer computes the next state, and subscribed components re-render.

**Three principles.**

1. **Single source of truth:** the whole app state is one object tree in one store (`state.cart.items`, `state.tasks.items`, ...).
2. **State is read-only:** the only way to change it is to dispatch an action.
3. **Changes are made by pure functions:** reducers take the old state and an action and return the new state, with no side effects.

**Store, actions, reducers.** The store holds state. An action is a plain object `{ type: 'cart/addItem', payload: 'p1' }`. A reducer is `(state, action) => newState`.

**Local state vs Redux.** I kept some state local on purpose:

| In Redux                                                        | Local `useState`                           |
| --------------------------------------------------------------- | ------------------------------------------ |
| Cart (used on `/swag`, `/swag/:id`)                             | Search box text, filter tabs, coupon input |
| Tasks, theme, auth, announcements, saved sessions, laps, toasts | Edit-in-place text, modal open flags       |
| Directory data from the API                                     | Form field values while typing             |

Rule used: put it in Redux when several distant components need it, when it must persist, or when I want to inspect it in DevTools. Keep it local when only one component cares.

**Redux vs Context API.** Context passes a value down the tree and is good for rarely changing values (a theme). Every consumer re-renders when the context value changes. Redux adds `useSelector` (a component re-renders only when its selected value changes), a standard way to change state, middleware (thunks), and DevTools with time travel. The cost is more setup. This app has a dozen kinds of shared state with async calls, so Redux earns its place; the `ThemeProvider` from Day 10 is still Context.

## 3. Redux Toolkit basics

| API                | Where                                                | What it does                                                                 |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `configureStore`   | `src/store/index.js`                                 | Builds the store, adds thunk middleware, serializability checks and DevTools |
| `createSlice`      | `src/store/slices/*.js`                              | Declares the name, initial state and reducers; generates the action creators |
| `createAsyncThunk` | `src/store/slices/usersSlice.js`                     | Wraps an async call and dispatches `pending`, `fulfilled`, `rejected`        |
| `combineReducers`  | `src/store/index.js`                                 | Combines the slices into one state tree                                      |
| `createSelector`   | `cartSlice`, `tasksSlice`, `announcementsSlice`      | Memoized derived data (cart total, task progress, unread count)              |
| `prepare` callback | `tasksSlice.addTask`, `announcementsSlice.postAdded` | Keeps impure work (ids, `Date.now()`) out of the reducer                     |

Redux Toolkit uses Immer, so reducers can be written as `state.items.push(x)` and it produces a new immutable state behind the scenes.

## 4. The slices

| Slice           | State                    | Notable actions                                                                                | Persisted key                      |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| `theme`         | `{ mode }`               | `toggleTheme`, `setTheme`                                                                      | `hackhq_theme`                     |
| `auth`          | `{ isOrganizer }`        | `login`, `logout`                                                                              | `hackhq_organizer`                 |
| `cart`          | `{ items }`              | `addItem`, `changeQuantity`, `removeItem`, `clearCart`                                         | `hackhq_cart`                      |
| `tasks`         | `{ items }`              | `addTask`, `toggleTask`, `removeTask`, `restoreTask`, `editTask`, `moveTask`, `clearCompleted` | `hackhq_tasks`                     |
| `announcements` | `{ changes, seenAt }`    | `postAdded`, `postEdited`, `postRemoved`, `markSeen`                                           | `hackhq_announcements`, `..._seen` |
| `schedule`      | `{ savedIds }`           | `sessionToggled`                                                                               | `hackhq_schedule_saved`            |
| `laps`          | `{ items }`              | `lapAdded`, `lapsCleared`                                                                      | `hackhq_laps`                      |
| `toasts`        | `{ items }`              | `toastAdded`, `toastDismissed`, thunk `notify`                                                 | not persisted                      |
| `ui`            | `{ xrayOn }`             | `toggleXray`                                                                                   | not persisted                      |
| `users`         | `{ list, posts }`        | thunks `fetchUsers`, `fetchUserPosts`                                                          | not persisted                      |
| `notifications` | `{ items }`              | `notificationAdded`, `notificationRead`, `allNotificationsRead`, `notificationsCleared`        | `hackhq_notifications`             |
| `badges`        | `{ earned }`             | `badgeEarned`, `badgesReset` (awarded by listener middleware)                                  | `hackhq_badges`                    |
| `activity`      | `{ items }`              | `activityLogged`, `activityCleared` (written by a custom middleware)                           | not persisted                      |
| `history`       | `{ tasks, cart }` stacks | `undo`, `redo`, `historyCleared` (handled by `withHistory`)                                    | not persisted                      |
| `wishlist`      | `{ ids }`                | `wishlistToggled`, `wishlistRemoved`, `wishlistCleared`, thunks `moveToCart`, `moveAllToCart`  | `hackhq_wishlist`                  |

## 5. Connecting Redux to React

```jsx
// src/main.jsx: Provider puts the store in React context
<Provider store={store}>
  <App />
</Provider>;

// any component: read with useSelector, write with useDispatch
const items = useSelector(selectCartItems);
const dispatch = useDispatch();
<Button onClick={() => dispatch(addItem(product.id))}>Add to cart</Button>;
```

Examples to read: `ChecklistStation.jsx` (tasks, progress, undo), `SwagStation.jsx` and `ProductDetail.jsx` (cart), `Directory.jsx` (async thunk), `ToastContainer.jsx`, `Announcements.jsx`, `Schedule.jsx`, `HackClock.jsx`.

## 6. Async operations with `createAsyncThunk`

`fetchUsers` in `usersSlice.js` replaces the old `useFetch` hook:

```js
export const fetchUsers = createAsyncThunk('users/fetchList', async (params, { signal }) =>
  getJson(buildUsersUrl(params), signal)
);
```

The slice reacts in `extraReducers`:

- `pending` sets `status: 'loading'`
- `fulfilled` stores the users and total, `status: 'succeeded'`
- `rejected` stores the error message, `status: 'failed'`. An aborted request (the user kept typing) is ignored, not shown as an error.

The Directory dispatches the thunk when the debounced search changes and aborts the previous request in the effect cleanup. Posts for a participant work the same way with `fetchUserPosts`, stored per user id. The unit tests cover loading, success, HTTP failure and abort.

One more pattern: toasts need an "Undo" button, but functions must not be stored in Redux. The store keeps only the label, and the click handler lives in `src/store/toastActions.js` keyed by toast id.

## 6b. New feature: swag wishlist

Added after the core migration to show a new slice joining the others.

- **Heart button** on every product card in the swag shop and on the product page (`WishlistButton.jsx`, `aria-pressed`). A toast confirms each save or removal.
- **`/wishlist` page** with the saved products, their total price, remove, **Move to cart**, **Move all to cart** and **Clear**. Items already at the 10-per-item cart limit stay saved and the button explains why.
- **Nav badge** with the saved count, read from the store in `AppLayout`.
- **Persistence** under `hackhq_wishlist`, like the other slices.
- **Where the Redux ideas show up:**
  - a new slice (`wishlistSlice.js`) whose pure logic lives in `src/lib/wishlist.js`
  - memoized selectors for derived data (`selectWishlistProducts`, `selectWishlistTotal`)
  - a selector factory so only one heart re-renders when its product changes
  - thunks that coordinate two slices: `moveToCart` reads the cart with `getState`, dispatches `addItem`, then `wishlistRemoved` and a toast, and keeps the item saved when the cart refuses it
- **Tests:** `test/wishlist.test.js`, 12 tests for the pure logic, the slice and both thunks.

## 6c. Notifications centre, undo/redo, badges and activity feed

Three more features, each chosen to show a different Redux pattern.

**Notifications centre** (bell in the header)

- Every toast is also written to a persistent history: the `notify` thunk dispatches `notificationAdded` next to `toastAdded`. Toasts vanish after a few seconds, notifications stay.
- The bell shows an unread count (a memoized selector), a panel with newest first, mark one or all as read, and clear all. It closes on Escape or an outside click. History is capped at 50 and persisted under `hackhq_notifications`.

**Undo / redo** (checklist and cart)

- `src/store/undoable.js` is a higher-order reducer: `withHistory(rootReducer, ['tasks', 'cart'])`. For each tracked slice it keeps `past` and `future` stacks in `state.history`. Any action that changes a tracked slice pushes the previous state onto `past` and clears `future`; `undo('tasks')` and `redo('tasks')` swap the slice back.
- The slices and selectors are untouched, and persistence just saves whatever the slice becomes. History is capped at 50 and is not persisted.
- This works because reducers are pure and state is immutable: an old state is just an old object. It is also what DevTools time travel does, scoped to two slices.
- Bug found by a test: with a partial saved state, the init action recorded a phantom history entry, so one undo could have wiped the cart. It is guarded and covered by a test.

**Badges (listener middleware)**

- `src/lib/badges.js` defines 8 badges as pure `check(state)` functions. `createListenerMiddleware` in `src/store/middleware.js` runs them after every state change and, for each newly met condition, dispatches `badgeEarned` and a `notify` toast, which also lands in the bell. `badgeEarned` is excluded from the trigger, so there is no loop.
- No component awards a badge: the rules react to state from outside the reducers and the UI.

**Activity feed (custom middleware)**

- `activityLogger` has the `(store) => (next) => (action)` shape: it lets the action through, then dispatches `activityLogged` with the action type and a short payload preview. Bookkeeping slices are skipped so it never logs itself. The `/activity` page shows the badge grid and the live feed, the same stream you see in the Redux DevTools action list.

**Tests:** `test/history.test.js` (10), `test/notifications.test.js` (4), `test/badges.test.js` (9) and one more persistence test.

## 7. Redux DevTools

Configured in `src/store/index.js` (`devTools` is on in development, named "HackHQ", with action traces).

1. Install the **Redux DevTools** extension for Chrome, Edge or Firefox.
2. Run `npm run dev`, open DevTools, choose the **Redux** tab.
3. Try these:
   - **Inspect:** add a swag item and watch `cart/addItem` appear, with the state tree on the right.
   - **Diff:** the Diff tab shows exactly what that action changed.
   - **Time travel:** drag the slider back through actions; the UI rewinds (cart empties, theme flips).
   - **Replay:** use the play button to replay all recorded actions.
   - **Skip:** toggle one action off to see the state without it.

## 8. Tests

`test/store.test.js` (19), `test/persist.test.js` (3) and `test/wishlist.test.js` (12) cover: every slice's reducers, the memoized selectors, the toast `notify` thunk (auto-dismiss, 3-toast cap, no functions in the store) and the async thunks with a mocked `fetch` (loading, success, failure, abort). A fresh store per test comes from `makeStore()`. Persistence tests check that old localStorage keys load into the store and changes are written back. The 134 earlier tests still pass (193 total).
