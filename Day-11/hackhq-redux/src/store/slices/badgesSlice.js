import { createSlice } from '@reduxjs/toolkit';

// { earned: { [badgeId]: timestamp } }. Persisted under 'hackhq_badges'.
// Badges are awarded by the listener middleware in ../middleware.js, never by a component.
const badgesSlice = createSlice({
  name: 'badges',
  initialState: { earned: {} },
  reducers: {
    badgeEarned: {
      prepare: (id) => ({ payload: { id, at: Date.now() } }),
      reducer(state, action) {
        const { id, at } = action.payload;
        if (!state.earned[id]) state.earned[id] = at;
      },
    },
    badgesReset(state) {
      state.earned = {};
    },
  },
});

export const { badgeEarned, badgesReset } = badgesSlice.actions;
export const selectEarnedBadges = (state) => state.badges.earned;
export default badgesSlice.reducer;
