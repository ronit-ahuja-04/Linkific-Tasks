import { createSlice } from '@reduxjs/toolkit';

const MAX_ENTRIES = 100;

// Live log of dispatched actions, written by the activityLogger middleware. Not persisted.
const activitySlice = createSlice({
  name: 'activity',
  initialState: { items: [] },
  reducers: {
    activityLogged(state, action) {
      state.items = [action.payload, ...state.items].slice(0, MAX_ENTRIES);
    },
    activityCleared(state) {
      state.items = [];
    },
  },
});

export const { activityLogged, activityCleared } = activitySlice.actions;
export const selectActivity = (state) => state.activity.items;
export default activitySlice.reducer;
