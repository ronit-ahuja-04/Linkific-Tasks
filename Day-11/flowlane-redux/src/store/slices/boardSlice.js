import { createAsyncThunk, createSelector, createSlice, current } from '@reduxjs/toolkit';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { addTask, findColumnOfTask, makeEmptyBoard, moveTask, removeTask, updateTask } from '../../lib/board';
import { notifyMembers } from '../../lib/notify';
import { userLabel } from '../../lib/serialize';

const projectRef = (state) => doc(db, 'projects', state.board.projectId);
const boardOf = (state) => ({
  tasks: state.board.tasks,
  columns: state.board.columns,
  columnOrder: state.board.columnOrder,
});
const projectMembers = (state) =>
  state.projects.items.find((p) => p.id === state.board.projectId)?.members ?? [];

/**
 * OPTIMISTIC UPDATES with createAsyncThunk. The reducer applies the change immediately in
 * `pending` (so drag-and-drop feels instant), remembers the board as it was, and if the Firestore
 * write fails the `rejected` case puts the old board back. Each request keeps its own snapshot,
 * keyed by `requestId`, so two quick drags cannot restore the wrong one.
 */
export const dragTask = createAsyncThunk(
  'board/dragTask',
  async (_move, { getState }) => {
    const state = getState(); // already includes the optimistic move
    await updateDoc(projectRef(state), boardOf(state));
  },
  // Skip the whole thunk (no pending, no write) for moves that change nothing
  {
    condition: (move, { getState }) => {
      const board = boardOf(getState());
      return moveTask(board, move) !== board; // moveTask returns the same object for a no-op
    },
  }
);

export const createTask = createAsyncThunk('board/createTask', async ({ task, columnId }, { getState }) => {
  const state = getState();
  const column = state.board.columns[columnId];
  await updateDoc(projectRef(state), {
    [`tasks.${task.id}`]: state.board.tasks[task.id],
    [`columns.${columnId}.taskIds`]: column.taskIds,
  });
  const user = state.auth.user;
  notifyMembers(projectMembers(state), {
    message: `${userLabel(user)} created a new task: ${task.content}`,
    projectId: state.board.projectId,
    excludeUid: user?.uid,
  });
});

export const deleteTask = createAsyncThunk(
  'board/deleteTask',
  async (taskId, { getState }) => {
    const state = getState();
    await updateDoc(projectRef(state), {
      tasks: state.board.tasks,
      columns: state.board.columns,
    });
    return taskId;
  },
  // Nothing to do (and nothing to write) for a task that is not on the board
  { condition: (taskId, { getState }) => findColumnOfTask(getState().board, taskId) !== null }
);

export const saveTask = createAsyncThunk('board/saveTask', async (task, { getState }) => {
  const state = getState();
  await updateDoc(projectRef(state), { [`tasks.${task.id}`]: task });
});

/** Toggle who a task is assigned to; the newly assigned person gets a notification */
export const assignTaskUsers = createAsyncThunk(
  'board/assignTaskUsers',
  async ({ task, users, assignedUid, title }, { getState, dispatch }) => {
    const state = getState();
    const user = state.auth.user;
    const projectId = state.board.projectId;
    dispatch(taskUpdated({ ...task, users })); // optimistic: the panel updates at once
    try {
      if (assignedUid && assignedUid !== user?.uid) {
        await setDoc(
          doc(db, 'users', assignedUid, 'notifications', `assign_${task.id}`),
          {
            type: 'assignment',
            message: `${userLabel(user)} assigned you to a task: ${title || task.content || 'Untitled Task'}`,
            createdAt: serverTimestamp(),
            projectId,
            taskId: task.id,
          },
          { merge: true }
        );
      }
      if (!task._isDraft) await updateDoc(doc(db, 'projects', projectId), { [`tasks.${task.id}.users`]: users });
    } catch (err) {
      dispatch(taskUpdated(task)); // roll back the optimistic change
      throw err;
    }
  }
);

const initialState = {
  ...makeEmptyBoard(),
  projectId: null,
  status: 'idle', // 'idle' | 'ready'
  snapshots: {}, // requestId -> board before an optimistic change
  error: null,
};

const applyBoard = (state, board) => {
  state.tasks = board.tasks;
  state.columns = board.columns;
  state.columnOrder = board.columnOrder;
};

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    // A Firestore snapshot of the open project
    boardReceived(state, action) {
      const { projectId, tasks, columns, columnOrder } = action.payload;
      state.projectId = projectId;
      applyBoard(state, { tasks, columns, columnOrder });
      state.status = 'ready';
      state.error = null;
    },
    taskUpdated(state, action) {
      applyBoard(state, updateTask(current(state), action.payload));
    },
    boardReset: () => initialState,
    boardErrorCleared(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Shared optimistic pattern for drag / create / delete / save
    const optimistic = (thunk, apply) => {
      builder
        .addCase(thunk.pending, (state, action) => {
          const before = current(state);
          state.snapshots[action.meta.requestId] = {
            tasks: before.tasks,
            columns: before.columns,
            columnOrder: before.columnOrder,
          };
          applyBoard(state, apply(before, action.meta.arg));
        })
        .addCase(thunk.fulfilled, (state, action) => {
          delete state.snapshots[action.meta.requestId];
        })
        .addCase(thunk.rejected, (state, action) => {
          const snapshot = state.snapshots[action.meta.requestId];
          if (snapshot) applyBoard(state, snapshot);
          delete state.snapshots[action.meta.requestId];
          state.error = action.error.message ?? 'Could not save your change. It has been undone.';
        });
    };

    optimistic(dragTask, (board, move) => moveTask(board, move));
    optimistic(createTask, (board, { task, columnId }) => {
      const { _isDraft, _columnId, ...saved } = task;
      return addTask(board, saved, columnId);
    });
    optimistic(deleteTask, (board, taskId) => removeTask(board, taskId));
    optimistic(saveTask, (board, task) => updateTask(board, task));
  },
});

export const { boardReceived, taskUpdated, boardReset, boardErrorCleared } = boardSlice.actions;

const selectTasksMap = (state) => state.board.tasks;
const selectColumns = (state) => state.board.columns;
const selectColumnOrder = (state) => state.board.columnOrder;
export const selectBoard = createSelector(
  [selectTasksMap, selectColumns, selectColumnOrder],
  (tasks, columns, columnOrder) => ({ tasks, columns, columnOrder })
);
export const selectBoardError = (state) => state.board.error;
export const selectBoardProjectId = (state) => state.board.projectId;
export const selectColumnOfTask = (taskId) => (state) => findColumnOfTask(state.board, taskId);
export default boardSlice.reducer;
