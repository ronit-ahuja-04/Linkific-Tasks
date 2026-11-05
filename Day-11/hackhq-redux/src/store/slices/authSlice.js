import { createSlice } from '@reduxjs/toolkit';

// Demo organizer authentication state. Persisted so a refresh keeps you signed in.
const authSlice = createSlice({
  name: 'auth',
  initialState: { isOrganizer: false },
  reducers: {
    login(state) {
      state.isOrganizer = true;
    },
    logout(state) {
      state.isOrganizer = false;
    },
  },
});

export const { login, logout } = authSlice.actions;
export const selectIsOrganizer = (state) => state.auth.isOrganizer;
export default authSlice.reducer;
