// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true, storage: {} }));
const h = vi.hoisted(() => ({ uploadFile: vi.fn(), deleteFile: vi.fn(), auth: {} }));
vi.mock('../src/lib/storage', async (importOriginal) => ({
  ...(await importOriginal()),
  uploadFile: (...a) => h.uploadFile(...a),
  deleteFile: (...a) => h.deleteFile(...a),
}));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => h.auth }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { loadedStore, task } from './mocks/setup.js';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import TaskAttachments from '../src/components/TaskAttachments.jsx';
import { boardReceived } from '../src/store/slices/boardSlice.js';
import { makeEmptyBoard } from '../src/lib/board.js';

const pic = (n) => ({ id: `${n}.png`, name: `${n}.png`, url: `https://files/${n}`, path: `projects/p1/tasks/t1/${n}.png`, size: 2048, contentType: 'image/png', by: 'u1', createdAt: 1 });
const png = (name = 'new.png', over = {}) => new File([new Uint8Array(100)], name, { type: 'image/png', ...over });

function setup({ attachments = [], canEdit = true, draft = false } = {}) {
  const store = loadedStore();
  const board = makeEmptyBoard();
  board.tasks = { t1: task('t1', { attachments }) };
  board.columns.todo.taskIds = ['t1'];
  store.dispatch(boardReceived({ projectId: 'p1', ...board }));
  const t1 = { ...store.getState().board.tasks.t1, ...(draft ? { _isDraft: true } : {}) };
  const view = render(
    <Provider store={store}>
      <LanguageProvider><ToastProvider><TaskAttachments task={t1} projectId="p1" canEdit={canEdit} /></ToastProvider></LanguageProvider>
    </Provider>,
  );
  return { store, user: userEvent.setup({ applyAccept: false }), ...view };
}
const chooser = () => screen.getByLabelText('Choose an image to attach');

beforeEach(() => {
  localStorage.clear();
  resetFirestoreMock();
  h.auth = { user: { uid: 'u1' } };
  h.deleteFile.mockReset().mockResolvedValue();
  h.uploadFile.mockReset().mockImplementation(async (path, file) => ({ url: `https://files/${file.name}`, path, name: file.name, size: file.size, contentType: file.type }));
});
afterEach(cleanup);

