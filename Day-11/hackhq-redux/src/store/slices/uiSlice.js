import { createSlice } from '@reduxjs/toolkit';

// Not persisted: the State X-ray inspector resets on reload.
const uiSlice = createSlice({
  name: 'ui',
  initialState: { xrayOn: false },
  reducers: {
    toggleXray(state) {
      state.xrayOn = !state.xrayOn;
    },
  },
});

export const { toggleXray } = uiSlice.actions;
export const selectXrayOn = (state) => state.ui.xrayOn;
export default uiSlice.reducer;
