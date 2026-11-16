import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { notifyMembers } from '../../lib/notify';

const initialState = {
  items: [], // every notification of the signed-in user (newest first)
  toasts: [], // the ones that arrived while the app was open
  unreadMessages: 0,
  loaded: false, // false until the first snapshot, which must not pop toasts for old items
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // payload: { items, added } where `added` are the documents Firestore reports as new
    notificationsReceived(state, action) {
      const { items, added } = action.payload;
      state.items = items;
      if (state.loaded) state.toasts.push(...added);
      state.loaded = true;
    },
    unreadMessagesChanged(state, action) {
      state.unreadMessages = action.payload;
    },
    toastDismissed(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toastsCleared(state) {
      state.toasts = [];
    },
    notificationsReset: () => initialState,
  },
});

export const {
  notificationsReceived,
  unreadMessagesChanged,
  toastDismissed,
  toastsCleared,
  notificationsReset,
} = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectToasts = (state) => state.notifications.toasts;
export const selectUnreadMessages = (state) => state.notifications.unreadMessages;

export const dismissNotification = createAsyncThunk('notifications/dismiss', async (id, { extra }) => {
  const uid = extra.getUser()?.uid;
  if (!uid) return null;
  await deleteDoc(doc(db, 'users', uid, 'notifications', id));
  return id;
});

export const dismissAllNotifications = createAsyncThunk('notifications/dismissAll', async (_arg, { dispatch, getState }) => {
  for (const n of getState().notifications.items) await dispatch(dismissNotification(n.id));
});

export const clearUnreadMessages = createAsyncThunk('notifications/clearUnread', async (_arg, { getState, extra }) => {
  const state = getState();
  const uid = extra.getUser()?.uid;
  if (!uid || state.notifications.unreadMessages === 0) return;
  await updateDoc(doc(db, 'users', uid), { unreadMessages: 0 });
});

/** Notify every member of a project except the current user (used by chat and board changes) */
export const notifyProjectMembers = createAsyncThunk(
  'notifications/notifyProjectMembers',
  async ({ message, projectId }, { getState, extra }) => {
    const state = getState();
    const project = state.projects.items.find((p) => p.id === projectId);
    await notifyMembers(project?.members, { message, projectId, excludeUid: extra.getUser()?.uid });
  }
);

export default notificationsSlice.reducer;
