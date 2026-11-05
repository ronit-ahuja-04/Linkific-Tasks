import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeStore } from '../src/store/index.js';
import { login, logout } from '../src/store/slices/authSlice.js';
import { toggleTheme, setTheme } from '../src/store/slices/themeSlice.js';
import {
  addItem,
  changeQuantity,
  removeItem,
  clearCart,
  selectCartCount,
  selectCartItems,
  selectCartSubtotal,
} from '../src/store/slices/cartSlice.js';
import {
  addTask,
  toggleTask,
  removeTask,
  restoreTask,
  editTask,
  moveTask,
  clearCompleted,
  selectTasks,
  selectProgress,
} from '../src/store/slices/tasksSlice.js';
import {
  postAdded,
  postEdited,
  postRemoved,
  markSeen,
  selectAnnouncements,
  selectUnreadCount,
} from '../src/store/slices/announcementsSlice.js';
import { sessionToggled, selectSavedIds } from '../src/store/slices/scheduleSlice.js';
import { lapAdded, lapsCleared, selectLaps } from '../src/store/slices/lapsSlice.js';
import { notify, selectToasts, toastDismissed } from '../src/store/slices/toastsSlice.js';
import { takeToastAction } from '../src/store/toastActions.js';
import { toggleXray, selectXrayOn } from '../src/store/slices/uiSlice.js';
import { fetchUsers, fetchUserPosts } from '../src/store/slices/usersSlice.js';
import { SWAG_PRODUCTS } from '../src/data/products.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('auth and theme slices', () => {
  it('logs in and out', () => {
    const store = makeStore();
    expect(store.getState().auth.isOrganizer).toBe(false);
    store.dispatch(login());
    expect(store.getState().auth.isOrganizer).toBe(true);
    store.dispatch(logout());
    expect(store.getState().auth.isOrganizer).toBe(false);
  });

  it('toggles and sets the theme', () => {
    const store = makeStore({ theme: { mode: 'light' } });
    store.dispatch(toggleTheme());
    expect(store.getState().theme.mode).toBe('dark');
    store.dispatch(setTheme('light'));
    expect(store.getState().theme.mode).toBe('light');
    store.dispatch(setTheme('nonsense'));
    expect(store.getState().theme.mode).toBe('light');
  });
});

describe('cart slice', () => {
  const id = SWAG_PRODUCTS[0].id;

  it('adds, changes quantity and removes items', () => {
    const store = makeStore();
    store.dispatch(addItem(id));
    store.dispatch(addItem(id));
    expect(selectCartItems(store.getState())).toEqual([{ productId: id, quantity: 2 }]);
    store.dispatch(changeQuantity({ productId: id, delta: 1 }));
    expect(selectCartCount(store.getState())).toBe(3);
    store.dispatch(removeItem(id));
    expect(selectCartItems(store.getState())).toEqual([]);
  });

  it('caps quantity at 10 and clears', () => {
    const store = makeStore();
    for (let i = 0; i < 15; i++) store.dispatch(addItem(id));
    expect(selectCartCount(store.getState())).toBe(10);
    store.dispatch(clearCart());
    expect(selectCartCount(store.getState())).toBe(0);
  });

  it('derives the subtotal with a memoized selector', () => {
    const store = makeStore();
    store.dispatch(addItem(id));
    const first = selectCartSubtotal(store.getState());
    expect(first).toBe(SWAG_PRODUCTS[0].price);
    expect(selectCartSubtotal(store.getState())).toBe(first);
  });
});

describe('tasks slice', () => {
  it('adds, toggles, edits, moves and removes tasks', () => {
    const store = makeStore({ tasks: { items: [] } });
    store.dispatch(addTask('First'));
    store.dispatch(addTask('Second'));
    let tasks = selectTasks(store.getState());
    expect(tasks.map((t) => t.text)).toEqual(['Second', 'First']);

    store.dispatch(toggleTask(tasks[0].id));
    expect(selectTasks(store.getState())[0].done).toBe(true);

    store.dispatch(editTask({ id: tasks[1].id, text: 'First edited' }));
    expect(selectTasks(store.getState())[1].text).toBe('First edited');

    store.dispatch(moveTask({ from: 0, to: 1 }));
    expect(selectTasks(store.getState()).map((t) => t.text)).toEqual(['First edited', 'Second']);

    store.dispatch(clearCompleted());
    expect(selectTasks(store.getState()).map((t) => t.text)).toEqual(['First edited']);
  });

  it('restores a removed task at its index (undo)', () => {
    const store = makeStore({ tasks: { items: [] } });
    ['a', 'b', 'c'].forEach((t) => store.dispatch(addTask(t)));
    const before = selectTasks(store.getState());
    const target = before[1];
    store.dispatch(removeTask(target.id));
    expect(selectTasks(store.getState())).toHaveLength(2);
    store.dispatch(restoreTask({ task: target, index: 1 }));
    expect(selectTasks(store.getState())).toEqual(before);
  });

  it('computes progress from state', () => {
    const store = makeStore({ tasks: { items: [] } });
    ['a', 'b', 'c'].forEach((t) => store.dispatch(addTask(t)));
    selectTasks(store.getState()).forEach((t) => store.dispatch(toggleTask(t.id)));
    expect(selectProgress(store.getState()).isComplete).toBe(true);
  });
});

