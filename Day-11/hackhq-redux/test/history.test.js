import { describe, it, expect } from 'vitest';
import { makeStore } from '../src/store/index.js';
import {
  undo,
  redo,
  historyCleared,
  selectCanUndo,
  selectCanRedo,
  HISTORY_LIMIT,
} from '../src/store/undoable.js';
import { addTask, removeTask, selectTasks } from '../src/store/slices/tasksSlice.js';
import { addItem, changeQuantity, selectCartItems } from '../src/store/slices/cartSlice.js';
import { toggleTheme } from '../src/store/slices/themeSlice.js';

const fresh = () => makeStore({ tasks: { items: [] } });

describe('undo / redo (src/store/undoable.js)', () => {
  it('starts with nothing to undo or redo', () => {
    const s = fresh().getState();
    expect(selectCanUndo('tasks')(s)).toBe(false);
    expect(selectCanRedo('tasks')(s)).toBe(false);
  });

  it('undoes and redoes task changes', () => {
    const store = fresh();
    store.dispatch(addTask('one'));
    store.dispatch(addTask('two'));
    expect(selectTasks(store.getState())).toHaveLength(2);

    store.dispatch(undo('tasks'));
    expect(selectTasks(store.getState()).map((t) => t.text)).toEqual(['one']);
    expect(selectCanRedo('tasks')(store.getState())).toBe(true);

    store.dispatch(undo('tasks'));
    expect(selectTasks(store.getState())).toEqual([]);
    expect(selectCanUndo('tasks')(store.getState())).toBe(false);

    store.dispatch(redo('tasks'));
    store.dispatch(redo('tasks'));
    expect(selectTasks(store.getState()).map((t) => t.text)).toEqual(['two', 'one']);
    expect(selectCanRedo('tasks')(store.getState())).toBe(false);
  });

  it('undoes a delete', () => {
    const store = fresh();
    store.dispatch(addTask('keep me'));
    const [task] = selectTasks(store.getState());
    store.dispatch(removeTask(task.id));
    expect(selectTasks(store.getState())).toEqual([]);
    store.dispatch(undo('tasks'));
    expect(selectTasks(store.getState())).toEqual([task]);
  });

  it('drops the redo stack when a new change is made', () => {
    const store = fresh();
    store.dispatch(addTask('a'));
    store.dispatch(addTask('b'));
    store.dispatch(undo('tasks'));
    store.dispatch(addTask('c'));
    expect(selectCanRedo('tasks')(store.getState())).toBe(false);
  });

  it('tracks tasks and cart independently', () => {
    const store = fresh();
    store.dispatch(addTask('a'));
    store.dispatch(addItem('swag-tee'));
    store.dispatch(changeQuantity({ productId: 'swag-tee', delta: 1 }));
    store.dispatch(undo('cart'));
    expect(selectCartItems(store.getState())[0].quantity).toBe(1);
    expect(selectTasks(store.getState())).toHaveLength(1);
    expect(selectCanUndo('tasks')(store.getState())).toBe(true);
  });

  it('does not record history for untracked slices or no-op actions', () => {
    const store = fresh();
    store.dispatch(toggleTheme());
    store.dispatch(undo('tasks'));
    expect(selectCanUndo('tasks')(store.getState())).toBe(false);
    expect(selectCanUndo('cart')(store.getState())).toBe(false);
  });

  it('does not record a phantom entry when the store starts from partial saved state', () => {
    const store = makeStore({ tasks: { items: [] } });
    store.dispatch(toggleTheme());
    expect(store.getState().history.cart.past).toEqual([]);
    store.dispatch(undo('cart'));
    expect(store.getState().cart.items).toEqual([]);
  });

  it('ignores undo for an unknown slice or an empty stack', () => {
    const store = fresh();
    const before = store.getState();
    store.dispatch(undo('theme'));
    store.dispatch(redo('tasks'));
    expect(store.getState().tasks).toBe(before.tasks);
  });

  it('caps the history length', () => {
    const store = fresh();
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) store.dispatch(addTask(`t${i}`));
    expect(store.getState().history.tasks.past).toHaveLength(HISTORY_LIMIT);
  });

  it('can clear history', () => {
    const store = fresh();
    store.dispatch(addTask('a'));
    store.dispatch(historyCleared('tasks'));
    expect(selectCanUndo('tasks')(store.getState())).toBe(false);
    store.dispatch(addTask('b'));
    store.dispatch(addItem('swag-tee'));
    store.dispatch(historyCleared());
    expect(selectCanUndo('cart')(store.getState())).toBe(false);
  });
});
