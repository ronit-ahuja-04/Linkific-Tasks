import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const readStoredTheme = () => {
  try {
    return localStorage.getItem('theme') || 'light';
  } catch {
    return 'light';
  }
};
const storeTheme = (mode) => {
  try {
    localStorage.setItem('theme', mode);
  } catch {
    /* storage blocked: ignore */
  }
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: readStoredTheme() },
  reducers: {
    themeSet(state, action) {
      state.mode = action.payload === 'dark' ? 'dark' : 'light';
    },
  },
});

export const { themeSet } = themeSlice.actions;
export const selectTheme = (state) => state.theme.mode;

/** Toggle, remember it locally, and save it on the user's profile (best effort) */
export const toggleTheme = createAsyncThunk('theme/toggle', async (_arg, { dispatch, getState }) => {
  const next = selectTheme(getState()) === 'light' ? 'dark' : 'light';
  dispatch(themeSet(next));
  storeTheme(next);
  const uid = getState().auth.user?.uid;
  if (uid) {
    try {
      await updateDoc(doc(db, 'users', uid), { theme: next });
    } catch (err) {
      console.error('Failed to save theme', err);
    }
  }
  return next;
});

/** On login, apply the theme saved on the user's profile */
export const loadUserTheme = createAsyncThunk('theme/loadUserTheme', async (uid, { dispatch }) => {
  const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));
  const saved = snap.empty ? null : snap.docs[0].data().theme;
  if (saved) {
    dispatch(themeSet(saved));
    storeTheme(saved);
  }
  return saved ?? null;
});

export default themeSlice.reducer;
