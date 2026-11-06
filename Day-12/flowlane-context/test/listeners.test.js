import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: { name: 'auth' }, googleProvider: {}, isFirebaseConfigured: true }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { authMock } from './mocks/auth.js';
import { makeStore } from '../src/store/index.js';
import { startProjectListener, startUserListeners } from '../src/store/listeners.js';
import { setSessionUser } from '../src/lib/session.js';
import { projectsReceived, selectProjects, selectProjectsLoading } from '../src/store/slices/projectsSlice.js';
import { selectUsersById } from '../src/store/slices/usersSlice.js';
import { selectNotifications, selectToasts, selectUnreadMessages } from '../src/store/slices/notificationsSlice.js';
import { selectInvitations } from '../src/store/slices/invitationsSlice.js';
import { selectHasNewActivity, tabChanged } from '../src/store/slices/uiSlice.js';

// `pending` lists the ids of documents that still have local writes the server has not confirmed
const snap = (docs, changes = [], { pending = [], fromCache = false } = {}) => ({
  docs: docs.map(({ id, ...data }) => ({ id, data: () => data, metadata: { hasPendingWrites: pending.includes(id) } })),
  docChanges: () => changes.map((c) => ({ type: c.type, doc: { id: c.id, data: () => c.data } })),
  metadata: { fromCache },
});

/** Run startX, then hand back the onSnapshot callbacks in the order they were registered */
const registered = () =>
  fs.onSnapshot.mock.calls.map(([target, ...rest]) => ({ target, next: rest.find((a) => typeof a === 'function'), error: rest.filter((a) => typeof a === 'function')[1] }));

afterEach(() => vi.restoreAllMocks()); // console spies must not leak between tests

beforeEach(() => {
  resetFirestoreMock();
  authMock.onAuthStateChanged.mockReset();
  fs.onSnapshot.mockImplementation(() => vi.fn()); // each call returns its own unsubscribe spy
});

