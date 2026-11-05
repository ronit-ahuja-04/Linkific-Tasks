import { createSlice, createSelector } from '@reduxjs/toolkit';
import {
  calculateProgress,
  createTask,
  filterTasks,
  insertTaskAtIndex,
  mergeStarterTasks,
  swapTaskPosition,
} from '../../lib/checklist.js';
import { STARTER_TASKS } from '../../data/starterTasks.js';

// Todo list (checklist station). Persisted under 'hackhq_tasks'.
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: STARTER_TASKS },
  reducers: {
    addTask: {
      // `prepare` runs before the reducer, so impure work (Date.now, Math.random) stays out of it
      prepare: (text) => ({ payload: createTask(text) }),
      reducer(state, action) {
        state.items.unshift(action.payload);
      },
    },
    toggleTask(state, action) {
      const task = state.items.find((t) => t.id === action.payload);
      if (task) task.done = !task.done;
    },
    removeTask(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    restoreTask(state, action) {
      const { task, index } = action.payload;
      state.items = insertTaskAtIndex(state.items, task, index);
    },
    editTask(state, action) {
      const { id, text } = action.payload;
      const task = state.items.find((t) => t.id === id);
      if (task) task.text = text.slice(0, 80);
    },
    moveTask(state, action) {
      const { from, to } = action.payload;
      state.items = swapTaskPosition(state.items, from, to);
    },
    clearCompleted(state) {
      state.items = state.items.filter((t) => !t.done);
    },
    restoreStarterTasks(state) {
      state.items = mergeStarterTasks(state.items, STARTER_TASKS);
    },
  },
});

export const {
  addTask,
  toggleTask,
  removeTask,
  restoreTask,
  editTask,
  moveTask,
  clearCompleted,
  restoreStarterTasks,
} = tasksSlice.actions;

export const selectTasks = (state) => state.tasks.items;
export const selectProgress = createSelector(selectTasks, calculateProgress);
export const makeSelectFilteredTasks = (filter) =>
  createSelector(selectTasks, (tasks) => filterTasks(tasks, filter));
export default tasksSlice.reducer;
