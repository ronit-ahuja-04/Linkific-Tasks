import { createSlice } from '@reduxjs/toolkit';

const lapsSlice = createSlice({
  name: 'laps',
  initialState: { items: [] },
  reducers: {
    lapAdded(state, action) {
      state.items.unshift(action.payload);
    },
    lapsCleared(state) {
      state.items = [];
    },
  },
});

export const { lapAdded, lapsCleared } = lapsSlice.actions;
export const selectLaps = (state) => state.laps.items;
export default lapsSlice.reducer;
