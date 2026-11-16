import { createSlice } from '@reduxjs/toolkit';

// { byId: { [uid]: { id, uid, email, displayName, photoURL, ... } } }, kept live by a Firestore listener
const usersSlice = createSlice({
  name: 'users',
  initialState: { byId: {} },
  reducers: {
    usersReceived(state, action) {
      state.byId = action.payload;
    },
  },
});

export const { usersReceived } = usersSlice.actions;
export const selectUsersById = (state) => state.users.byId;
export const selectUserByEmail = (email) => (state) => {
  const target = (email ?? '').trim().toLowerCase();
  return Object.values(state.users.byId).find((u) => u.email?.toLowerCase() === target) ?? null;
};
export default usersSlice.reducer;
