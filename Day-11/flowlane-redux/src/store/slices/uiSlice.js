import { createSlice } from '@reduxjs/toolkit';
import { saveTask, taskUpdated } from './boardSlice';

// UI state that several components care about: the open tab, which modals are open, the
// feedback messages, and the task side panel. Form fields stay in local component state.
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeTab: 'board',
    hasNewActivity: false,
    modals: { newProject: false, deleteProject: false, invite: false },
    errorMessage: '',
    successMessage: '',
    taskPanel: { open: false, task: null },
  },
  reducers: {
    tabChanged(state, action) {
      state.activeTab = action.payload;
      if (action.payload === 'activity') state.hasNewActivity = false;
    },
    activityFlagged(state, action) {
      state.hasNewActivity = action.payload;
    },
    modalOpened(state, action) {
      state.modals[action.payload] = true;
    },
    modalClosed(state, action) {
      state.modals[action.payload] = false;
    },
    errorShown(state, action) {
      state.errorMessage = action.payload;
    },
    errorDismissed(state) {
      state.errorMessage = '';
    },
    successShown(state, action) {
      state.successMessage = action.payload;
    },
    successDismissed(state) {
      state.successMessage = '';
    },
    taskPanelOpened(state, action) {
      state.taskPanel = { open: true, task: action.payload };
    },
    taskPanelClosed(state) {
      state.taskPanel.open = false;
    },
  },
  // A slice can respond to another slice's action: when the board updates a task that is open
  // in the side panel, the panel shows the new version without any component wiring.
  extraReducers: (builder) => {
    builder
      .addCase(taskUpdated, (state, action) => {
        if (state.taskPanel.task?.id === action.payload.id) state.taskPanel.task = action.payload;
      })
      // saveTask is optimistic too: its `pending` action already carries the new task as meta.arg
      .addCase(saveTask.pending, (state, action) => {
        if (state.taskPanel.task?.id === action.meta.arg.id) state.taskPanel.task = action.meta.arg;
      });
  },
});

export const {
  tabChanged,
  activityFlagged,
  modalOpened,
  modalClosed,
  errorShown,
  errorDismissed,
  successShown,
  successDismissed,
  taskPanelOpened,
  taskPanelClosed,
} = uiSlice.actions;

export const selectActiveTab = (state) => state.ui.activeTab;
export const selectHasNewActivity = (state) => state.ui.hasNewActivity;
export const selectModals = (state) => state.ui.modals;
export const selectErrorMessage = (state) => state.ui.errorMessage;
export const selectSuccessMessage = (state) => state.ui.successMessage;
export const selectTaskPanel = (state) => state.ui.taskPanel;
export default uiSlice.reducer;
