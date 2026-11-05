import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('firebase/auth', async () => (await import('./mocks/auth.js')).authMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, auth: {}, googleProvider: {}, isFirebaseConfigured: true }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { loadedStore } from './mocks/setup.js';
import { makeStore } from '../src/store/index.js';
import { authStateChanged } from '../src/store/slices/authSlice.js';
import {
  createProject, deleteProject, ensureDefaultProject, projectsReceived, projectsReset, selectProjects,
  selectProjectsLoading, makeSelectProject,
} from '../src/store/slices/projectsSlice.js';
import { acceptInvite, declineInvite, invitationsReceived, selectInvitations, sendInvite } from '../src/store/slices/invitationsSlice.js';
import {
  clearUnreadMessages, dismissAllNotifications, dismissNotification, notificationsReceived, notificationsReset,
  notifyProjectMembers, selectNotifications, selectToasts, selectUnreadMessages, toastDismissed, toastsCleared,
  unreadMessagesChanged,
} from '../src/store/slices/notificationsSlice.js';
import {
  activityFlagged, errorDismissed, errorShown, modalClosed, modalOpened, selectActiveTab, selectErrorMessage,
  selectHasNewActivity, selectModals, selectSuccessMessage, successDismissed, successShown, tabChanged,
  taskPanelClosed, taskPanelOpened, selectTaskPanel,
} from '../src/store/slices/uiSlice.js';
import { errorMessageOf, toPlain } from '../src/lib/serialize.js';

