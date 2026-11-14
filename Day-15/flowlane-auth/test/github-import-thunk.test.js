import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { loadedStore } from './mocks/setup.js';
import { importTasks, selectBoard, selectBoardError } from '../src/store/slices/boardSlice.js';
import { issueToTask } from '../src/lib/github.js';

beforeEach(() => {
  resetFirestoreMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const mk = (n) =>
  issueToTask(
    { id: n, number: n, title: `Issue ${n}`, body: '', url: `https://github.com/o/r/issues/${n}`, labels: [], createdAt: '2025-01-01' },
    { repo: 'o/r', uid: 'u1' }
  );
const ids = (store, col) => store.getState().board.columns[col].taskIds;

describe('importTasks thunk', () => {
  it('adds every task to the first column optimistically, before Firestore answers', async () => {
    const store = loadedStore();
    let finish;
    fs.updateDoc.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const promise = store.dispatch(importTasks({ tasks: [mk(1), mk(2)], repo: 'o/r' }));
    expect(ids(store, 'todo')).toEqual(['t1', 't2', mk(1).id, mk(2).id]);
    finish();
    await promise;
    expect(ids(store, 'todo')).toHaveLength(4);
    expect(store.getState().board.snapshots).toEqual({});
  });

  it('writes ONE updateDoc with all tasks and the new column order', async () => {
    const store = loadedStore();
    await store.dispatch(importTasks({ tasks: [mk(1), mk(2), mk(3)], repo: 'o/r' }));
    expect(fs.updateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = fs.updateDoc.mock.calls[0];
    expect(ref.path).toBe('projects/p1');
    expect(Object.keys(payload).sort()).toEqual(
      ['columns.todo.taskIds', `tasks.${mk(1).id}`, `tasks.${mk(2).id}`, `tasks.${mk(3).id}`].sort()
    );
    expect(payload['columns.todo.taskIds']).toEqual(['t1', 't2', mk(1).id, mk(2).id, mk(3).id]);
    expect(payload[`tasks.${mk(1).id}`].source).toEqual({ type: 'github', repo: 'o/r', number: 1, url: 'https://github.com/o/r/issues/1' });
  });

  it('sends ONE notification to the other members (not one per task)', async () => {
    const store = loadedStore();
    await store.dispatch(importTasks({ tasks: [mk(1), mk(2), mk(3)], repo: 'o/r' }));
    await vi.waitFor(() => expect(fs.setDoc).toHaveBeenCalledTimes(1));
    const [, data] = fs.setDoc.mock.calls[0];
    expect(data.message).toBe('Ann imported 3 issues from o/r');
    expect(data.projectId).toBe('p1');
    expect(fs.collection.mock.calls.some((c) => c.includes('u2'))).toBe(true); // Bob, not Ann
  });

  it('uses the singular for one issue', async () => {
    const store = loadedStore();
    await store.dispatch(importTasks({ tasks: [mk(1)], repo: 'o/r' }));
    await vi.waitFor(() => expect(fs.setDoc).toHaveBeenCalled());
    expect(fs.setDoc.mock.calls[0][1].message).toBe('Ann imported 1 issue from o/r');
  });

  it('can target another column', async () => {
    const store = loadedStore();
    await store.dispatch(importTasks({ tasks: [mk(1)], columnId: 'inprogress', repo: 'o/r' }));
    expect(ids(store, 'inprogress')).toEqual(['t3', mk(1).id]);
    expect(Object.keys(fs.updateDoc.mock.calls[0][1])).toContain('columns.inprogress.taskIds');
  });

  it('returns how many were really added and skips issues already on the board', async () => {
    const store = loadedStore();
    await store.dispatch(importTasks({ tasks: [mk(1)], repo: 'o/r' }));
    fs.updateDoc.mockClear();
    const result = await store.dispatch(importTasks({ tasks: [mk(1), mk(2)], repo: 'o/r' }));
    expect(result.payload).toBe(1);
    expect(Object.keys(fs.updateDoc.mock.calls[0][1])).toContain(`tasks.${mk(2).id}`);
    expect(Object.keys(fs.updateDoc.mock.calls[0][1])).not.toContain(`tasks.${mk(1).id}`);
  });

  it('writes nothing when every issue was already imported', async () => {
    const store = loadedStore();
    await store.dispatch(importTasks({ tasks: [mk(1)], repo: 'o/r' }));
    fs.updateDoc.mockClear();
    fs.setDoc.mockClear();
    const result = await store.dispatch(importTasks({ tasks: [mk(1)], repo: 'o/r' }));
    expect(result.payload).toBe(0);
    expect(fs.updateDoc).not.toHaveBeenCalled();
    expect(fs.setDoc).not.toHaveBeenCalled();
  });

  it('is skipped entirely for an empty list', async () => {
    const store = loadedStore();
    const result = await store.dispatch(importTasks({ tasks: [], repo: 'o/r' }));
    expect(result.meta.condition).toBe(true);
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });

  it('rolls the board back and reports an error when the write fails', async () => {
    const store = loadedStore();
    const before = selectBoard(store.getState());
    fs.updateDoc.mockRejectedValueOnce(new Error('permission-denied'));
    const result = await store.dispatch(importTasks({ tasks: [mk(1), mk(2)], repo: 'o/r' }));
    expect(result.meta.requestStatus).toBe('rejected');
    expect(selectBoard(store.getState())).toEqual(before);
    expect(selectBoardError(store.getState())).toBe('permission-denied');
    expect(fs.setDoc).not.toHaveBeenCalled(); // no notification for a failed import
  });
});
