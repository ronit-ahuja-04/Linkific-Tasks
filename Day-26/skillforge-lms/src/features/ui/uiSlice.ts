import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { setSfxEnabled } from '../../lib/game/sfx';

const UI_PREFS_STORAGE_KEY = 'skillforge_ui_prefs_v1';

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

interface PersistedUiPrefs {
  theme?: ThemeMode;
  soundEnabled?: boolean;
}

function persistUiPrefs(state: Pick<UiState, 'theme' | 'soundEnabled'>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: PersistedUiPrefs = {
      theme: state.theme,
      soundEnabled: state.soundEnabled,
    };
    window.localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors in restricted contexts
  }
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
    hydrateUiPrefs(state) {
      if (typeof window === 'undefined') return;
      try {
        const raw = window.localStorage.getItem(UI_PREFS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as PersistedUiPrefs;
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          state.theme = parsed.theme;
        }
        if (typeof parsed.soundEnabled === 'boolean') {
          state.soundEnabled = parsed.soundEnabled;
          setSfxEnabled(state.soundEnabled);
        }
      } catch {
        // ignore invalid storage payloads
      }
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
      persistUiPrefs(state);
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      persistUiPrefs(state);
    },
    toggleSound(state) {
      state.soundEnabled = !state.soundEnabled;
      setSfxEnabled(state.soundEnabled);
      persistUiPrefs(state);
    },
    pushToast(state, action: PayloadAction<ToastMessage>) {
      state.toasts.push(action.payload);
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { hydrateUiPrefs, setTheme, toggleTheme, toggleSound, pushToast, dismissToast } =
  uiSlice.actions;
export const uiReducer = uiSlice.reducer;
