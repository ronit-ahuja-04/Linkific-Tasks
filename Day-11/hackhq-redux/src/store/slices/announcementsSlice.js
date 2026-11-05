import { createSlice, createSelector } from '@reduxjs/toolkit';
import { SEED_ANNOUNCEMENTS } from '../../data/announcements.js';
import {
  EMPTY_CHANGES,
  addAnnouncement,
  applyChanges,
  countUnread,
  createAnnouncement,
  editAnnouncement,
  removeAnnouncement,
} from '../../lib/announcements.js';

// The seed list never changes; organizer edits live as { added, edited, removed } merged by id.
const announcementsSlice = createSlice({
  name: 'announcements',
  initialState: { changes: EMPTY_CHANGES, seenAt: null },
  reducers: {
    postAdded: {
      prepare: (draft) => ({ payload: createAnnouncement(draft) }),
      reducer(state, action) {
        state.changes = addAnnouncement(state.changes, action.payload);
      },
    },
    postEdited(state, action) {
      const { id, fields } = action.payload;
      state.changes = editAnnouncement(state.changes, id, fields);
    },
    postRemoved(state, action) {
      state.changes = removeAnnouncement(state.changes, action.payload);
    },
    markSeen: {
      prepare: () => ({ payload: Date.now() }),
      reducer(state, action) {
        state.seenAt = action.payload;
      },
    },
  },
});

export const { postAdded, postEdited, postRemoved, markSeen } = announcementsSlice.actions;

const selectChanges = (state) => state.announcements.changes;
export const selectSeenAt = (state) => state.announcements.seenAt;
export const selectAnnouncements = createSelector(selectChanges, (changes) =>
  applyChanges(SEED_ANNOUNCEMENTS, changes)
);
export const selectUnreadCount = createSelector(selectAnnouncements, selectSeenAt, countUnread);
export default announcementsSlice.reducer;
