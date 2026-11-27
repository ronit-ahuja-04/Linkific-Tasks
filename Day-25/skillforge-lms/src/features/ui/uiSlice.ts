import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { setSfxEnabled } from '../../lib/game/sfx';

export type ThemeMode = 'light' | 'dark';

export interface ToastMessage {
  id: string;
  kind: 'info' | 'success' | 'error';
  text: string;
}

export interface UiState {
  theme: ThemeMode;
  soundEnabled: boolean;
  toasts: ToastMessage[];
}

const initialState: UiState = {
  theme: 'light',
  soundEnabled: true,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
      setSfxEnabled(state.soundEnabled);
    },
    pushToast(state, action: PayloadAction<ToastMessage>) {
      state.toasts.push(action.payload);
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { setTheme, toggleTheme, toggleSound, pushToast, dismissToast } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
