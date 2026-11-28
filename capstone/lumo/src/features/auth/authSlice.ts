import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authApi from '../../lib/api/auth';
import { toAppError } from '../../lib/errors';
import type { Profile } from '../../lib/types';

export type AuthStatus = 'checking' | 'signedOut' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  profile: Profile | null;
  busy: boolean;
  error: string | null;
  /** Set after sign-up when the server wants the email confirmed first. */
  notice: string | null;
}

const initialState: AuthState = {
  status: 'checking',
  profile: null,
  busy: false,
  error: null,
  notice: null,
};

const message = (error: unknown) => toAppError(error).message;

export const restoreSession = createAsyncThunk('auth/restore', () => authApi.currentProfile());

export const signIn = createAsyncThunk(
  'auth/signIn',
  ({ email, password }: { email: string; password: string }, { rejectWithValue }) =>
    authApi.signIn(email, password).catch((e: unknown) => rejectWithValue(message(e))),
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  (input: authApi.SignUpInput, { rejectWithValue }) =>
    authApi.signUp(input).catch((e: unknown) => rejectWithValue(message(e))),
);

export const signOut = createAsyncThunk('auth/signOut', () => authApi.signOut());

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    profileLoaded(state, action: { payload: Profile | null }) {
      state.profile = action.payload;
      state.status = action.payload ? 'signedIn' : 'signedOut';
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.status = action.payload ? 'signedIn' : 'signedOut';
      })
      .addCase(restoreSession.rejected, (state) => {
        state.profile = null;
        state.status = 'signedOut';
      });
    for (const thunk of [signIn, signUp]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.busy = true;
          state.error = null;
          state.notice = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.busy = false;
          if (action.payload) {
            state.profile = action.payload;
            state.status = 'signedIn';
          } else {
            state.notice = 'Check your email to confirm your account, then sign in.';
          }
        })
        .addCase(thunk.rejected, (state, action) => {
          state.busy = false;
          state.error =
            (action.payload as string | undefined) ?? 'Something went wrong. Please try again.';
        });
    }
    builder.addCase(signOut.fulfilled, (state) => {
      state.profile = null;
      state.status = 'signedOut';
    });
  },
});

export const { profileLoaded, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
