import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore, rootReducer } from '../src/store/index.js';
import { loadState, pickPersisted, startPersisting } from '../src/store/persist.js';
import { loginUser, logout } from '../src/store/slices/authSlice.js';
import { addToCart } from '../src/store/slices/cartSlice.js';
import { addTodo, setFilter } from '../src/store/slices/todosSlice.js';
import { fakeStorage, mockFetch } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

const stubWindow = (storage) => vi.stubGlobal('window', { localStorage: storage });

describe('store setup', () => {
  it('combines four slices into one state tree', () => {
    expect(Object.keys(makeStore().getState()).sort()).toEqual(['auth', 'cart', 'products', 'todos']);
    expect(Object.keys(rootReducer(undefined, { type: '@@init' })).sort()).toEqual(['auth', 'cart', 'products', 'todos']);
  });

  it('slices are independent: an action only changes its own slice', () => {
    const store = makeStore();
    const before = store.getState();
    store.dispatch(addTodo('x'));
    const after = store.getState();
    expect(after.todos).not.toBe(before.todos);
    expect(after.cart).toBe(before.cart);
    expect(after.auth).toBe(before.auth);
    expect(after.products).toBe(before.products);
  });

  it('state stays serializable (no functions, no class instances)', () => {
    const store = makeStore();
    store.dispatch(addTodo('x'));
    store.dispatch(addToCart({ id: 1, title: 'a', price: 1, thumbnail: 't' }));
    expect(JSON.parse(JSON.stringify(store.getState()))).toEqual(store.getState());
  });
});

describe('slices working together', () => {
  it('login, add to the cart, add a todo, log out: only auth is reset', async () => {
    mockFetch({ json: { id: 1, username: 'u', firstName: 'U', accessToken: 'tok' } });
    const store = makeStore();
    await store.dispatch(loginUser({ username: 'u', password: 'p' }));
    store.dispatch(addToCart({ id: 1, title: 'a', price: 5, thumbnail: 't' }));
    store.dispatch(addTodo('buy milk'));
    store.dispatch(logout());
    const s = store.getState();
    expect(s.auth.token).toBeNull();
    expect(s.cart.items).toHaveLength(1);
    expect(s.todos.items).toHaveLength(1);
  });
});

describe('localStorage persistence', () => {
  it('saves the right parts and leaves out statuses and products', () => {
    const picked = pickPersisted(makeStore().getState());
    expect(Object.keys(picked).sort()).toEqual(['auth', 'cart', 'todos']);
    expect(picked.auth).toEqual({ user: null, token: null });
  });

  it('writes to storage when a persisted slice changes, and only then', () => {
    const storage = fakeStorage();
    stubWindow(storage);
    const store = makeStore();
    startPersisting(store);
    store.dispatch({ type: 'products/unrelated' });
    expect(storage.data['redux-market:v1']).toBeUndefined();
    store.dispatch(addTodo('persist me'));
    const saved = JSON.parse(storage.data['redux-market:v1']);
    expect(saved.todos.items[0].text).toBe('persist me');
  });

  it('restores saved state on startup (login survives a reload)', () => {
    const saved = {
      auth: { user: { id: 1, firstName: 'Emily' }, token: 'tok' },
      cart: { items: [{ id: 1, title: 'a', price: 1, thumbnail: 't', quantity: 2 }] },
      todos: { items: [{ id: 'a', text: 'x', done: true, createdAt: 1 }], filter: 'done' },
    };
    stubWindow(fakeStorage({ 'redux-market:v1': JSON.stringify(saved) }));
    const store = makeStore(loadState());
    const s = store.getState();
    expect(s.auth).toMatchObject({ token: 'tok', status: 'idle', error: null });
    expect(s.cart.items[0].quantity).toBe(2);
    expect(s.todos).toMatchObject({ filter: 'done', importStatus: 'idle' });
    expect(s.products.status).toBe('idle');
  });

  it('falls back to defaults for corrupt or empty storage', () => {
    stubWindow(fakeStorage({ 'redux-market:v1': '{not json' }));
    expect(loadState()).toBeUndefined();
    stubWindow(fakeStorage());
    expect(loadState()).toBeUndefined();
  });

  it('ignores a saved state that has no token', () => {
    stubWindow(fakeStorage({ 'redux-market:v1': JSON.stringify({ auth: { user: { id: 1 }, token: null } }) }));
    expect(loadState().auth).toBeUndefined();
  });

  it('persists the todo filter', () => {
    const storage = fakeStorage();
    stubWindow(storage);
    const store = makeStore();
    startPersisting(store);
    store.dispatch(setFilter('done'));
    expect(JSON.parse(storage.data['redux-market:v1']).todos.filter).toBe('done');
  });
});
