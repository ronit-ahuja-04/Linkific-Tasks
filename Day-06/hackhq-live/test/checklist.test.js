import { describe, it, expect } from 'vitest';
import {
  createTask,
  filterTasks,
  calculateProgress,
  insertTaskAtIndex,
  swapTaskPosition,
  mergeStarterTasks,
} from '../src/lib/checklist.js';

describe('Checklist todo pure logic (src/lib/checklist.js)', () => {
  describe('createTask', () => {
    it('creates a valid task object with trimmed text and default done=false', () => {
      const task = createTask('  Clean hackathon lounge  ');
      expect(task.text).toBe('Clean hackathon lounge');
      expect(task.done).toBe(false);
      expect(task.id).toMatch(/^task-/);
      expect(typeof task.createdAt).toBe('number');
    });
  });

  describe('filterTasks', () => {
    const sample = [
      { id: '1', text: 'Task 1', done: false },
      { id: '2', text: 'Task 2', done: true },
      { id: '3', text: 'Task 3', done: false },
    ];

    it('returns all tasks for "all" filter', () => {
      expect(filterTasks(sample, 'all')).toHaveLength(3);
    });

    it('returns only uncompleted tasks for "open" filter', () => {
      const open = filterTasks(sample, 'open');
      expect(open).toHaveLength(2);
      expect(open.map((t) => t.id)).toEqual(['1', '3']);
    });

    it('returns only completed tasks for "done" filter', () => {
      const done = filterTasks(sample, 'done');
      expect(done).toHaveLength(1);
      expect(done[0].id).toBe('2');
    });

    it('handles empty or invalid inputs safely', () => {
      expect(filterTasks(null, 'all')).toEqual([]);
    });
  });

  describe('calculateProgress', () => {
    it('computes 0% for empty tasks', () => {
      expect(calculateProgress([])).toEqual({
        total: 0,
        done: 0,
        percentage: 0,
        isComplete: false,
      });
    });

    it('computes correct progress percentage', () => {
      const tasks = [
        { id: '1', done: true },
        { id: '2', done: true },
        { id: '3', done: false },
        { id: '4', done: false },
      ];
      expect(calculateProgress(tasks)).toEqual({
        total: 4,
        done: 2,
        percentage: 50,
        isComplete: false,
      });
    });

    it('flags isComplete=true only when all tasks are done and count >= 3', () => {
      const twoDone = [{ done: true }, { done: true }];
      expect(calculateProgress(twoDone).isComplete).toBe(false);

      const threeDone = [{ done: true }, { done: true }, { done: true }];
      expect(calculateProgress(threeDone).isComplete).toBe(true);
    });
  });

  describe('insertTaskAtIndex (Undo Restoration)', () => {
    it('restores task at original beginning index 0', () => {
      const list = [{ id: '2' }, { id: '3' }];
      const restored = insertTaskAtIndex(list, { id: '1' }, 0);
      expect(restored.map((t) => t.id)).toEqual(['1', '2', '3']);
    });

    it('restores task at original middle index', () => {
      const list = [{ id: '1' }, { id: '3' }];
      const restored = insertTaskAtIndex(list, { id: '2' }, 1);
      expect(restored.map((t) => t.id)).toEqual(['1', '2', '3']);
    });

    it('restores task at the end', () => {
      const list = [{ id: '1' }, { id: '2' }];
      const restored = insertTaskAtIndex(list, { id: '3' }, 2);
      expect(restored.map((t) => t.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('swapTaskPosition', () => {
    it('swaps two task positions immutably', () => {
      const list = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
      const swapped = swapTaskPosition(list, 0, 1);
      expect(swapped.map((t) => t.id)).toEqual(['B', 'A', 'C']);
      expect(list[0].id).toBe('A'); // Verifies original array is not mutated
    });

    it('returns original list if indices are out of bounds', () => {
      const list = [{ id: 'A' }, { id: 'B' }];
      expect(swapTaskPosition(list, -1, 1)).toBe(list);
      expect(swapTaskPosition(list, 0, 5)).toBe(list);
    });
  });

  describe('mergeStarterTasks', () => {
    it('appends starter tasks that do not already exist', () => {
      const current = [{ text: 'Task 1' }];
      const starters = [{ text: 'Task 1' }, { text: 'Task 2' }];
      const merged = mergeStarterTasks(current, starters);
      expect(merged).toHaveLength(2);
      expect(merged[1].text).toBe('Task 2');
    });

    it('prevents duplication on repeated clicks', () => {
      const starters = [{ text: 'Alpha' }, { text: 'Beta' }];
      const first = mergeStarterTasks([], starters);
      const second = mergeStarterTasks(first, starters);
      expect(second).toHaveLength(2);
    });
  });
});
