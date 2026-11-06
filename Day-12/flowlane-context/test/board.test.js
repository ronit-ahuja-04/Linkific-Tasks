import { describe, expect, it } from 'vitest';
import { addTask, createDraftTask, findColumnOfTask, makeEmptyBoard, moveTask, removeTask, updateTask } from '../src/lib/board.js';

const base = () => {
  const b = makeEmptyBoard();
  b.tasks = { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' }, d: { id: 'd' } };
  b.columns.todo.taskIds = ['a', 'b', 'c'];
  b.columns.inprogress.taskIds = ['d'];
  return b;
};
const drag = (from, fromIndex, to, toIndex, id) => ({
  source: { droppableId: from, index: fromIndex },
  destination: to ? { droppableId: to, index: toIndex } : null,
  draggableId: id,
});

describe('board logic (src/lib/board.js)', () => {
  it('starts with three empty columns in order', () => {
    const b = makeEmptyBoard();
    expect(b.columnOrder).toEqual(['todo', 'inprogress', 'done']);
    expect(Object.values(b.columns).every((c) => c.taskIds.length === 0)).toBe(true);
  });

  it('reorders within a column', () => {
    const next = moveTask(base(), drag('todo', 0, 'todo', 2, 'a'));
    expect(next.columns.todo.taskIds).toEqual(['b', 'c', 'a']);
  });

  it('moves between columns', () => {
    const next = moveTask(base(), drag('todo', 1, 'inprogress', 0, 'b'));
    expect(next.columns.todo.taskIds).toEqual(['a', 'c']);
    expect(next.columns.inprogress.taskIds).toEqual(['b', 'd']);
  });

  it('does not mutate the original board', () => {
    const board = base();
    const snapshot = JSON.stringify(board);
    moveTask(board, drag('todo', 0, 'done', 0, 'a'));
    expect(JSON.stringify(board)).toBe(snapshot);
  });

  it('returns the same object for a no-op: outside a column, same place, unknown column', () => {
    const board = base();
    expect(moveTask(board, drag('todo', 0, null))).toBe(board);
    expect(moveTask(board, drag('todo', 1, 'todo', 1, 'b'))).toBe(board);
    expect(moveTask(board, drag('todo', 0, 'nope', 0, 'a'))).toBe(board);
  });

  it('keeps finished tasks finished: nothing leaves the Done column', () => {
    const board = base();
    board.columns.done.taskIds = ['x'];
    expect(moveTask(board, drag('done', 0, 'todo', 0, 'x'))).toBe(board);
    // but moving within Done is allowed, and moving into Done is allowed
    board.columns.done.taskIds = ['x', 'y'];
    expect(moveTask(board, drag('done', 0, 'done', 1, 'x')).columns.done.taskIds).toEqual(['y', 'x']);
    expect(moveTask(base(), drag('todo', 0, 'done', 0, 'a')).columns.done.taskIds).toEqual(['a']);
  });

  it('adds a task at the end of a column and ignores unknown columns', () => {
    const next = addTask(base(), { id: 'n' }, 'inprogress');
    expect(next.columns.inprogress.taskIds).toEqual(['d', 'n']);
    expect(next.tasks.n).toEqual({ id: 'n' });
    const board = base();
    expect(addTask(board, { id: 'n' }, 'nope')).toBe(board);
  });

  it('removes a task from the map and its column', () => {
    const next = removeTask(base(), 'b');
    expect(next.tasks.b).toBeUndefined();
    expect(next.columns.todo.taskIds).toEqual(['a', 'c']);
    const board = base();
    expect(removeTask(board, 'zzz')).toBe(board);
  });

  it('finds the column of a task', () => {
    expect(findColumnOfTask(base(), 'd')).toBe('inprogress');
    expect(findColumnOfTask(base(), 'zzz')).toBeNull();
  });

  it('updates an existing task only', () => {
    const next = updateTask(base(), { id: 'a', content: 'changed' });
    expect(next.tasks.a.content).toBe('changed');
    const board = base();
    expect(updateTask(board, { id: 'ghost' })).toBe(board);
  });

  it('creates a draft task for a column and user', () => {
    const t = createDraftTask({ columnId: 'todo', uid: 'u1' });
    expect(t).toMatchObject({ content: '', priority: 'medium', users: ['u1'], _isDraft: true, _columnId: 'todo' });
    expect(t.id).toMatch(/^task-/);
    expect(createDraftTask({ columnId: 'todo', uid: undefined }).users).toEqual([]);
  });
});
