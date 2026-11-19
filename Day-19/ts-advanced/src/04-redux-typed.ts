import {
  combineReducers, configureStore, createAsyncThunk, createSelector, createSlice, createListenerMiddleware,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { useDispatch, useSelector, useStore } from 'react-redux';

/**
 * 04. Redux, typed completely. Two halves:
 *   A. by hand (plain Redux): shows what the types are FOR
 *   B. Redux Toolkit: what you write in real code
 */

// =====================================================================
// A. Plain Redux, by hand
// =====================================================================

export interface CounterState {
  value: number;
}

/** The action union. `type` is a literal, so it is the DISCRIMINANT: checking it narrows the rest of the action. */
export type CounterAction =
  | { type: 'counter/incremented'; by: number }
  | { type: 'counter/reset' }
  | { type: 'counter/set'; value: number };

/** Action creators: functions that build actions. Their return type is exact (`type` stays a literal). */
export const incremented = (by = 1) => ({ type: 'counter/incremented', by }) as const;
export const reset = () => ({ type: 'counter/reset' }) as const;
export const setValue = (value: number) => ({ type: 'counter/set', value }) as const;

/** The reducer: (state, action) => state. Each `case` sees only that action's fields. */
export function counterReducer(state: CounterState = { value: 0 }, action: CounterAction): CounterState {
  switch (action.type) {
    case 'counter/incremented':
      return { value: state.value + action.by }; // action.by exists here because of the case
    case 'counter/set':
      return { value: action.value };
    case 'counter/reset':
      return { value: 0 };
    default: {
      const unreachable: never = action; // add an action to the union and forget it here: compile error
      return unreachable;
    }
  }
}

// =====================================================================
// B. Redux Toolkit
// =====================================================================

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

/** What a failed thunk gives back through `rejectWithValue`: typed, so `action.payload` in `rejected` is not `unknown` */
export interface ApiError {
  message: string;
  status: number;
}

/** The "extra argument" lets a thunk reach a service without importing it (and lets tests swap it) */
export interface TodoApi {
  fetchTodos(): Promise<Todo[]>;
}
export interface ThunkExtra {
  api: TodoApi;
}

// ---- the slice: state shape, reducers, actions, all inferred from one place ----

export interface TodosState {
  items: Todo[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: ApiError | null;
}
const initialState: TodosState = { items: [], status: 'idle', error: null };

/**
 * `createAsyncThunk.withTypes<{ state, dispatch, extra, rejectValue }>()` states the config ONCE.
 * `state: { todos: TodosState }` (not RootState) avoids a circular type: RootState is built from the slice reducers.
 */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: { todos: TodosState };
  extra: ThunkExtra;
  rejectValue: ApiError;
}>();

export const loadTodos = createAppAsyncThunk('todos/load', async (_arg: void, { extra, rejectWithValue }) => {
  try {
    return await extra.api.fetchTodos(); // fulfilled payload type: Todo[]
  } catch (error: unknown) {
    return rejectWithValue({ message: error instanceof Error ? error.message : 'unknown error', status: 500 });
  }
});

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    /** `PayloadAction<string>`: the action creator `todoAdded('x')` takes a string. Immer lets us "mutate" the draft. */
    todoAdded(state, action: PayloadAction<string>) {
      state.items.push({ id: state.items.length + 1, title: action.payload, done: false });
    },
    todoToggled(state, action: PayloadAction<number>) {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    /** `prepare` lets the creator take different arguments from the payload it stores */
    todoRenamed: {
      reducer(state, action: PayloadAction<{ id: number; title: string }>) {
        const todo = state.items.find((t) => t.id === action.payload.id);
        if (todo) todo.title = action.payload.title;
      },
      prepare(id: number, title: string) {
        return { payload: { id, title: title.trim() } };
      },
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTodos.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload; // Todo[]
      })
      .addCase(loadTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? { message: action.error.message ?? 'unknown', status: 0 }; // payload: ApiError | undefined
      });
  },
});
export const { todoAdded, todoToggled, todoRenamed } = todosSlice.actions;

/** A second slice, so RootState has more than one key */
export interface FilterState {
  show: 'all' | 'open' | 'done';
}
const filterSlice = createSlice({
  name: 'filter',
  initialState: { show: 'all' } satisfies FilterState as FilterState,
  reducers: {
    filterChanged(state, action: PayloadAction<FilterState['show']>) {
      state.show = action.payload;
    },
  },
});
export const { filterChanged } = filterSlice.actions;

// ---- the store and its two derived types ----

const rootReducer = combineReducers({ todos: todosSlice.reducer, filter: filterSlice.reducer });

/** A listener middleware (bonus): runs side effects after actions, typed to the same state */
export const listener = createListenerMiddleware();

/** A factory, so each test gets a fresh store. `extra` is what thunks receive. */
export function makeStore(api: TodoApi, preloadedState?: Partial<ReturnType<typeof rootReducer>>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: { api } satisfies ThunkExtra } }),
  });
}

/** RootState and AppDispatch are never written by hand: they are READ from the store. */
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// ---- pre-typed hooks: use these instead of the plain ones ----
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

// ---- selectors ----
export const selectItems = (state: RootState): Todo[] => state.todos.items;
export const selectFilter = (state: RootState): FilterState['show'] => state.filter.show;

/** createSelector memoises: the filtering only re-runs when `items` or `filter` change. Its result type is inferred. */
export const selectVisibleTodos = createSelector([selectItems, selectFilter], (items, show) =>
  show === 'all' ? items : items.filter((t) => (show === 'done' ? t.done : !t.done))
);
export const selectCounts = createSelector([selectItems], (items) => ({
  total: items.length,
  done: items.filter((t) => t.done).length,
}));

export { todosSlice, filterSlice };
