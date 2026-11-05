# PRD: Redux Market, Redux Toolkit fundamentals (Day 11)

| Field     | Value                                                 |
| --------- | ----------------------------------------------------- |
| Owner     | Ronit Ahuja                                           |
| Programme | Linkific internship, Month 1 (training phase), Day 11 |
| Date      | Thursday, 5 November 2026                             |
| Repo path | `Linkific-Tasks/Day-11/redux-app`                     |
| Status    | **Built.** Merged via PR #58.  |
| Companion | `redux-app/README.md`                                 |

---

## 1. Summary

Day 11 teaches Redux and Redux Toolkit. This day builds a small new app, **Redux Market**, instead of extending HackHQ: a shop with a cart, a todo list and a login, whose state lives in a Redux store. It covers each item in the Day 11 "Build Redux application" task and every deliverable.

Related earlier work: `Day-11/hackhq-redux` is a first pass that moved HackHQ's state into Redux. It stays in the repo and is not the Day 11 deliverable.

## 2. Goals

| ID | Goal |
| -- | ---- |
| G1 | Understand Redux: store, actions, reducers, the three principles, unidirectional data flow |
| G2 | Decide what belongs in Redux and what stays local, and say why |
| G3 | Set up Redux Toolkit: `configureStore`, `createSlice`, `createAsyncThunk`, `Provider` |
| G4 | Build at least 3 slices that work together |
| G5 | Connect components with `useSelector` and `useDispatch` |
| G6 | Handle API calls with async thunks, including pending, fulfilled and rejected states and error handling |
| G7 | Configure and use Redux DevTools |

## 3. Non-goals

- No styling library, no TypeScript, no RTK Query, no `redux-persist`.
- No real backend: data comes from the free DummyJSON API.
- No features beyond the Day 11 list.

## 4. Design

### 4.1 Mapping the task list to the app

| Day 11 task | Implementation |
| ----------- | -------------- |
| Todo app with Redux state | `/todos`: add, toggle, edit, delete, filter (all, active, done), clear completed. Slice `todos` |
| User authentication state | `/login` uses a `loginUser` thunk against DummyJSON `/auth/login`; `/todos` is a protected route; header shows the user. Slice `auth` |
| Shopping cart with Redux | `/shop` adds products, `/cart` changes quantity (max 10), removes, clears, shows a memoized total. Slice `cart` |
| Fetch data and store in Redux | `fetchProducts` (list and search) in slice `products`; `importTodos` in slice `todos` |
| Multiple slices working together | `auth`, `todos`, `products`, `cart` combined; the cart page and header read more than one slice |
| Handle async operations | Three thunks with loading, success and error states; aborting stale requests |
| Redux DevTools | Enabled outside production, named "Redux Market"; README has the steps |

### 4.2 State shape

```
{
  auth:     { user, token, status, error },
  todos:    { items, filter, importStatus, importError },
  products: { items, total, status, error },
  cart:     { items: [{ id, title, price, thumbnail, quantity }] }
}
```

### 4.3 Decisions

| Decision | Reason |
| -------- | ------ |
| Form fields, search text and edit drafts stay in `useState` | Only one component needs them |
| Cart stores a small snapshot of each product | Keeps state small and serializable |
| `prepare` callbacks for ids and timestamps | Reducers stay pure |
| `rejectWithValue` for login errors | Shows the server's message, not a generic one |
| Statuses are not persisted | Loading and error state should start fresh |
| Per-card selector factory in the shop | Adding one product does not re-render the other cards |
| Plain CSS in one file | Day 11 is about Redux, not styling |

## 5. Requirements

| ID | Requirement | Verified by |
| -- | ----------- | ----------- |
| R1 | `@reduxjs/toolkit` and `react-redux` installed; `Provider` wraps the app | `package.json`, `main.jsx` |
| R2 | At least 3 slices created with `createSlice` | 4 slices in `src/store/slices/` |
| R3 | `useSelector` and `useDispatch` used in components | Layout, Todos, Shop, Cart, Login, ProtectedRoute |
| R4 | Async thunk for an API call with pending, fulfilled and rejected handling | `fetchProducts`, `loginUser`, `importTodos`; unit tests |
| R5 | Redux DevTools configured | `configureStore` option; README section 7 |
| R6 | Global state shared across routes and kept across reloads | persistence tests |
| R7 | Todo, auth, cart and fetch features all work | tests, live API check, render of every route |
| R8 | README explains Redux concepts | `redux-app/README.md` |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | Redux Market: store, 4 slices, thunks, UI, persistence, tests, README | `day11/redux-app` | #58 |

## 7. Verification

- `npm run build` passes; `npm test` runs 33 tests (reducers, selectors, thunks with a mocked `fetch`, persistence, slices working together).
- One-off live check against DummyJSON: good and bad login, product list and search, todo import. All matched what the code expects.
- Every route rendered on the server, logged out and logged in, against a real store. This confirmed the content (products, cart totals, todo list, header pills).
- **Not done:** a manual browser pass (clicking, typing, DevTools extension: inspect, diff, time travel, replay) and a reload to confirm login and cart persist.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| DummyJSON is down or changes | Errors shown in the UI with a retry; tests use a mocked `fetch` |
| Putting too much in Redux | Written rule in the README on what stays local |
| Stale search results overwrite newer ones | Abort the previous request in the effect cleanup |
| Token in localStorage | Acceptable for a demo; real apps should prefer httpOnly cookies |

## 9. Deliverables

- React app with Redux Toolkit (`Day-11/redux-app`)
- 4 Redux slices (auth, todos, products, cart)
- `useSelector` and `useDispatch` examples across the app
- Async thunks for API calls (login, products, todo import)
- Redux DevTools configured
- Global state management working across routes, with persistence
- README explaining Redux concepts
