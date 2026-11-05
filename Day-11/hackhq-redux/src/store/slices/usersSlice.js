import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { buildUserPostsUrl, buildUsersUrl } from '../../lib/api.js';

async function getJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText || 'Fetch failed'}`);
  }
  return response.json();
}

/**
 * Async thunk for the participants directory. RTK generates three actions from the type string:
 * users/fetchList/pending, /fulfilled and /rejected. The `signal` lets the caller abort a stale
 * request (the Directory aborts when the search text changes), replacing useFetch's AbortController.
 */
export const fetchUsers = createAsyncThunk('users/fetchList', async (params, { signal }) =>
  getJson(buildUsersUrl(params), signal)
);

export const fetchUserPosts = createAsyncThunk('users/fetchPosts', async (userId, { signal }) =>
  getJson(buildUserPostsUrl(userId), signal)
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: { status: 'idle', users: [], total: 0, error: null },
    posts: {}, // { [userId]: { status, posts, error } }
  },
  reducers: {},
  // extraReducers respond to actions defined elsewhere, here the thunk lifecycle actions
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.list.status = 'loading';
        state.list.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.users = action.payload.users ?? [];
        state.list.total = action.payload.total ?? state.list.users.length;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        if (action.meta.aborted) return; // superseded by a newer request; not an error
        state.list.status = 'failed';
        state.list.error = action.error.message;
      })
      .addCase(fetchUserPosts.pending, (state, action) => {
        state.posts[action.meta.arg] = { status: 'loading', posts: [], error: null };
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.posts[action.meta.arg] = {
          status: 'succeeded',
          posts: action.payload.posts ?? [],
          error: null,
        };
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.posts[action.meta.arg] = {
          status: 'failed',
          posts: [],
          error: action.error.message,
        };
      });
  },
});

export const selectUsersList = (state) => state.users.list;
export const selectUserPosts = (userId) => (state) => state.users.posts[userId];
export default usersSlice.reducer;
