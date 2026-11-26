import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchCurrentSession,
  normalizeApiError,
  registerNewAccount,
  signInWithEmail,
  signOutCurrentUser,
  startGithubOAuth,
  updateCharacterCustomization,
  type AuthPayload,
  type RegisterParams,
  type SignInParams,
  type UpdateCharacterParams,
} from '../../lib/api/authApi';
import type { ApiError, UserProfile } from '../../types/lms';

export type AuthStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AuthState {
  userId: string | null;
  email: string | null;
  profile: UserProfile | null;
  mode: 'supabase' | 'demo';
  status: AuthStatus;
  error: ApiError | null;
}

const initialState: AuthState = {
  userId: null,
  email: null,
  profile: null,
  mode: 'demo',
  status: 'idle',
  error: null,
};

export const hydrateAuth = createAsyncThunk<AuthPayload | null, void, { rejectValue: ApiError }>(
  'auth/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchCurrentSession();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'Could not load session'));
    }
  },
);

export const signInUser = createAsyncThunk<AuthPayload, SignInParams, { rejectValue: ApiError }>(
  'auth/signIn',
  async (params, { rejectWithValue }) => {
    try {
      return await signInWithEmail(params);
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'Sign-in failed'));
    }
  },
);

export const registerUser = createAsyncThunk<
  AuthPayload,
  RegisterParams,
  { rejectValue: ApiError }
>('auth/register', async (params, { rejectWithValue }) => {
  try {
    return await registerNewAccount(params);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error, 'Registration failed'));
  }
});

export const signInGithub = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  'auth/signInGithub',
  async (_, { rejectWithValue }) => {
    try {
      await startGithubOAuth();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'GitHub OAuth failed'));
    }
  },
);

export const saveCharacterProfile = createAsyncThunk<
  UserProfile,
  { userId: string; params: UpdateCharacterParams },
  { rejectValue: ApiError }
>('auth/saveCharacter', async ({ userId, params }, { rejectWithValue }) => {
  try {
    return await updateCharacterCustomization(userId, params);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error, 'Failed to save character'));
  }
});

export const signOutUser = createAsyncThunk<void, void, { rejectValue: ApiError }>(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await signOutCurrentUser();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error, 'Sign out failed'));
    }
  },
);

function applyAuthPayload(state: AuthState, payload: AuthPayload | null): void {
  if (!payload) {
    state.userId = null;
    state.email = null;
    state.profile = null;
    state.status = 'ready';
    state.error = null;
    return;
  }
  state.userId = payload.userId;
  state.email = payload.email;
  state.profile = payload.profile;
  state.mode = payload.mode;
  state.status = 'ready';
  state.error = null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSessionUser(
      state,
      action: PayloadAction<{ userId: string; email: string; profile: UserProfile | null }>,
    ) {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      state.profile = action.payload.profile;
      state.status = 'ready';
      state.error = null;
    },
    clearAuth(state) {
      state.userId = null;
      state.email = null;
      state.profile = null;
      state.status = 'ready';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        applyAuthPayload(state, action.payload);
      })
      .addCase(hydrateAuth.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? { code: 'auth_error', message: 'Session check failed' };
      })
      .addCase(signInUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        applyAuthPayload(state, action.payload);
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? { code: 'auth_error', message: 'Sign-in failed' };
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        applyAuthPayload(state, action.payload);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? { code: 'auth_error', message: 'Registration failed' };
      })
      .addCase(signInGithub.rejected, (state, action) => {
        state.error = action.payload ?? { code: 'oauth_error', message: 'GitHub OAuth failed' };
      })
      .addCase(saveCharacterProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(saveCharacterProfile.rejected, (state, action) => {
        state.error = action.payload ?? {
          code: 'profile_error',
          message: 'Failed to save character',
        };
      })
      .addCase(signOutUser.fulfilled, (state) => {
        applyAuthPayload(state, null);
      });
  },
});

export const { setSessionUser, clearAuth, clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