describe('startUserListeners', () => {
  const start = () => {
    const store = makeStore();
    setSessionUser({ uid: 'u1', email: 'ann@x.com', displayName: 'Ann' });
    fs.getDocs.mockResolvedValue({ empty: true, docs: [] });
    const stop = startUserListeners(store, { uid: 'u1', email: 'ann@x.com' });
    return { store, stop, listeners: registered() };
  };

  it('subscribes to projects, users, the profile, notifications and invitations', () => {
    const { listeners } = start();
    expect(listeners.map((l) => l.target.type === 'query' ? 'query' : l.target.path)).toEqual([
      'query', 'users', 'users/u1', 'query', 'query',
    ]);
    expect(fs.where).toHaveBeenCalledWith('members', 'array-contains', 'u1');
    expect(fs.where).toHaveBeenCalledWith('inviteeEmail', '==', 'ann@x.com');
  });

  it('puts projects, users, unread count and invitations into the store', () => {
    const { store, listeners } = start();
    listeners[0].next(snap([{ id: 'p1', name: 'One', members: ['u1'] }]));
    expect(selectProjects(store.getState())).toEqual([{ id: 'p1', name: 'One', members: ['u1'] }]);
    expect(selectProjectsLoading(store.getState())).toBe(false);
    listeners[1].next(snap([{ id: 'u1', email: 'ann@x.com' }, { id: 'u2', email: 'bob@x.com' }]));
    expect(Object.keys(selectUsersById(store.getState()))).toEqual(['u1', 'u2']);
    listeners[2].next({ exists: () => true, data: () => ({ unreadMessages: 3 }) });
    expect(selectUnreadMessages(store.getState())).toBe(3);
    listeners[2].next({ exists: () => false });
    expect(selectUnreadMessages(store.getState())).toBe(3);
    listeners[4].next(snap([{ id: 'i1', projectId: 'p1' }]));
    expect(selectInvitations(store.getState())).toEqual([{ id: 'i1', projectId: 'p1' }]);
  });

  it('converts notification timestamps and only toasts ones that arrive after the first snapshot', () => {
    const { store, listeners } = start();
    const ts = { toMillis: () => 777 };
    listeners[3].next(snap([{ id: 'n1', message: 'old', createdAt: ts }], [{ type: 'added', id: 'n1', data: { message: 'old', createdAt: ts } }]));
    expect(selectNotifications(store.getState())[0].createdAt).toBe(777);
    expect(selectToasts(store.getState())).toEqual([]);
    listeners[3].next(snap([{ id: 'n2', message: 'new', createdAt: ts }, { id: 'n1', message: 'old', createdAt: ts }], [{ type: 'added', id: 'n2', data: { message: 'new', createdAt: ts } }, { type: 'modified', id: 'n1', data: {} }]));
    expect(selectToasts(store.getState()).map((t) => t.id)).toEqual(['n2']);
    expect(JSON.stringify(store.getState())).toBeTruthy(); // serializable
  });

  it('creates the first project once when the user has none, even if the snapshot repeats', async () => {
    const { listeners } = start();
    listeners[0].next(snap([]));
    listeners[0].next(snap([]));
    await vi.waitFor(() => expect(fs.setDoc).toHaveBeenCalled());
    const projectWrites = fs.setDoc.mock.calls.filter(([ref]) => ref.path.startsWith('projects/'));
    expect(projectWrites).toHaveLength(1);
  });

  it('publishes a new project only once the server has confirmed it, and keeps it while later edits are pending', () => {
    const { store, listeners } = start();
    // created locally, not yet on the server: not published (a board listener would be refused)
    listeners[0].next(snap([{ id: 'p1', name: 'New', members: ['u1'] }], [], { pending: ['p1'] }));
    expect(selectProjects(store.getState())).toEqual([]);
    // the server confirms it
    listeners[0].next(snap([{ id: 'p1', name: 'New', members: ['u1'] }]));
    expect(selectProjects(store.getState()).map((p) => p.id)).toEqual(['p1']);
    // a later edit (a new task, a drag) is pending again: the project must NOT disappear
    listeners[0].next(snap([{ id: 'p1', name: 'New', members: ['u1'] }], [], { pending: ['p1'] }));
    expect(selectProjects(store.getState()).map((p) => p.id)).toEqual(['p1']);
    // deleted on the server: gone
    listeners[0].next(snap([]));
    expect(selectProjects(store.getState())).toEqual([]);
  });

  it('listens with metadata changes so it hears when a pending project is confirmed', () => {
    start();
    const options = fs.onSnapshot.mock.calls[0].find((a) => a && typeof a === 'object' && 'includeMetadataChanges' in a);
    expect(options).toEqual({ includeMetadataChanges: true });
  });

  it('does not create a first project from an empty snapshot that came from the cache', async () => {
    const { listeners } = start();
    listeners[0].next(snap([], [], { fromCache: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fs.setDoc.mock.calls.filter(([ref]) => ref.path.startsWith('projects/'))).toHaveLength(0);
  });

  it('creates a new first project when the user later deletes their last one', async () => {
    const { listeners } = start();
    listeners[0].next(snap([]));
    await vi.waitFor(() => expect(fs.setDoc.mock.calls.filter(([ref]) => ref.path.startsWith('projects/'))).toHaveLength(1));
    listeners[0].next(snap([{ id: 'p1', members: ['u1'] }])); // the first project arrives
    listeners[0].next(snap([])); // ...and is deleted
    await vi.waitFor(() => expect(fs.setDoc.mock.calls.filter(([ref]) => ref.path.startsWith('projects/'))).toHaveLength(2));
  });

  it('unsubscribes everything and clears per-user state when stopped', () => {
    const { store, stop, listeners } = start();
    const unsubs = fs.onSnapshot.mock.results.map((r) => r.value);
    listeners[0].next(snap([{ id: 'p1', members: ['u1'] }]));
    stop();
    unsubs.forEach((u) => expect(u).toHaveBeenCalledOnce());
    expect(selectProjects(store.getState())).toEqual([]);
    expect(selectProjectsLoading(store.getState())).toBe(true);
  });
});

describe('startProjectListener', () => {
  const start = () => {
    const store = makeStore();
    const stop = startProjectListener(store, 'p1', 'u1');
    return { store, stop, listeners: registered() };
  };

  it('puts the project board into the store', () => {
    const { store, listeners } = start();
    expect(listeners[0].target.path).toBe('projects/p1');
    listeners[0].next({
      exists: () => true,
      data: () => ({ name: 'P', tasks: { t1: { id: 't1' } }, columns: { todo: { id: 'todo', taskIds: ['t1'] } }, columnOrder: ['todo'] }),
    });
    const { board } = store.getState();
    expect(board).toMatchObject({ projectId: 'p1', status: 'ready', columnOrder: ['todo'] });
    expect(board.tasks.t1).toEqual({ id: 't1' });
  });

  it('gives a project that has no board yet an empty one, and saves it', () => {
    const { store, listeners } = start();
    const ref = { path: 'projects/p1' };
    listeners[0].next({ exists: () => true, ref, data: () => ({ name: 'P', members: ['u1'] }) });
    expect(store.getState().board.columnOrder).toEqual(['todo', 'inprogress', 'done']);
    expect(fs.setDoc).toHaveBeenCalledWith(ref, expect.objectContaining({ name: 'P', columnOrder: ['todo', 'inprogress', 'done'] }), { merge: true });
  });

  it('ignores a missing project', () => {
    const { store, listeners } = start();
    listeners[0].next({ exists: () => false });
    expect(store.getState().board.status).toBe('idle');
  });

  it('flags new chat activity from others, but not the first snapshot, your own messages or when you are on the tab', () => {
    const { store, listeners } = start();
    const message = (uid) => ({ docs: [], docChanges: () => [{ type: 'added', doc: { data: () => ({ uid }) } }] });
    listeners[1].next(message('u2')); // first snapshot: ignored
    expect(selectHasNewActivity(store.getState())).toBe(false);
    listeners[1].next(message('u1')); // my own message
    expect(selectHasNewActivity(store.getState())).toBe(false);
    store.dispatch(tabChanged('activity'));
    listeners[1].next(message('u2')); // I am looking at the activity tab
    expect(selectHasNewActivity(store.getState())).toBe(false);
    store.dispatch(tabChanged('board'));
    listeners[1].next(message('u2'));
    expect(selectHasNewActivity(store.getState())).toBe(true);
  });

  it('treats permission-denied as "this project is gone" and drops it quietly', () => {
    const store = makeStore();
    store.dispatch(projectsReceived([{ id: 'p1', members: ['u1'] }, { id: 'p2', members: ['u1'] }]));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    startProjectListener(store, 'p1', 'u1');
    const [board, activity] = registered();
    board.error({ code: 'permission-denied', message: 'denied' });
    expect(selectProjects(store.getState()).map((p) => p.id)).toEqual(['p2']);
    activity.error({ code: 'permission-denied', message: 'denied' });
    expect(log.mock.calls).toEqual([]);
    log.mockRestore();
  });

  it('still logs any other listener error', () => {
    const store = makeStore();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    startProjectListener(store, 'p1', 'u1');
    registered()[0].error({ code: 'unavailable', message: 'offline' });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('board listener error: unavailable'));
    log.mockRestore();
  });

  it('unsubscribes both listeners', () => {
    const { stop } = start();
    const unsubs = fs.onSnapshot.mock.results.map((r) => r.value);
    stop();
    unsubs.forEach((u) => expect(u).toHaveBeenCalledOnce());
  });
});
