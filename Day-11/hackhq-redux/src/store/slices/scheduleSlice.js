import { createSlice } from '@reduxjs/toolkit';
import { toggleSaved } from '../../lib/schedule.js';

// Only the ids of saved sessions are stored; the sessions themselves are seed data.
const scheduleSlice = createSlice({
  name: 'schedule',
  initialState: { savedIds: [] },
  reducers: {
    sessionToggled(state, action) {
      state.savedIds = toggleSaved(state.savedIds, action.payload);
    },
  },
});

export const { sessionToggled } = scheduleSlice.actions;
export const selectSavedIds = (state) => state.schedule.savedIds;
export default scheduleSlice.reducer;
