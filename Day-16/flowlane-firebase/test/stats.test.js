import { describe, expect, it } from 'vitest';
import { ageOf, boardStats, projectsSummary } from '../src/lib/stats.js';
import { makeEmptyBoard } from '../src/lib/board.js';

const t = (id, extra = {}) => ({ id, content: id, priority: 'medium', users: [], ...extra });

function board() {
  const b = makeEmptyBoard();
  b.tasks = {
    a: t('a', { priority: 'high', users: ['u1'] }),
    b: t('b', { priority: 'high', users: ['u1', 'u2'], attachments: [{ id: 1 }, { id: 2 }] }),
    c: t('c', { priority: 'low' }),
    d: t('d', { priority: 'high', users: ['u2'], attachments: [{ id: 3 }] }),
    e: t('e', { priority: 'medium', users: ['u1'] }),
  };
  b.columns.todo.taskIds = ['a', 'c'];
  b.columns.inprogress.taskIds = ['b'];
  b.columns.done.taskIds = ['d', 'e'];
  return b;
}

describe('boardStats', () => {
  it('counts tasks per column and overall', () => {
    const s = boardStats(board());
    expect(s.columns).toEqual([
      { id: 'todo', title: 'To Do', count: 2 },
      { id: 'inprogress', title: 'In Progress', count: 1 },
      { id: 'done', title: 'Done', count: 2 },
    ]);
    expect(s).toMatchObject({ total: 5, done: 2, inProgress: 1, todo: 2, percentDone: 40 });
  });

  it('counts priorities, high-priority tasks that are not done, and images', () => {
    const s = boardStats(board());
    expect(s.priority).toEqual({ high: 3, medium: 1, low: 1 });
    expect(s.openHigh).toBe(2); // a and b; d is high but done
    expect(s.images).toBe(3);
  });

  it('says who has what: open and done tasks per person, busiest first', () => {
    const s = boardStats(board());
    expect(s.people).toEqual([
      { uid: 'u1', open: 2, done: 1 },
      { uid: 'u2', open: 1, done: 1 },
    ]);
    expect(s.unassigned).toBe(1); // c: open and nobody on it
  });

  it('orders people with equal counts by id, so the list never jumps around', () => {
    const b = makeEmptyBoard();
    b.tasks = { a: t('a', { users: ['zed'] }), b: t('b', { users: ['amy'] }) };
    b.columns.todo.taskIds = ['a', 'b'];
    expect(boardStats(b).people.map((p) => p.uid)).toEqual(['amy', 'zed']);
  });

  it('is all zeros for an empty board, with no division by zero', () => {
    const s = boardStats(makeEmptyBoard());
    expect(s).toMatchObject({ total: 0, done: 0, inProgress: 0, todo: 0, percentDone: 0, openHigh: 0, images: 0, unassigned: 0, people: [] });
  });

  it('ignores a column entry whose task is missing (it is not on the board yet)', () => {
    const b = board();
    b.columns.todo.taskIds.push('ghost');
    expect(boardStats(b).total).toBe(5);
  });

  it('survives a missing or empty board', () => {
    expect(boardStats(undefined).total).toBe(0);
    expect(boardStats({}).columns).toEqual([]);
  });

  it('rounds the percentage', () => {
    const b = makeEmptyBoard();
    b.tasks = { a: t('a'), b: t('b'), c: t('c') };
    b.columns.todo.taskIds = ['a', 'b'];
    b.columns.done.taskIds = ['c'];
    expect(boardStats(b).percentDone).toBe(33);
  });
});

describe('projectsSummary', () => {
  it('gives one row per project from the documents the listener already has', () => {
    const b = board();
    const rows = projectsSummary([
      { id: 'p1', name: 'Alpha', tasks: b.tasks, columns: b.columns, columnOrder: b.columnOrder },
      { id: 'p2', name: 'Fresh (no board yet)' },
    ]);
    expect(rows).toEqual([
      { id: 'p1', name: 'Alpha', total: 5, done: 2, percentDone: 40 },
      { id: 'p2', name: 'Fresh (no board yet)', total: 0, done: 0, percentDone: 0 },
    ]);
    expect(projectsSummary(undefined)).toEqual([]);
  });
});

describe('ageOf', () => {
  const at = 1_000_000;
  it('is null before the first update', () => expect(ageOf(null, at)).toBeNull());
  it('says now, seconds, minutes and hours', () => {
    expect(ageOf(at, at + 1000)).toEqual(['now', 0]);
    expect(ageOf(at, at + 5000)).toEqual(['seconds', 5]);
    expect(ageOf(at, at + 59_999)).toEqual(['seconds', 59]);
    expect(ageOf(at, at + 125_000)).toEqual(['minutes', 2]);
    expect(ageOf(at, at + 7_300_000)).toEqual(['hours', 2]);
  });
  it('never goes negative when the clock is a little behind', () => {
    expect(ageOf(at, at - 5000)).toEqual(['now', 0]);
  });
});
