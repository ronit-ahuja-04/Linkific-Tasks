import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true }));
const files = vi.hoisted(() => ({ deleteFile: vi.fn() }));
vi.mock('../src/lib/storage', () => ({ deleteFile: (...a) => files.deleteFile(...a) }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { loadedStore, task } from './mocks/setup.js';
import { safeImageUrl, makeAttachment, deleteAttachmentFiles } from '../src/lib/attachments.js';
import { addAttachment, deleteTask, removeAttachment, boardReceived } from '../src/store/slices/boardSlice.js';
import { deleteProject } from '../src/store/slices/projectsSlice.js';
import { selectTaskPanel, taskPanelOpened } from '../src/store/slices/uiSlice.js';
import { makeEmptyBoard } from '../src/lib/board.js';

const pic = (n) => ({ id: `${n}.png`, name: `${n}.png`, url: `https://files/${n}`, path: `projects/p1/tasks/t1/${n}.png`, size: 10, contentType: 'image/png', by: 'u1', createdAt: 1 });
const attachmentsOf = (store, id = 't1') => store.getState().board.tasks[id].attachments;

beforeEach(() => {
  resetFirestoreMock();
  files.deleteFile.mockReset().mockResolvedValue();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('safeImageUrl', () => {
  it('only lets http and https through', () => {
    expect(safeImageUrl('https://files/a')).toBe('https://files/a');
    expect(safeImageUrl('http://127.0.0.1:9299/a')).toBe('http://127.0.0.1:9299/a');
    expect(safeImageUrl('javascript:alert(1)')).toBeNull();
    expect(safeImageUrl('data:text/html,<script>')).toBeNull();
    expect(safeImageUrl(undefined)).toBeNull();
  });
});

describe('makeAttachment', () => {
  it('turns an upload result into the entry saved on the task', () => {
    const entry = makeAttachment({ url: 'https://f/x', path: 'projects/p1/tasks/t1/ab12-x.png', name: 'x.png', size: 5, contentType: 'image/png' }, 'u1');
    expect(entry).toMatchObject({ id: 'ab12-x.png', name: 'x.png', url: 'https://f/x', path: 'projects/p1/tasks/t1/ab12-x.png', size: 5, by: 'u1' });
    expect(typeof entry.createdAt).toBe('number');
  });
});

describe('deleteAttachmentFiles', () => {
  it('deletes every file, and one failure does not stop the others', async () => {
    files.deleteFile.mockRejectedValueOnce(new Error('denied'));
    await expect(deleteAttachmentFiles([pic('a'), pic('b')])).resolves.toBeUndefined();
    expect(files.deleteFile).toHaveBeenCalledTimes(2);
  });
  it('accepts nothing', async () => {
    await deleteAttachmentFiles(undefined);
    await deleteAttachmentFiles([{ name: 'no path' }]);
    expect(files.deleteFile).not.toHaveBeenCalled();
  });
});

describe('addAttachment', () => {
  it('shows the image at once and adds just that entry with arrayUnion', async () => {
    const store = loadedStore();
    let finish;
    fs.updateDoc.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const promise = store.dispatch(addAttachment({ taskId: 't1', attachment: pic('a') }));
    expect(attachmentsOf(store)).toEqual([pic('a')]); // optimistic
    finish();
    await promise;
    const [ref, payload] = fs.updateDoc.mock.calls[0];
    expect(ref.path).toBe('projects/p1');
    expect(payload).toEqual({ 'tasks.t1.attachments': { arrayUnion: [pic('a')] } });
  });

  it('appends to the images already there', async () => {
    const store = loadedStore();
    await store.dispatch(addAttachment({ taskId: 't1', attachment: pic('a') }));
    await store.dispatch(addAttachment({ taskId: 't1', attachment: pic('b') }));
    expect(attachmentsOf(store).map((a) => a.id)).toEqual(['a.png', 'b.png']);
  });

  it('shows the new image in the open task panel', async () => {
    const store = loadedStore();
    store.dispatch(taskPanelOpened(store.getState().board.tasks.t1));
    await store.dispatch(addAttachment({ taskId: 't1', attachment: pic('a') }));
    expect(selectTaskPanel(store.getState()).task.attachments).toEqual([pic('a')]);
  });

  it('takes the image back out when the write fails', async () => {
    const store = loadedStore();
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    const result = await store.dispatch(addAttachment({ taskId: 't1', attachment: pic('a') }));
    expect(result.error.message).toBe('offline');
    expect(attachmentsOf(store)).toBeUndefined();
  });

  it('fails for a task that is not on the board', async () => {
    const store = loadedStore();
    const result = await store.dispatch(addAttachment({ taskId: 'nope', attachment: pic('a') }));
    expect(result.error.message).toMatch(/no longer exists/);
    expect(fs.updateDoc).not.toHaveBeenCalled();
  });
});

describe('removeAttachment', () => {
  function storeWithImages() {
    const store = loadedStore();
    const board = { ...makeEmptyBoard(), ...{ tasks: { t1: task('t1', { attachments: [pic('a'), pic('b')] }) } } };
    board.columns.todo.taskIds = ['t1'];
    store.dispatch(boardReceived({ projectId: 'p1', ...board }));
    return store;
  }

  it('removes the entry with arrayRemove, then deletes the file', async () => {
    const store = storeWithImages();
    await store.dispatch(removeAttachment({ taskId: 't1', attachment: pic('a') }));
    expect(attachmentsOf(store).map((a) => a.id)).toEqual(['b.png']);
    expect(fs.updateDoc.mock.calls[0][1]).toEqual({ 'tasks.t1.attachments': { arrayRemove: [pic('a')] } });
    expect(files.deleteFile).toHaveBeenCalledWith(pic('a').path);
    expect(fs.updateDoc.mock.invocationCallOrder[0]).toBeLessThan(files.deleteFile.mock.invocationCallOrder[0]);
  });

  it('keeps the image, and its file, when the write fails', async () => {
    const store = storeWithImages();
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    const result = await store.dispatch(removeAttachment({ taskId: 't1', attachment: pic('a') }));
    expect(result.error.message).toBe('offline');
    expect(attachmentsOf(store).map((a) => a.id)).toEqual(['a.png', 'b.png']);
    expect(files.deleteFile).not.toHaveBeenCalled();
  });
});

describe('deleting a task or a project removes its files', () => {
  function storeWithImages() {
    const store = loadedStore();
    const board = makeEmptyBoard();
    board.tasks = { t1: task('t1', { attachments: [pic('a'), pic('b')] }), t2: task('t2', { attachments: [{ ...pic('c'), path: 'projects/p1/tasks/t2/c.png' }] }) };
    board.columns.todo.taskIds = ['t1', 't2'];
    store.dispatch(boardReceived({ projectId: 'p1', ...board }));
    return store;
  }

  it('deletes a task\'s images after the task is gone', async () => {
    const store = storeWithImages();
    await store.dispatch(deleteTask('t1'));
    expect(files.deleteFile.mock.calls.map((c) => c[0]).sort()).toEqual([pic('a').path, pic('b').path]);
  });

  it('keeps the images when the task could not be deleted', async () => {
    const store = storeWithImages();
    fs.updateDoc.mockRejectedValueOnce(new Error('offline'));
    await store.dispatch(deleteTask('t1'));
    expect(files.deleteFile).not.toHaveBeenCalled();
    expect(store.getState().board.tasks.t1.attachments).toHaveLength(2);
  });

  it('deletes the images of every task before the project document', async () => {
    const store = storeWithImages();
    await store.dispatch(deleteProject('p1'));
    expect(files.deleteFile).toHaveBeenCalledTimes(3);
    expect(files.deleteFile.mock.invocationCallOrder.at(-1)).toBeLessThan(fs.deleteDoc.mock.invocationCallOrder[0]);
    expect(fs.deleteDoc.mock.calls[0][0].path).toBe('projects/p1');
  });

  it('still deletes a project whose board is not the open one', async () => {
    const store = storeWithImages();
    await store.dispatch(deleteProject('other'));
    expect(files.deleteFile).not.toHaveBeenCalled();
    expect(fs.deleteDoc.mock.calls[0][0].path).toBe('projects/other');
  });
});
