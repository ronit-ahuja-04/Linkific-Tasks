# Redux Market: Redux Toolkit fundamentals

**Day 11 Project:** Linkific Month 1 Training
**Author:** Ronit Ahuja
**Stack:** React 19, Vite, **Redux Toolkit 2**, **react-redux 9**, React Router 7, Vitest
**PRD:** [Day11_PRD.md](../Day11_PRD.md)

A small shop with a todo list and a login, built to practise Redux: four slices, async thunks for the API calls, and global state shared across pages.

## Run
```bash
cd Day-11/redux-app
npm install
npm run dev      # http://localhost:5173
npm test         # 33 unit tests
npm run build
```
Demo login: click **Fill demo account** (username `emilys`, password `emilyspass`, from [DummyJSON](https://dummyjson.com/docs)). The data comes from the free DummyJSON API, so you need an internet connection.

## 1. What the app does (and where each build item lives)

| Build item | Where | Redux part |
| --- | --- | --- |
| Todo app with Redux state | `/todos` (log in first) | `todos` slice: add, toggle, edit, delete, filter, clear completed |
| User authentication state | `/login`, header, protected `/todos` | `auth` slice and the `loginUser` thunk (token and user, error and loading state) |
| Shopping cart with Redux | `/shop` and `/cart` | `cart` slice: add, quantity, remove, clear, memoized totals |
| Fetch data and store in Redux | `/shop` (products, search) and "Import sample todos" | `products` slice with `fetchProducts`, `todos` slice with `importTodos` |
| Multiple slices working together | the whole app | 4 slices combined with `combineReducers`: the cart page also reads `auth`, the header reads `auth`, `cart` and `todos` |

## 2. Redux concepts

**What is Redux and why use it.** One store holds the state that many components share. Components read from it and send it actions. All changes go through reducers, so the state is predictable and you can inspect every change in DevTools.

**Unidirectional data flow**
```
UI event --dispatch--> action --> reducer --> new state in the store --> useSelector --> UI re-renders
```
A component never edits state directly. Clicking **Add to cart** dispatches `{ type: 'cart/addToCart', payload: {...} }`, the cart reducer returns the next state, and every component that selected cart data re-renders.

**The three principles**
1. **Single source of truth:** the whole state is one tree in one store (`state.auth`, `state.todos`, `state.products`, `state.cart`).
2. **State is read-only:** the only way to change it is to dispatch an action.
3. **Changes use pure functions:** a reducer takes the old state and an action and returns the new state, with no side effects (no `fetch`, no `Date.now()` inside reducers).

**Store, actions, reducers.** The store holds the state. An action is a plain object. A reducer is `(state, action) => newState`.

**Redux or local state?** I used a simple rule:

| In Redux (shared, persistent, or worth inspecting) | Local `useState` (only one component cares) |
| --- | --- |
| Logged-in user and token | Login form fields |
| Cart | The product search box text |
| Todos and the active filter | Which todo is being edited, and its draft text |
| Products and their loading status | The new-todo input |

**Redux vs Context API.** Context passes a value down the tree and is good for rarely changing values (theme, locale). When the value changes, every consumer re-renders. Redux adds `useSelector`, where a component re-renders only when the piece of state it selected changes, plus a standard way to change state, middleware such as thunks, and DevTools with time travel. The cost is more setup. For an app with a cart, todos, auth and async calls, Redux earns its keep. For a single dark-mode flag, Context or `useState` is enough.

## 3. Redux Toolkit basics

| API | Where | What it does |
| --- | --- | --- |
| `configureStore` | `src/store/index.js` | Creates the store; adds thunk middleware, development checks and DevTools |
| `createSlice` | `src/store/slices/*.js` | Declares the name, initial state and reducers; generates action creators automatically |
| `createAsyncThunk` | `authSlice`, `productsSlice`, `todosSlice` | Runs an async call and dispatches `pending`, `fulfilled`, `rejected` |
| `combineReducers` | `src/store/index.js` | Merges the slices into one state tree |
| `createSelector` | `todosSlice`, `cartSlice` | Memoized derived data (visible todos, cart total) |
| `prepare` callback | `todosSlice.addTodo`, `cartSlice.addToCart` | Builds the payload (ids, timestamps) so the reducer stays pure |
| `nanoid` | `todosSlice` | Generates unique ids |

Redux Toolkit uses Immer, so a reducer can say `todo.done = !todo.done` and RTK still produces a new immutable state.

**Slice pattern used everywhere**
```js
const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: { toggleTodo(state, action) { /* ... */ } },   // action creators generated for you
});
export const { toggleTodo } = todosSlice.actions;           // export actions
export default todosSlice.reducer;                          // export the reducer
```

## 4. Connecting Redux to React

```jsx
// src/main.jsx: Provider puts the store in React context
<Provider store={store}><App /></Provider>

// any component: read with useSelector, write with useDispatch
const items = useSelector(selectCartItems);
const dispatch = useDispatch();
<button onClick={() => dispatch(addToCart(product))}>Add to cart</button>
```
Read these for examples: `Layout.jsx` (three selectors), `Todos.jsx` (selectors, dispatch, local state for the draft), `Shop.jsx` (a thunk in an effect with abort, a selector factory per card), `Cart.jsx` (two slices), `Login.jsx` (a thunk with `unwrap()`), `ProtectedRoute.jsx` (auth selector).

## 5. Async operations with `createAsyncThunk`

```js
export const fetchProducts = createAsyncThunk('products/fetch', async (params, { signal }) =>
  getJson(buildProductsUrl(params), { signal }));
```
RTK dispatches three actions: `products/fetch/pending`, `.../fulfilled`, `.../rejected`. The slice handles them in `extraReducers`:

| Action | State change |
| --- | --- |
| `pending` | `status: 'loading'`, clear the error |
| `fulfilled` | `status: 'succeeded'`, store the products |
| `rejected` | `status: 'failed'`, store the error message |

The UI renders from `status`: loading text, an error with a **Try again** button, an empty state, or the grid.

**Error handling.** `loginUser` uses `rejectWithValue` so the server's own message ("Invalid credentials") becomes the error shown in the form; a network failure shows the fetch error instead. In `Login.jsx`, `dispatch(loginUser(...)).unwrap()` throws on rejection, so the component can navigate only on success.

**Cancelling.** `Shop.jsx` aborts the previous request in the effect cleanup, so a slow search cannot overwrite a newer one. An aborted request is ignored in `rejected` (it is not an error).

## 6. Persistence

`src/store/persist.js` subscribes to the store and saves the user, token, cart, todos and filter to one `localStorage` key. Loading and error statuses are deliberately not saved. State is restored with `preloadedState` on startup, so a reload keeps you logged in with your cart and todos.

## 7. Redux DevTools

Configured in `src/store/index.js` (`devTools` on outside production, named "Redux Market").
1. Install the **Redux DevTools** extension for Chrome, Edge or Firefox.
2. Run `npm run dev`, open the browser DevTools and choose the **Redux** tab.
3. Try these:
   - **Inspect:** log in and watch `auth/login/pending`, then `auth/login/fulfilled`, with the state tree.
   - **Diff:** the Diff tab shows what one action changed (for example, `cart/addToCart`).
   - **Time travel:** drag the slider back; the cart empties and the login disappears.
   - **Action replay:** use the play button to replay the recorded actions.
   - **Skip an action:** toggle one action off and see the state without it.

## 8. Tests

33 tests in `test/` cover each slice's reducers, memoized selectors, the three thunks (loading, success, HTTP failure, network failure, abort), slices working together, and persistence (save, restore, corrupt storage). Thunks run against a mocked `fetch`. I also checked the real DummyJSON login and product endpoints once by hand, and rendered every route logged out and logged in.

## 9. Project structure
```
src/
  store/
    index.js            configureStore, combineReducers, DevTools
    persist.js          localStorage load and save
    slices/             auth, todos, products, cart
  pages/                Shop, Cart, Todos, Login
  components/           Layout, ProtectedRoute
  lib/api.js            API helpers
test/                   slice, thunk, persistence tests
```
