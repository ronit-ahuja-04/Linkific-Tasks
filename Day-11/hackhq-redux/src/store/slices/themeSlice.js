import { createSlice } from '@reduxjs/toolkit';

const prefersDark =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

// Persisted under 'hackhq_theme' (see persist.js); falls back to the OS preference
export const themeInitialState = { mode: prefersDark ? 'dark' : 'light' };

const themeSlice = createSlice({
  name: 'theme',
  initialState: themeInitialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
    setTheme(state, action) {
      state.mode = action.payload === 'dark' ? 'dark' : 'light';
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export const selectThemeMode = (state) => state.theme.mode;
export default themeSlice.reducer;
