import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../lib/firebase';

// Firebase's user object is a big class instance and must NOT go into Redux. Only these plain
// fields are kept.
export const toPlainUser = (user) =>
  user
    ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
      }
    : null;

const NOT_CONFIGURED = 'Firebase keys are required. Add them to .env (see .env.example).';

// A small helper so the three sign-in thunks share error handling:
// success returns null (nothing to store: onAuthStateChanged reports the user), failure is a
// readable message that ends up in state.auth.error via rejectWithValue.
const guarded = (action) => async (arg, { rejectWithValue }) => {
  if (!isFirebaseConfigured) return rejectWithValue(NOT_CONFIGURED);
  try {
    await action(arg);
    return null;
  } catch (err) {
    return rejectWithValue(err.message || 'Authentication failed');
  }
};

export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  guarded(({ email, password }) => signInWithEmailAndPassword(auth, email, password))
);

export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  guarded(({ email, password }) => createUserWithEmailAndPassword(auth, email, password))
);

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  guarded(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // The OAuth token is needed by the Google Calendar sync component
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) localStorage.setItem('googleAccessToken', credential.accessToken);
  })
);

export const signOutUser = createAsyncThunk('auth/signOut', async () => {
  await signOut(auth);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    // 'loading' until Firebase reports once, then 'authenticated' or 'unauthenticated'
    status: 'loading',
    busy: false, // a sign-in request is in flight
    error: null,
  },
  reducers: {
    authStateChanged: {
      prepare: (firebaseUser) => ({ payload: toPlainUser(firebaseUser) }),
      reducer(state, action) {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'unauthenticated';
      },
    },
    authErrorCleared(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [signInWithEmail, signUpWithEmail, signInWithGoogle]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.busy = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state) => {
          state.busy = false;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.busy = false;
          state.error = action.payload ?? action.error.message ?? 'Authentication failed';
        });
    }
  },
});

export const { authStateChanged, authErrorCleared } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectUid = (state) => state.auth.user?.uid ?? null;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthBusy = (state) => state.auth.busy;
export const selectAuthError = (state) => state.auth.error;
export default authSlice.reducer;
