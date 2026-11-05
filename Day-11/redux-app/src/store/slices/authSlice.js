import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API } from '../../lib/api.js';

/**
 * Async thunk: logs in against DummyJSON. createAsyncThunk dispatches
 *   auth/login/pending -> then fulfilled (with the returned value) or rejected (error)
 * `rejectWithValue` lets the server's own message ("Invalid credentials") become the payload.
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue, signal }) => {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 60 }),
      signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return rejectWithValue(data.message || 'Login failed');
    return data;
  }
);

// status: 'idle' | 'loading' | 'succeeded' | 'failed'. `user` and `token` are persisted.
export const authInitialState = { user: null, token: null, status: 'idle', error: null };

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    logout() {
      return authInitialState; // returning a new value replaces the whole slice state
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { accessToken, id, username, email, firstName, lastName, image } = action.payload;
        state.status = 'succeeded';
        state.token = accessToken;
        state.user = { id, username, email, firstName, lastName, image };
      })
      .addCase(loginUser.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = 'failed';
        // payload = server message from rejectWithValue; error.message = network failure
        state.error = action.payload ?? action.error.message ?? 'Login failed';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectIsLoggedIn = (state) => Boolean(state.auth.token);
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export default authSlice.reducer;
