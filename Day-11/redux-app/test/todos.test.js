import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '../src/store/index.js';
import {
  addTodo, clearCompleted, editTodo, importTodos, removeTodo, selectTodoCounts, selectTodos,
  selectVisibleTodos, setFilter, toggleTodo,
} from '../src/store/slices/todosSlice.js';
import { mockFetch } from './helpers.js';

afterEach(() => vi.unstubAllGlobals());

const withTodos = () => {
  const store = makeStore();
  ['one', 'two', 'three'].forEach((t) => store.dispatch(addTodo(t)));
  return store;
};

describe('todos slice', () => {
  it('adds todos newest first with an id, trimmed text and done=false', () => {
    const store = withTodos();
    const todos = selectTodos(store.getState());
    expect(todos.map((t) => t.text)).toEqual(['three', 'two', 'one']);
    expect(new Set(todos.map((t) => t.id)).size).toBe(3);
    expect(todos[0]).toMatchObject({ done: false });
    store.dispatch(addTodo('   padded   '));
    expect(selectTodos(store.getState())[0].text).toBe('padded');
  });

  it('ignores empty or whitespace-only todos', () => {
    const store = makeStore();
    store.dispatch(addTodo('   '));
    expect(selectTodos(store.getState())).toEqual([]);
  });

  it('toggles, edits and removes', () => {
    const store = withTodos();
    const [a, b] = selectTodos(store.getState());
    store.dispatch(toggleTodo(a.id));
    expect(selectTodos(store.getState())[0].done).toBe(true);
    store.dispatch(toggleTodo(a.id));
    expect(selectTodos(store.getState())[0].done).toBe(false);

    store.dispatch(editTodo({ id: b.id, text: '  edited  ' }));
    expect(selectTodos(store.getState())[1].text).toBe('edited');
    store.dispatch(editTodo({ id: b.id, text: '   ' }));
    expect(selectTodos(store.getState())[1].text).toBe('edited');

    store.dispatch(removeTodo(a.id));
    expect(selectTodos(store.getState())).toHaveLength(2);
    store.dispatch(toggleTodo('missing'));
    expect(selectTodos(store.getState())).toHaveLength(2);
  });

  it('filters and counts with memoized selectors', () => {
    const store = withTodos();
    const [a] = selectTodos(store.getState());
    store.dispatch(toggleTodo(a.id));

    expect(selectTodoCounts(store.getState())).toEqual({ total: 3, done: 1, active: 2 });
    store.dispatch(setFilter('done'));
    expect(selectVisibleTodos(store.getState()).map((t) => t.id)).toEqual([a.id]);
    store.dispatch(setFilter('active'));
    expect(selectVisibleTodos(store.getState())).toHaveLength(2);
    store.dispatch(setFilter('all'));
    const first = selectVisibleTodos(store.getState());
    expect(selectVisibleTodos(store.getState())).toBe(first); // same reference: memoized
  });

  it('clears completed todos', () => {
    const store = withTodos();
    const todos = selectTodos(store.getState());
    store.dispatch(toggleTodo(todos[0].id));
    store.dispatch(toggleTodo(todos[1].id));
    store.dispatch(clearCompleted());
    expect(selectTodos(store.getState())).toHaveLength(1);
  });

  it('imports sample todos through an async thunk without duplicating on a second import', async () => {
    mockFetch({ json: { todos: [{ id: 1, todo: 'Do laundry', completed: false }, { id: 2, todo: 'Walk dog', completed: true }] } });
    const store = makeStore();
    const promise = store.dispatch(importTodos());
    expect(store.getState().todos.importStatus).toBe('loading');
    await promise;
    expect(store.getState().todos.importStatus).toBe('succeeded');
    expect(selectTodos(store.getState()).map((t) => [t.text, t.done])).toEqual([['Do laundry', false], ['Walk dog', true]]);
    await store.dispatch(importTodos());
    expect(selectTodos(store.getState())).toHaveLength(2);
  });

  it('records an import failure', async () => {
    mockFetch({ ok: false, status: 500, statusText: 'Server Error' });
    const store = makeStore();
    await store.dispatch(importTodos());
    expect(store.getState().todos.importStatus).toBe('failed');
    expect(store.getState().todos.importError).toContain('500');
  });
});
