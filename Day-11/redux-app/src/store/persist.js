import { authInitialState } from './slices/authSlice.js';
import { todosInitialState } from './slices/todosSlice.js';

// One localStorage key holds the parts of the state worth keeping across reloads.
// Loading and request statuses are intentionally not saved: they should start fresh.
const KEY = 'redux-market:v1';

export function loadState() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw);
    const preloaded = {};
    if (saved.auth?.token) {
      preloaded.auth = { ...authInitialState, user: saved.auth.user ?? null, token: saved.auth.token };
    }
    if (Array.isArray(saved.cart?.items)) preloaded.cart = { items: saved.cart.items };
    if (Array.isArray(saved.todos?.items)) {
      preloaded.todos = { ...todosInitialState, items: saved.todos.items, filter: saved.todos.filter ?? 'all' };
    }
    return preloaded;
  } catch {
    return undefined; // missing, corrupt or blocked storage: start from the slice defaults
  }
}

export const pickPersisted = (state) => ({
  auth: { user: state.auth.user, token: state.auth.token },
  cart: { items: state.cart.items },
  todos: { items: state.todos.items, filter: state.todos.filter },
});

/** store.subscribe runs after every dispatch; write only when a persisted slice changed */
export function startPersisting(store) {
  let prev = store.getState();
  return store.subscribe(() => {
    const next = store.getState();
    if (next.auth !== prev.auth || next.cart !== prev.cart || next.todos !== prev.todos) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(pickPersisted(next)));
      } catch {
        /* storage full or blocked: ignore */
      }
    }
    prev = next;
  });
}