beforeEach(() => {
  resetFirestoreMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('projects slice', () => {
  it('is loading until the first snapshot', () => {
    const store = makeStore();
    expect(selectProjectsLoading(store.getState())).toBe(true);
    store.dispatch(projectsReceived([]));
    expect(selectProjectsLoading(store.getState())).toBe(false);
    store.dispatch(projectsReset());
    expect(selectProjectsLoading(store.getState())).toBe(true);
  });

  it('creates a project owned by the current user with an empty board', async () => {
    const store = loadedStore();
    const { id } = await store.dispatch(createProject({ name: 'Alpha' })).unwrap();
    const [ref, data] = fs.setDoc.mock.calls[0];
    expect(ref.path).toBe(`projects/${id}`);
    expect(data).toMatchObject({ name: 'Alpha', owner: 'u1', members: ['u1'], columnOrder: ['todo', 'inprogress', 'done'] });
    expect(fs.setDoc).toHaveBeenCalledOnce(); // no notification: the creator is the owner
  });

  it('assigns another owner by email, adds both as members and notifies the new owner', async () => {
    const store = loadedStore();
    await store.dispatch(createProject({ name: 'Beta', ownerEmail: ' BOB@x.com ' })).unwrap();
    const [, data] = fs.setDoc.mock.calls[0];
    expect(data.owner).toBe('u2');
    expect(data.members).toEqual(['u1', 'u2']);
    const [notifRef, notif] = fs.setDoc.mock.calls[1];
    expect(notifRef.path).toMatch(/^users\/u2\/notifications\//);
    expect(notif.message).toBe('Ann created project "Beta" and assigned you as the owner.');
  });

  it('rejects with a readable message for an unknown owner email or no user', async () => {
    const store = loadedStore();
    await expect(store.dispatch(createProject({ name: 'X', ownerEmail: 'nobody@x.com' })).unwrap()).rejects.toBe(
      'Could not find a user with that email in the system.'
    );
    expect(fs.setDoc).not.toHaveBeenCalled();
    await expect(makeStore().dispatch(createProject({ name: 'X' })).unwrap()).rejects.toContain('signed in');
  });

  it('creates the default project only once, however many empty snapshots arrive', async () => {
    const store = makeStore();
    store.dispatch(authStateChanged({ uid: 'u1', email: 'ann@x.com' }));
    await store.dispatch(ensureDefaultProject());
    const second = await store.dispatch(ensureDefaultProject());
    expect(second.meta.condition).toBe(true); // skipped by `condition`
    expect(fs.setDoc).toHaveBeenCalledOnce();
    expect(fs.setDoc.mock.calls[0][1].name).toBe('My First Project');
  });

  it('deletes a project and finds one with a selector factory', async () => {
    const store = loadedStore();
    expect(makeSelectProject('p1')(store.getState()).name).toBe('Project');
    expect(makeSelectProject('zzz')(store.getState())).toBeNull();
    await store.dispatch(deleteProject('p1'));
    expect(fs.deleteDoc.mock.calls[0][0].path).toBe('projects/p1');
    store.dispatch(projectsReceived([]));
    expect(selectProjects(store.getState())).toEqual([]);
  });
});

describe('invitations slice', () => {
  const found = (user) => ({ empty: !user, docs: user ? [{ data: () => user }] : [] });

  it('sends an invitation to an existing user', async () => {
    fs.getDocs.mockResolvedValue(found({ uid: 'u3', displayName: 'Cy', email: 'cy@x.com' }));
    const store = loadedStore();
    const result = await store.dispatch(sendInvite({ email: 'cy@x.com', projectId: 'p1' })).unwrap();
    expect(result).toEqual({ displayName: 'Cy' });
    const [ref, data] = fs.setDoc.mock.calls[0];
    expect(ref.path).toMatch(/^invitations\//);
    expect(data).toMatchObject({ projectId: 'p1', projectName: 'Project', inviterName: 'Ann', inviteeEmail: 'cy@x.com', inviteeUid: 'u3' });
  });

  it('explains why an invite cannot be sent', async () => {
    const store = loadedStore();
    fs.getDocs.mockResolvedValue(found(null));
    await expect(store.dispatch(sendInvite({ email: 'no@x.com', projectId: 'p1' })).unwrap()).rejects.toContain('No user found');
    fs.getDocs.mockResolvedValue(found({ uid: 'u2', displayName: 'Bob' }));
    await expect(store.dispatch(sendInvite({ email: 'bob@x.com', projectId: 'p1' })).unwrap()).rejects.toBe('Bob is already in this project!');
    fs.getDocs.mockRejectedValue(new Error('offline'));
    await expect(store.dispatch(sendInvite({ email: 'x@x.com', projectId: 'p1' })).unwrap()).rejects.toBe('An error occurred while sending the invite.');
    await expect(store.dispatch(sendInvite({ email: 'x@x.com', projectId: 'nope' })).unwrap()).rejects.toContain('error occurred');
  });

  it('accepting adds you to the project, removes the invitation and tells the other members', async () => {
    fs.getDoc.mockResolvedValue({ data: () => ({ members: ['u1', 'u2', 'u9'] }) });
    const store = loadedStore();
    store.dispatch(authStateChanged({ uid: 'u9', email: 'new@x.com', displayName: 'Nia' }));
    const invite = { id: 'inv1', projectId: 'p1', projectName: 'Project' };
    const result = await store.dispatch(acceptInvite(invite)).unwrap();
    expect(result).toEqual({ projectName: 'Project' });
    expect(fs.updateDoc.mock.calls[0][0].path).toBe('projects/p1');
    expect(fs.updateDoc.mock.calls[0][1]).toEqual({ members: { arrayUnion: ['u9'] } });
    expect(fs.deleteDoc.mock.calls[0][0].path).toBe('invitations/inv1');
    expect(fs.setDoc).toHaveBeenCalledTimes(2); // u1 and u2, not the joiner
    expect(fs.setDoc.mock.calls[0][1].message).toBe('Nia joined project "Project"');
  });

  it('still succeeds if telling the others fails, but fails if joining fails', async () => {
    const store = loadedStore();
    fs.getDoc.mockRejectedValue(new Error('offline'));
    await expect(store.dispatch(acceptInvite({ id: 'i', projectId: 'p1', projectName: 'P' })).unwrap()).resolves.toEqual({ projectName: 'P' });
    fs.updateDoc.mockRejectedValueOnce(new Error('denied'));
    await expect(store.dispatch(acceptInvite({ id: 'i', projectId: 'p1', projectName: 'P' })).unwrap()).rejects.toBe('Failed to join project.');
  });

  it('declines an invitation and stores received ones', async () => {
    const store = loadedStore();
    store.dispatch(invitationsReceived([{ id: 'inv1' }]));
    expect(selectInvitations(store.getState())).toHaveLength(1);
    await store.dispatch(declineInvite('inv1'));
    expect(fs.deleteDoc.mock.calls[0][0].path).toBe('invitations/inv1');
  });
});

describe('notifications slice', () => {
  const n = (id) => ({ id: String(id), message: `m${id}`, createdAt: 1 });

  it('does not toast the notifications that already exist when the app opens', () => {
    const store = makeStore();
    store.dispatch(notificationsReceived({ items: [n(1), n(2)], added: [n(1), n(2)] }));
    expect(selectNotifications(store.getState())).toHaveLength(2);
    expect(selectToasts(store.getState())).toEqual([]);
  });

  it('toasts new notifications that arrive later, and dismisses them', () => {
    const store = makeStore();
    store.dispatch(notificationsReceived({ items: [n(1)], added: [n(1)] }));
    store.dispatch(notificationsReceived({ items: [n(2), n(1)], added: [n(2)] }));
    expect(selectToasts(store.getState()).map((t) => t.id)).toEqual(['2']);
    store.dispatch(notificationsReceived({ items: [n(3), n(2), n(1)], added: [n(3)] }));
    store.dispatch(toastDismissed('2'));
    expect(selectToasts(store.getState()).map((t) => t.id)).toEqual(['3']);
    store.dispatch(toastsCleared());
    expect(selectToasts(store.getState())).toEqual([]);
  });

  it('resets everything on sign-out so the next user starts clean', () => {
    const store = makeStore();
    store.dispatch(notificationsReceived({ items: [n(1)], added: [] }));
    store.dispatch(unreadMessagesChanged(4));
    store.dispatch(notificationsReset());
    expect(selectNotifications(store.getState())).toEqual([]);
    expect(selectUnreadMessages(store.getState())).toBe(0);
    store.dispatch(notificationsReceived({ items: [n(1)], added: [n(1)] }));
    expect(selectToasts(store.getState())).toEqual([]); // first snapshot again
  });

  it('dismisses one or all notifications by deleting the documents', async () => {
    const store = loadedStore();
    store.dispatch(notificationsReceived({ items: [n(1), n(2)], added: [] }));
    await store.dispatch(dismissNotification('1'));
    expect(fs.deleteDoc.mock.calls[0][0].path).toBe('users/u1/notifications/1');
    fs.deleteDoc.mockClear();
    await store.dispatch(dismissAllNotifications());
    expect(fs.deleteDoc).toHaveBeenCalledTimes(2);
    fs.deleteDoc.mockClear();
    await makeStore().dispatch(dismissNotification('1')); // signed out: nothing to do
    expect(fs.deleteDoc).not.toHaveBeenCalled();
  });

  it('clears the unread message badge only when there is one', async () => {
    const store = loadedStore();
    await store.dispatch(clearUnreadMessages());
    expect(fs.updateDoc).not.toHaveBeenCalled();
    store.dispatch(unreadMessagesChanged(3));
    await store.dispatch(clearUnreadMessages());
    expect(fs.updateDoc.mock.calls[0]).toEqual([expect.objectContaining({ path: 'users/u1' }), { unreadMessages: 0 }]);
  });

  it('notifies every project member except yourself', async () => {
    const store = loadedStore();
    await store.dispatch(notifyProjectMembers({ message: 'hi', projectId: 'p1' }));
    expect(fs.setDoc).toHaveBeenCalledOnce();
    expect(fs.setDoc.mock.calls[0][0].path).toMatch(/^users\/u2\/notifications\//);
  });
});

describe('ui slice', () => {
  it('switching to the activity tab clears the new-activity dot', () => {
    const store = makeStore();
    store.dispatch(activityFlagged(true));
    store.dispatch(tabChanged('board'));
    expect(selectHasNewActivity(store.getState())).toBe(true);
    store.dispatch(tabChanged('activity'));
    expect(selectActiveTab(store.getState())).toBe('activity');
    expect(selectHasNewActivity(store.getState())).toBe(false);
  });

  it('opens and closes modals independently and shows feedback messages', () => {
    const store = makeStore();
    store.dispatch(modalOpened('newProject'));
    store.dispatch(modalOpened('invite'));
    store.dispatch(modalClosed('invite'));
    expect(selectModals(store.getState())).toEqual({ newProject: true, deleteProject: false, invite: false });
    store.dispatch(errorShown('Oops'));
    store.dispatch(successShown('Yay'));
    expect([selectErrorMessage(store.getState()), selectSuccessMessage(store.getState())]).toEqual(['Oops', 'Yay']);
    store.dispatch(errorDismissed());
    store.dispatch(successDismissed());
    expect([selectErrorMessage(store.getState()), selectSuccessMessage(store.getState())]).toEqual(['', '']);
  });

  it('opens and closes the task panel', () => {
    const store = makeStore();
    store.dispatch(taskPanelOpened({ id: 'x' }));
    expect(selectTaskPanel(store.getState())).toEqual({ open: true, task: { id: 'x' } });
    store.dispatch(taskPanelClosed());
    expect(selectTaskPanel(store.getState()).open).toBe(false);
  });
});

describe('serialization helpers', () => {
  it('turns Firestore timestamps into numbers, deeply, so the state stays serializable', () => {
    const ts = { toMillis: () => 1234 };
    const plain = toPlain({ a: ts, list: [ts, { b: ts }], keep: 'x', none: null, undef: undefined });
    expect(plain).toEqual({ a: 1234, list: [1234, { b: 1234 }], keep: 'x', none: null, undef: null });
    expect(() => JSON.stringify(plain)).not.toThrow();
  });

  it('extracts a message from a string (rejectWithValue) or an error object', () => {
    expect(errorMessageOf('plain text')).toBe('plain text');
    expect(errorMessageOf(new Error('boom'))).toBe('boom');
    expect(errorMessageOf({}, 'fallback')).toBe('fallback');
  });
});
