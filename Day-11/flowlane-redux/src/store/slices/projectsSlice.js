import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { makeEmptyBoard } from '../../lib/board';
import { sendNotification } from '../../lib/notify';
import { userLabel } from '../../lib/serialize';
import { selectUserByEmail } from './usersSlice';

/**
 * Create a project. Both the creator and the chosen owner become members. Returns { id, name }
 * so the component can navigate to the new project after `.unwrap()`.
 */
export const createProject = createAsyncThunk(
  'projects/create',
  async ({ name, ownerEmail = '' }, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    if (!user) return rejectWithValue('You must be signed in to create a project.');

    let ownerUid = user.uid;
    if (ownerEmail.trim()) {
      const owner = selectUserByEmail(ownerEmail)(getState());
      if (!owner) return rejectWithValue('Could not find a user with that email in the system.');
      ownerUid = owner.uid ?? owner.id;
    }

    const ref = doc(collection(db, 'projects'));
    await setDoc(ref, {
      name,
      owner: ownerUid,
      members: [...new Set([user.uid, ownerUid])],
      ...makeEmptyBoard(),
    });

    if (ownerUid !== user.uid) {
      await sendNotification(ownerUid, {
        message: `${userLabel(user)} created project "${name}" and assigned you as the owner.`,
        projectId: ref.id,
      });
    }
    return { id: ref.id, name };
  }
);

/**
 * First-run helper: a user with no projects gets "My First Project". `condition` makes RTK skip
 * the thunk entirely if it already ran, so a repeated Firestore snapshot cannot create duplicates
 * (the old component code could).
 */
export const ensureDefaultProject = createAsyncThunk(
  'projects/ensureDefault',
  async (_arg, { dispatch }) => dispatch(createProject({ name: 'My First Project' })).unwrap(),
  { condition: (_arg, { getState }) => !getState().projects.defaultRequested }
);

export const deleteProject = createAsyncThunk('projects/delete', async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId));
  return projectId;
});

const initialState = { items: [], status: 'loading', defaultRequested: false };

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    projectsReceived(state, action) {
      state.items = action.payload;
      state.status = 'ready';
    },
    projectsReset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(ensureDefaultProject.pending, (state) => {
      state.defaultRequested = true;
    });
  },
});

export const { projectsReceived, projectsReset } = projectsSlice.actions;
export const selectProjects = (state) => state.projects.items;
export const selectProjectsLoading = (state) => state.projects.status === 'loading';
export const makeSelectProject = (projectId) =>
  createSelector([selectProjects], (items) => items.find((p) => p.id === projectId) ?? null);
export default projectsSlice.reducer;
