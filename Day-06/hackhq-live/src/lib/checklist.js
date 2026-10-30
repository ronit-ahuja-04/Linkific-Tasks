/**
 * Pure functions for Checklist todo list management (CL-1 to CL-11)
 */

/**
 * Generate a task object
 * @param {string} text
 * @returns {{ id: string, text: string, done: boolean, createdAt: number }}
 */
export function createTask(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  const id = 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  return {
    id,
    text: trimmed,
    done: false,
    createdAt: Date.now(),
  };
}

/**
 * Filter tasks by status tab (CL-4)
 * @param {Array<{ id: string, done: boolean }>} tasks
 * @param {'all' | 'open' | 'done'} filter
 * @returns {Array}
 */
export function filterTasks(tasks, filter = 'all') {
  if (!Array.isArray(tasks)) return [];
  if (filter === 'open') {
    return tasks.filter((t) => !t.done);
  }
  if (filter === 'done') {
    return tasks.filter((t) => t.done);
  }
  return tasks;
}

/**
 * Pure calculation of completion metrics (CL-5)
 * @param {Array<{ done: boolean }>} tasks
 * @returns {{ total: number, done: number, percentage: number, isComplete: boolean }}
 */
export function calculateProgress(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { total: 0, done: 0, percentage: 0, isComplete: false };
  }
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const percentage = Math.round((done / total) * 100);
  const isComplete = total >= 3 && done === total;
  return { total, done, percentage, isComplete };
}

/**
 * Immutable insertion of a task at a specific index for Undo restoration (CL-8)
 * @param {Array} tasks
 * @param {object} taskToRestore
 * @param {number} targetIndex
 * @returns {Array}
 */
export function insertTaskAtIndex(tasks, taskToRestore, targetIndex = 0) {
  if (!taskToRestore) return [...tasks];
  const safeList = Array.isArray(tasks) ? tasks : [];
  const idx = Math.max(0, Math.min(safeList.length, targetIndex));
  return [
    ...safeList.slice(0, idx),
    taskToRestore,
    ...safeList.slice(idx),
  ];
}

/**
 * Immutable swap of two adjacent task items (CL-11)
 * @param {Array} tasks
 * @param {number} fromIndex
 * @param {number} toIndex
 * @returns {Array}
 */
export function swapTaskPosition(tasks, fromIndex, toIndex) {
  if (!Array.isArray(tasks) || fromIndex < 0 || toIndex < 0 || fromIndex >= tasks.length || toIndex >= tasks.length) {
    return tasks;
  }
  const next = [...tasks];
  const temp = next[fromIndex];
  next[fromIndex] = next[toIndex];
  next[toIndex] = temp;
  return next;
}

/**
 * Merge starter tasks without duplicating any existing task text (CL-7)
 * @param {Array} currentTasks
 * @param {Array} starterTasks
 * @returns {Array}
 */
export function mergeStarterTasks(currentTasks, starterTasks) {
  const existingTexts = new Set(
    (currentTasks || []).map((t) => (t.text || '').trim().toLowerCase())
  );

  const newItems = (starterTasks || []).filter(
    (item) => !existingTexts.has((item.text || '').trim().toLowerCase())
  );

  return [...(currentTasks || []), ...newItems];
}

