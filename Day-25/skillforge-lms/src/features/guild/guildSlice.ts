import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeApiError } from '../../lib/api/authApi';
import { fetchGuildBoard } from '../../lib/api/guildApi';
import type { ApiError, GuildEntry, UserProfile } from '../../types/lms';

export interface GuildState {
  entries: GuildEntry[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: ApiError | null;
}

const initialState: GuildState = {
  entries: [],
  status: 'idle',
  error: null,
};

export const fetchGuildLeaderboard = createAsyncThunk<
  GuildEntry[],
  UserProfile | null | undefined,
  { rejectValue: ApiError }
>('guild/fetchBoard', async (activeDemoProfile, { rejectWithValue }) => {
  try {
    return await fetchGuildBoard(activeDemoProfile);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error, 'Failed to load Guild Hall'));
  }
});

const guildSlice = createSlice({
  name: 'guild',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuildLeaderboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGuildLeaderboard.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.status = 'ready';
      })
      .addCase(fetchGuildLeaderboard.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? {
          code: 'guild_error',
          message: 'Could not load Guild Hall',
        };
      });
  },
});

export const guildReducer = guildSlice.reducer;