describe('TaskAttachments', () => {
  it('says there are no images yet', () => {
    setup();
    expect(screen.getByText('No images yet.')).toBeTruthy();
  });

  it('lists each image as a link to the full picture, with its name and size', () => {
    setup({ attachments: [pic('a'), pic('b')] });
    const items = screen.getAllByTestId('attachment');
    expect(items).toHaveLength(2);
    const link = within(items[0]).getByRole('link', { name: 'Open a.png in a new tab' });
    expect(link.getAttribute('href')).toBe('https://files/a');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(within(items[0]).getByRole('img', { name: 'Attached image: a.png' })).toBeTruthy();
    expect(within(items[0]).getByText('2 KB')).toBeTruthy();
  });

  it('never renders an image or link for a non-http URL', () => {
    setup({ attachments: [{ ...pic('x'), url: 'javascript:alert(1)' }] });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('uploads a chosen image into the task and shows it', async () => {
    const { user, store } = setup();
    await user.upload(chooser(), png());
    await waitFor(() => expect(screen.getAllByTestId('attachment')).toHaveLength(1));
    expect(h.uploadFile.mock.calls[0][0]).toMatch(/^projects\/p1\/tasks\/t1\/[0-9a-f-]{8}-new\.png$/);
    expect(store.getState().board.tasks.t1.attachments[0]).toMatchObject({ name: 'new.png', by: 'u1' });
    expect(fs.updateDoc.mock.calls[0][1]['tasks.t1.attachments'].arrayUnion).toHaveLength(1);
  });

  it('uploads several images at once', async () => {
    const { user } = setup();
    await user.upload(chooser(), [png('one.png'), png('two.png')]);
    await waitFor(() => expect(screen.getAllByTestId('attachment')).toHaveLength(2));
  });

  it('shows progress for an upload in flight', async () => {
    let finish;
    h.uploadFile.mockImplementation((path, file, onProgress) => new Promise((resolve) => { onProgress(60); finish = () => resolve({ url: 'https://f/x', path, name: file.name, size: 1, contentType: 'image/png' }); }));
    const { user } = setup();
    await user.upload(chooser(), png());
    expect((await screen.findByRole('progressbar')).getAttribute('aria-valuenow')).toBe('60');
    expect(screen.getByText('Uploading new.png... 60%')).toBeTruthy();
    finish();
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
  });

  it('refuses a file that is not an image, and one that is too big, and uploads nothing', async () => {
    const { user } = setup();
    await user.upload(chooser(), png('doc.pdf', { type: 'application/pdf' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Choose a PNG, JPEG, GIF or WebP image.');
    await user.upload(chooser(), new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('That image is too big. The limit is 5.0 MB.'));
    expect(h.uploadFile).not.toHaveBeenCalled();
  });

  it('deletes the uploaded file again when the task entry cannot be saved', async () => {
    fs.updateDoc.mockRejectedValue(new Error('offline'));
    const { user } = setup();
    await user.upload(chooser(), png());
    await waitFor(() => expect(h.deleteFile).toHaveBeenCalledOnce());
    expect(h.deleteFile.mock.calls[0][0]).toMatch(/new\.png$/);
    expect(screen.queryByTestId('attachment')).toBeNull();
    expect((await screen.findByRole('alert')).textContent).toMatch(/went wrong/);
  });

  it('explains a Storage refusal', async () => {
    h.uploadFile.mockRejectedValue({ code: 'storage/unauthorized' });
    const { user } = setup();
    await user.upload(chooser(), png());
    expect((await screen.findByRole('alert')).textContent).toMatch(/not allowed/);
  });

  it('stops at six images and disables the button', async () => {
    const { user } = setup({ attachments: ['a', 'b', 'c', 'd', 'e'].map(pic) });
    await user.upload(chooser(), [png('one.png'), png('two.png')]);
    await waitFor(() => expect(screen.getAllByTestId('attachment')).toHaveLength(6));
    expect(h.uploadFile).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert').textContent).toBe('A task can hold 6 images. Remove one to add another.');
    expect(screen.getByRole('button', { name: 'Add image' }).disabled).toBe(true);
  });

  it('removes an image: the entry and then the file', async () => {
    const { user, store } = setup({ attachments: [pic('a'), pic('b')] });
    await user.click(screen.getByRole('button', { name: 'Remove a.png' }));
    await waitFor(() => expect(screen.getAllByTestId('attachment')).toHaveLength(1));
    expect(store.getState().board.tasks.t1.attachments.map((a) => a.id)).toEqual(['b.png']);
    expect(h.deleteFile).toHaveBeenCalledWith(pic('a').path);
  });

  it('is read only for people who cannot edit the task', () => {
    setup({ attachments: [pic('a')], canEdit: false });
    expect(screen.getAllByTestId('attachment')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Add image' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove a.png' })).toBeNull();
  });

  it('asks for the task to be created first when it is still a draft', () => {
    setup({ draft: true });
    expect(screen.getByText('Create the task first, then you can add images.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add image' })).toBeNull();
  });

  it('picks up an image a teammate adds, without a refresh', async () => {
    const { store } = setup();
    expect(screen.queryByTestId('attachment')).toBeNull();
    const board = makeEmptyBoard();
    board.tasks = { t1: task('t1', { attachments: [pic('z')] }) };
    board.columns.todo.taskIds = ['t1'];
    store.dispatch(boardReceived({ projectId: 'p1', ...board }));
    expect(await screen.findByTestId('attachment')).toBeTruthy();
  });
});
