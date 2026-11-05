import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { loadedStore, task } from './mocks/setup.js';
import {
  assignTaskUsers, boardErrorCleared, createTask, deleteTask, dragTask, saveTask, selectBoard,
  selectBoardError, taskUpdated,
} from '../src/store/slices/boardSlice.js';
import { selectTaskPanel, taskPanelOpened } from '../src/store/slices/uiSlice.js';

beforeEach(() => {
  resetFirestoreMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const move = (from, fromIndex, to, toIndex, id) => ({
  source: { droppableId: from, index: fromIndex },
  destination: { droppableId: to, index: toIndex },
  draggableId: id,
});
const ids = (store, col) => store.getState().board.columns[col].taskIds;

describe('dragTask: an optimistic update with rollback', () => {
  it('moves the card immediately, before Firestore answers', async () => {
    const store = loadedStore();
    let finish;
    fs.updateDoc.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const promise = store.dispatch(dragTask(move('todo', 0, 'inprogress', 1, 't1')));
    expect(ids(store, 'inprogress')).toEqual(['t3', 't1']); // already moved
    expect(ids(store, 'todo')).toEqual(['t2']);
    finish();
    await promise;
    expect(ids(store, 'inprogress')).toEqual(['t3', 't1']);
  });

  it('writes the whole board to the project document', async () => {
    const store = loadedStore();
    await store.dispatch(dragTask(move('todo', 0, 'inprogress', 0, 't1')));
    const [ref, payload] = fs.updateDoc.mock.calls[0];
    expect(ref.path).toBe('projects/p1');
    expect(payload.columns.inprogress.taskIds).toEqual(['t1', 't3']);
    expect(Object.keys(payload).sort()).toEqual(['columnOrder', 'columns', 'tasks']);
  });

  it('puts the card back and reports an error when the write fails', async () => {
    const store = loadedStore();
    const before = selectBoard(store.getState());
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    await store.dispatch(dragTask(move('todo', 0, 'inprogress', 0, 't1')));
    expect(selectBoard(store.getState())).toEqual(before);
    expect(selectBoardError(store.getState())).toBe('permission-denied');
    expect(store.getState().board.snapshots).toEqual({});
    store.dispatch(boardErrorCleared());
    expect(selectBoardError(store.getState())).toBeNull();
  });

  it('skips the thunk entirely for a move that changes nothing', async () => {
    const store = loadedStore();
    const result = await store.dispatch(dragTask(move('todo', 0, 'todo', 0, 't1')));
    expect(result.meta.condition).toBe(true); // RTK reports a skipped thunk
    expect(fs.updateDoc).not.toHaveBeenCalled();
    await store.dispatch(dragTask({ source: { droppableId: 'todo', index: 0 }, destination: null, draggableId: 't1' }));
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it('does not let a finished task leave the Done column', async () => {
    const store = loadedStore();
    await store.dispatch(dragTask(move('todo', 0, 'done', 0, 't1')));
    fs.updateDoc.mockClear();
    const result = await store.dispatch(dragTask(move('done', 0, 'todo', 0, 't1')));
    expect(result.meta.condition).toBe(true);
    expect(ids(store, 'done')).toEqual(['t1']);
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it('keeps one snapshot per request, so overlapping failures restore correctly', async () => {
    const store = loadedStore();
    let failFirst;
    fs.updateDoc.mockReturnValueOnce(new Promise((_, reject) => { failFirst = reject; }));
    const first = store.dispatch(dragTask(move('todo', 0, 'inprogress', 0, 't1')));
    const second = store.dispatch(dragTask(move('todo', 0, 'inprogress', 0, 't2')));
    expect(Object.keys(store.getState().board.snapshots)).toHaveLength(2);
    await second;
    failFirst(new Error('network'));
    await first;
    // the first failed: its snapshot (the original board) is restored
    expect(ids(store, 'todo')).toEqual(['t1', 't2']);
    expect(store.getState().board.snapshots).toEqual({});
  });
});

describe('createTask', () => {
  const draft = () => ({ ...task('t9', { content: 'New one' }), _isDraft: true, _columnId: 'todo' });

  it('adds the task at once (without draft flags) and writes only the changed fields', async () => {
    const store = loadedStore();
    await store.dispatch(createTask({ task: draft(), columnId: 'todo' }));
    expect(ids(store, 'todo')).toEqual(['t1', 't2', 't9']);
    expect(store.getState().board.tasks.t9._isDraft).toBeUndefined();
    const [ref, payload] = fs.updateDoc.mock.calls[0];
    expect(ref.path).toBe('projects/p1');
    expect(payload['columns.todo.taskIds']).toEqual(['t1', 't2', 't9']);
    expect(payload['tasks.t9'].content).toBe('New one');
  });

  it('notifies the other members, not the author, with a server timestamp', async () => {
    const store = loadedStore();
    await store.dispatch(createTask({ task: draft(), columnId: 'todo' }));
    await vi.waitFor(() => expect(fs.setDoc).toHaveBeenCalledOnce());
    const [ref, data] = fs.setDoc.mock.calls[0];
    expect(ref.path).toMatch(/^users\/u2\/notifications\//);
    expect(data).toMatchObject({ message: 'Ann created a new task: New one', projectId: 'p1', read: false, createdAt: 'SERVER_TS' });
  });

  it('rolls back when the write fails', async () => {
    const store = loadedStore();
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    await store.dispatch(createTask({ task: draft(), columnId: 'todo' }));
    expect(ids(store, 'todo')).toEqual(['t1', 't2']);
    expect(store.getState().board.tasks.t9).toBeUndefined();
    expect(fs.setDoc).not.toHaveBeenCalled();
  });
});

describe('deleteTask and saveTask', () => {
  it('deletes a task from the board and the document', async () => {
    const store = loadedStore();
    await store.dispatch(deleteTask('t2'));
    expect(ids(store, 'todo')).toEqual(['t1']);
    const payload = fs.updateDoc.mock.calls[0][1];
    expect(payload.tasks.t2).toBeUndefined();
    expect(payload.columns.todo.taskIds).toEqual(['t1']);
  });

  it('restores a deleted task when the write fails', async () => {
    const store = loadedStore();
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    await store.dispatch(deleteTask('t2'));
    expect(ids(store, 'todo')).toEqual(['t1', 't2']);
    expect(store.getState().board.tasks.t2).toBeDefined();
  });

  it('does nothing for a task that is not on the board', async () => {
    const store = loadedStore();
    const result = await store.dispatch(deleteTask('ghost'));
    expect(result.meta.condition).toBe(true);
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it('saves an edited task and updates the open task panel at the same time', async () => {
    const store = loadedStore();
    store.dispatch(taskPanelOpened(store.getState().board.tasks.t1));
    const edited = { ...store.getState().board.tasks.t1, content: 'Edited', priority: 'high' };
    const promise = store.dispatch(saveTask(edited));
    expect(selectTaskPanel(store.getState()).task.content).toBe('Edited'); // ui slice reacted to saveTask.pending
    await promise;
    expect(store.getState().board.tasks.t1.priority).toBe('high');
    expect(fs.updateDoc.mock.calls[0][1]).toEqual({ 'tasks.t1': edited });
  });

  it('rolls an edit back if saving fails', async () => {
    const store = loadedStore();
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    await store.dispatch(saveTask({ ...task('t1'), content: 'Nope' }));
    expect(store.getState().board.tasks.t1.content).toBe('Task t1');
  });
});

describe('assignTaskUsers', () => {
  it('assigns, notifies the new assignee and updates only the users field', async () => {
    const store = loadedStore();
    const t1 = store.getState().board.tasks.t1;
    await store.dispatch(assignTaskUsers({ task: t1, users: ['u2'], assignedUid: 'u2', title: 'Task t1' }));
    expect(store.getState().board.tasks.t1.users).toEqual(['u2']);
    const [ref, data, options] = fs.setDoc.mock.calls[0];
    expect(ref.path).toBe('users/u2/notifications/assign_t1');
    expect(data).toMatchObject({ type: 'assignment', taskId: 't1', projectId: 'p1' });
    expect(options).toEqual({ merge: true });
    expect(fs.updateDoc.mock.calls[0][1]).toEqual({ 'tasks.t1.users': ['u2'] });
  });

  it('does not notify when un-assigning or self-assigning, and skips the write for drafts', async () => {
    const store = loadedStore();
    const t1 = store.getState().board.tasks.t1;
    await store.dispatch(assignTaskUsers({ task: t1, users: [], assignedUid: null, title: '' }));
    await store.dispatch(assignTaskUsers({ task: t1, users: ['u1'], assignedUid: 'u1', title: '' }));
    expect(fs.setDoc).not.toHaveBeenCalled();
    fs.updateDoc.mockClear();
    const draftTask = { ...task('d1'), _isDraft: true };
    await store.dispatch(assignTaskUsers({ task: draftTask, users: ['u2'], assignedUid: 'u2', title: 'x' }));
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it('rolls back the assignment if Firestore fails', async () => {
    const store = loadedStore();
    const t1 = store.getState().board.tasks.t1;
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    await store.dispatch(assignTaskUsers({ task: t1, users: ['u2'], assignedUid: null, title: '' }));
    expect(store.getState().board.tasks.t1.users).toEqual([]);
  });

  it('keeps the side panel in step with taskUpdated (one slice reacting to another)', () => {
    const store = loadedStore();
    store.dispatch(taskPanelOpened(store.getState().board.tasks.t1));
    store.dispatch(taskUpdated({ ...task('t1'), content: 'From elsewhere' }));
    expect(selectTaskPanel(store.getState()).task.content).toBe('From elsewhere');
    store.dispatch(taskUpdated({ ...task('t2'), content: 'Other task' }));
    expect(selectTaskPanel(store.getState()).task.content).toBe('From elsewhere');
  });
});
