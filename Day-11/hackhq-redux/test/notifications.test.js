import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeStore } from '../src/store/index.js';
import {
  allNotificationsRead,
  notificationRead,
  notificationsCleared,
  selectNotifications,
  selectUnreadNotificationCount,
} from '../src/store/slices/notificationsSlice.js';
import { notify, selectToasts, toastDismissed } from '../src/store/slices/toastsSlice.js';

afterEach(() => vi.useRealTimers());

describe('notifications centre', () => {
  it('keeps every toast in the history after the toast itself is gone', () => {
    vi.useFakeTimers();
    const store = makeStore();
    store.dispatch(notify('Saved', null, 'success'));
    store.dispatch(toastDismissed(selectToasts(store.getState())[0].id));
    expect(selectToasts(store.getState())).toEqual([]);
    expect(selectNotifications(store.getState())).toHaveLength(1);
    expect(selectNotifications(store.getState())[0]).toMatchObject({
      message: 'Saved',
      type: 'success',
      read: false,
    });
  });

  it('counts unread and marks one or all as read', () => {
    vi.useFakeTimers();
    const store = makeStore();
    store.dispatch(notify('a'));
    store.dispatch(notify('b'));
    store.dispatch(notify('c'));
    expect(selectUnreadNotificationCount(store.getState())).toBe(3);
    store.dispatch(notificationRead(selectNotifications(store.getState())[0].id));
    expect(selectUnreadNotificationCount(store.getState())).toBe(2);
    store.dispatch(allNotificationsRead());
    expect(selectUnreadNotificationCount(store.getState())).toBe(0);
  });

  it('puts newest first, caps at 50 and clears', () => {
    vi.useFakeTimers();
    const store = makeStore();
    for (let i = 0; i < 55; i++) store.dispatch(notify(`n${i}`));
    const items = selectNotifications(store.getState());
    expect(items).toHaveLength(50);
    expect(items[0].message).toBe('n54');
    store.dispatch(notificationsCleared());
    expect(selectNotifications(store.getState())).toEqual([]);
  });

  it('is not affected by the toast cap of 3', () => {
    vi.useFakeTimers();
    const store = makeStore();
    for (let i = 0; i < 5; i++) store.dispatch(notify(`n${i}`));
    expect(selectToasts(store.getState())).toHaveLength(3);
    expect(selectNotifications(store.getState())).toHaveLength(5);
  });
});
