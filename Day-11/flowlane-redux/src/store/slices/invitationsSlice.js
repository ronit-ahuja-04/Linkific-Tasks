import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { notifyMembers } from '../../lib/notify';
import { userLabel } from '../../lib/serialize';

/** Invite someone (by email) to the open project. Failures carry the message shown in the UI. */
export const sendInvite = createAsyncThunk(
  'invitations/send',
  async ({ email, projectId }, { getState, rejectWithValue }) => {
    const state = getState();
    const project = state.projects.items.find((p) => p.id === projectId);
    const inviter = state.auth.user;
    if (!project || !inviter) return rejectWithValue('An error occurred while sending the invite.');

    try {
      const found = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
      if (found.empty) {
        return rejectWithValue(
          'No user found with that email. They must sign in to the app first before you can invite them.'
        );
      }
      const invitee = found.docs[0].data();
      if (project.members.includes(invitee.uid)) {
        return rejectWithValue(`${invitee.displayName} is already in this project!`);
      }
      await setDoc(doc(collection(db, 'invitations')), {
        projectId,
        projectName: project.name,
        inviterName: userLabel(inviter),
        inviteeEmail: email,
        inviteeUid: invitee.uid,
        createdAt: new Date().toISOString(),
      });
      return { displayName: invitee.displayName };
    } catch (err) {
      console.error(err);
      return rejectWithValue('An error occurred while sending the invite.');
    }
  }
);

export const acceptInvite = createAsyncThunk(
  'invitations/accept',
  async (invite, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    try {
      await updateDoc(doc(db, 'projects', invite.projectId), { members: arrayUnion(user.uid) });
      await deleteDoc(doc(db, 'invitations', invite.id));
    } catch (err) {
      console.error('Failed to accept invite', err);
      return rejectWithValue('Failed to join project.');
    }
    // Telling the other members is best effort and must not fail the join
    try {
      const project = await getDoc(doc(db, 'projects', invite.projectId));
      await notifyMembers(project.data()?.members, {
        message: `${userLabel(user)} joined project "${invite.projectName}"`,
        projectId: invite.projectId,
        excludeUid: user.uid,
      });
    } catch (err) {
      console.error(err);
    }
    return { projectName: invite.projectName };
  }
);

export const declineInvite = createAsyncThunk('invitations/decline', async (inviteId) => {
  await deleteDoc(doc(db, 'invitations', inviteId));
  return inviteId;
});

const invitationsSlice = createSlice({
  name: 'invitations',
  initialState: { items: [] },
  reducers: {
    invitationsReceived(state, action) {
      state.items = action.payload;
    },
    invitationsReset: () => ({ items: [] }),
  },
});

export const { invitationsReceived, invitationsReset } = invitationsSlice.actions;
export const selectInvitations = (state) => state.invitations.items;
export default invitationsSlice.reducer;