describe('announcements and schedule slices', () => {
  const draft = {
    title: 'Lunch moved',
    body: 'Lunch is now at 1pm in the main hall.',
    category: 'Food',
  };

  it('adds, edits and removes a post and tracks unread', () => {
    const store = makeStore();
    const base = selectAnnouncements(store.getState()).length;
    store.dispatch(postAdded(draft));
    const list = selectAnnouncements(store.getState());
    expect(list).toHaveLength(base + 1);
    const added = list.find((p) => p.title === 'Lunch moved');
    store.dispatch(postEdited({ id: added.id, fields: { title: 'Lunch at 1pm' } }));
    expect(selectAnnouncements(store.getState()).some((p) => p.title === 'Lunch at 1pm')).toBe(
      true
    );
    store.dispatch(postRemoved(added.id));
    expect(selectAnnouncements(store.getState())).toHaveLength(base);
  });

  it('marks everything seen', () => {
    const store = makeStore();
    store.dispatch(markSeen());
    expect(selectUnreadCount(store.getState())).toBe(0);
  });

  it('toggles saved sessions', () => {
    const store = makeStore();
    store.dispatch(sessionToggled('s1'));
    expect(selectSavedIds(store.getState())).toEqual(['s1']);
    store.dispatch(sessionToggled('s1'));
    expect(selectSavedIds(store.getState())).toEqual([]);
  });
});

describe('laps, ui and toasts', () => {
  it('records and clears laps', () => {
    const store = makeStore();
    store.dispatch(lapAdded({ id: 1, ms: 1000 }));
    store.dispatch(lapAdded({ id: 2, ms: 2000 }));
    expect(selectLaps(store.getState()).map((l) => l.id)).toEqual([2, 1]);
    store.dispatch(lapsCleared());
    expect(selectLaps(store.getState())).toEqual([]);
  });

  it('toggles the x-ray flag', () => {
    const store = makeStore();
    store.dispatch(toggleXray());
    expect(selectXrayOn(store.getState())).toBe(true);
  });

  it('notify thunk adds a toast, keeps functions out of the store and auto-dismisses', () => {
    vi.useFakeTimers();
    const store = makeStore();
    const onClick = vi.fn();
    store.dispatch(notify('Deleted', { label: 'Undo', onClick }, 'info'));
    const [toast] = selectToasts(store.getState());
    expect(toast).toMatchObject({ message: 'Deleted', actionLabel: 'Undo', type: 'info' });
    expect(JSON.stringify(store.getState().toasts)).not.toContain('function');
    takeToastAction(toast.id)();
    expect(onClick).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(4500);
    expect(selectToasts(store.getState())).toEqual([]);
  });

  it('keeps at most three toasts', () => {
    vi.useFakeTimers();
    const store = makeStore();
    for (let i = 0; i < 5; i++) store.dispatch(notify(`m${i}`));
    expect(selectToasts(store.getState())).toHaveLength(3);
    expect(selectToasts(store.getState())[0].message).toBe('m4');
    store.dispatch(toastDismissed(selectToasts(store.getState())[0].id));
    expect(selectToasts(store.getState())).toHaveLength(2);
  });
});

describe('users slice (async thunks)', () => {
  it('moves idle -> loading -> succeeded on a good response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ users: [{ id: 1, firstName: 'Ada' }], total: 42 }),
      })
    );
    const store = makeStore();
    expect(store.getState().users.list.status).toBe('idle');
    const promise = store.dispatch(fetchUsers({ query: '', limit: 10, skip: 0, delay: 0 }));
    expect(store.getState().users.list.status).toBe('loading');
    await promise;
    const list = store.getState().users.list;
    expect(list.status).toBe('succeeded');
    expect(list.users).toHaveLength(1);
    expect(list.total).toBe(42);
  });

  it('moves to failed with the error message on an HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Server Error' })
    );
    const store = makeStore();
    await store.dispatch(fetchUsers({ query: 'x' }));
    const list = store.getState().users.list;
    expect(list.status).toBe('failed');
    expect(list.error).toContain('500');
  });

  it('does not report an aborted request as an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (url, { signal }) =>
          new Promise((_, reject) => {
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            );
          })
      )
    );
    const store = makeStore();
    const promise = store.dispatch(fetchUsers({ query: 'a' }));
    promise.abort();
    await promise;
    expect(store.getState().users.list.status).toBe('loading');
    expect(store.getState().users.list.error).toBeNull();
  });

  it('stores posts per user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [{ id: 9 }] }) })
    );
    const store = makeStore();
    await store.dispatch(fetchUserPosts(7));
    expect(store.getState().users.posts[7]).toMatchObject({
      status: 'succeeded',
      posts: [{ id: 9 }],
    });
  });
});
