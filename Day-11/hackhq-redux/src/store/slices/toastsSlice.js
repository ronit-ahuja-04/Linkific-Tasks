import { createSlice } from '@reduxjs/toolkit';
import { dropToastAction, registerToastAction } from '../toastActions.js';

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4500;

const toastsSlice = createSlice({
  name: 'toasts',
  initialState: { items: [] },
  reducers: {
    toastAdded(state, action) {
      state.items = [action.payload, ...state.items].slice(0, MAX_TOASTS);
    },
    toastDismissed(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toastAdded, toastDismissed } = toastsSlice.actions;
export const selectToasts = (state) => state.toasts.items;

/**
 * Thunk: the same signature the app has used since Day 5, notify(message, action, type).
 * `action` is { label, onClick }; only the label goes into the store.
 */
export const notify =
  (message, action = null, type = 'info') =>
  (dispatch) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    if (action) registerToastAction(id, action.onClick);
    dispatch(toastAdded({ id, message, type, actionLabel: action?.label ?? null }));
    setTimeout(() => {
      dropToastAction(id);
      dispatch(toastDismissed(id));
    }, AUTO_DISMISS_MS);
  };

export default toastsSlice.reducer;
