// Shared helpers for building a store in a known state
import { makeStore } from '../../src/store/index.js';
import { authStateChanged } from '../../src/store/slices/authSlice.js';
import { projectsReceived } from '../../src/store/slices/projectsSlice.js';
import { boardReceived } from '../../src/store/slices/boardSlice.js';
import { usersReceived } from '../../src/store/slices/usersSlice.js';
import { makeEmptyBoard } from '../../src/lib/board.js';

export const ME = { uid: 'u1', email: 'ann@x.com', displayName: 'Ann', photoURL: null };
export const BOB = { uid: 'u2', email: 'bob@x.com', displayName: 'Bob' };

export const task = (id, extra = {}) => ({ id, content: `Task ${id}`, priority: 'medium', users: [], ...extra });

/** A signed-in store with one open project and a board with todo: [t1, t2], inprogress: [t3] */
export function loadedStore() {
  const store = makeStore();
  store.dispatch(authStateChanged(ME));
  store.dispatch(projectsReceived([{ id: 'p1', name: 'Project', owner: 'u1', members: ['u1', 'u2'] }]));
  const board = makeEmptyBoard();
  board.tasks = { t1: task('t1'), t2: task('t2'), t3: task('t3') };
  board.columns.todo.taskIds = ['t1', 't2'];
  board.columns.inprogress.taskIds = ['t3'];
  store.dispatch(boardReceived({ projectId: 'p1', ...board }));
  store.dispatch(usersReceived({ u1: { id: 'u1', ...ME }, u2: { id: 'u2', ...BOB } }));
  return store;
}
