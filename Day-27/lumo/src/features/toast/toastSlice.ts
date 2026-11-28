import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

/** Short confirmations and failures ("Lesson saved", "Couldn't upload"). Shown by <Toaster>, read by screen readers. */
export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: [] as Toast[],
  reducers: {
    toastAdded: {
      reducer(state, action: PayloadAction<Toast>) {
        state.push(action.payload);
        // Never pile up: keep the newest three.
        if (state.length > 3) state.splice(0, state.length - 3);
      },
      prepare(tone: ToastTone, message: string) {
        return { payload: { id: nanoid(), tone, message } };
      },
    },
    toastDismissed(state, action: PayloadAction<string>) {
      return state.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toastAdded, toastDismissed } = toastSlice.actions;
export default toastSlice.reducer;
