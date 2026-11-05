import { createAsyncThunk, createSelector, createSlice, nanoid } from '@reduxjs/toolkit';
import { API, getJson } from '../../lib/api.js';

/** Second async thunk: import a few sample todos from the API */
export const importTodos = createAsyncThunk('todos/import', async (_arg, { signal }) => {
  const data = await getJson(`${API}/todos?limit=5`, { signal });
  return data.todos.map((t) => ({ id: `api-${t.id}`, text: t.todo, done: t.completed }));
});

export const todosInitialState = { items: [], filter: 'all', importStatus: 'idle', importError: null };

const todosSlice = createSlice({
  name: 'todos',
  initialState: todosInitialState,
  reducers: {
    addTodo: {
      // `prepare` builds the payload, so the id and timestamp (impure) stay out of the reducer
      prepare: (text) => ({ payload: { id: nanoid(), text: text.trim(), done: false, createdAt: Date.now() } }),
      reducer(state, action) {
        if (action.payload.text) state.items.unshift(action.payload);
      },
    },
    toggleTodo(state, action) {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done; // Immer lets us "mutate" safely; RTK produces new state
    },
    editTodo(state, action) {
      const { id, text } = action.payload;
      const todo = state.items.find((t) => t.id === id);
      if (todo && text.trim()) todo.text = text.trim();
    },
    removeTodo(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    clearCompleted(state) {
      state.items = state.items.filter((t) => !t.done);
    },
    setFilter(state, action) {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(importTodos.pending, (state) => {
        state.importStatus = 'loading';
        state.importError = null;
      })
      .addCase(importTodos.fulfilled, (state, action) => {
        state.importStatus = 'succeeded';
        const have = new Set(state.items.map((t) => t.id));
        state.items.push(...action.payload.filter((t) => !have.has(t.id)));
      })
      .addCase(importTodos.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.importStatus = 'failed';
        state.importError = action.error.message;
      });
  },
});

export const { addTodo, toggleTodo, editTodo, removeTodo, clearCompleted, setFilter } = todosSlice.actions;

export const selectTodos = (state) => state.todos.items;
export const selectFilter = (state) => state.todos.filter;
// createSelector memoizes derived data: it only recomputes when the todos or the filter change
export const selectVisibleTodos = createSelector([selectTodos, selectFilter], (todos, filter) =>
  filter === 'active' ? todos.filter((t) => !t.done) : filter === 'done' ? todos.filter((t) => t.done) : todos
);
export const selectTodoCounts = createSelector([selectTodos], (todos) => {
  const done = todos.filter((t) => t.done).length;
  return { total: todos.length, done, active: todos.length - done };
});
export default todosSlice.reducer;
