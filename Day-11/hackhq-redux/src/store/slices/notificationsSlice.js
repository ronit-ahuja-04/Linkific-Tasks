import { createSelector, createSlice } from '@reduxjs/toolkit';

const MAX_NOTIFICATIONS = 50;

// Persistent history of everything that was ever shown as a toast. Toasts disappear after a few
// seconds; notifications stay until the user clears them. Persisted under 'hackhq_notifications'.
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [] },
  reducers: {
    notificationAdded(state, action) {
      state.items = [{ read: false, ...action.payload }, ...state.items].slice(
        0,
        MAX_NOTIFICATIONS
      );
    },
    notificationRead(state, action) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    allNotificationsRead(state) {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
    notificationsCleared(state) {
      state.items = [];
    },
  },
});

export const { notificationAdded, notificationRead, allNotificationsRead, notificationsCleared } =
  notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadNotificationCount = createSelector(
  selectNotifications,
  (items) => items.filter((n) => !n.read).length
);
export default notificationsSlice.reducer;
