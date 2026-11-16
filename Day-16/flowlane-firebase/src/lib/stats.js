/**
 * Numbers for the Live tab. Pure functions over the board `{ tasks, columns, columnOrder }` and the project list,
 * so they are easy to test and the tab only has to show them. The board is kept live by a Firestore listener
 * (store/listeners.js), so every change anyone makes recomputes these at once.
 */
const PRIORITIES = ['high', 'medium', 'low'];

/** Tasks that are really on the board: a column may list an id whose task is missing for a moment */
const idsOf = (column, tasks) => (column?.taskIds ?? []).filter((id) => tasks[id]);

export function boardStats(board) {
  const tasks = board?.tasks ?? {};
  const columns = (board?.columnOrder ?? []).map((id) => {
    const column = board.columns?.[id];
    return { id, title: column?.title ?? id, count: idsOf(column, tasks).length };
  });
  const total = columns.reduce((sum, c) => sum + c.count, 0);
  const done = columns.find((c) => c.id === 'done')?.count ?? 0;
  const inProgress = columns.find((c) => c.id === 'inprogress')?.count ?? 0;
  const doneIds = new Set(idsOf(board?.columns?.done, tasks));
  const onBoard = columns.flatMap((c) => idsOf(board.columns[c.id], tasks));

  const priority = Object.fromEntries(PRIORITIES.map((p) => [p, 0]));
  let openHigh = 0;
  let images = 0;
  const people = {}; // uid -> { open, done }
  let unassigned = 0;
  for (const id of onBoard) {
    const task = tasks[id];
    const isDone = doneIds.has(id);
    if (PRIORITIES.includes(task.priority)) priority[task.priority] += 1;
    if (task.priority === 'high' && !isDone) openHigh += 1;
    images += task.attachments?.length ?? 0;
    const users = task.users ?? [];
    if (users.length === 0 && !isDone) unassigned += 1;
    for (const uid of users) {
      people[uid] ??= { open: 0, done: 0 };
      people[uid][isDone ? 'done' : 'open'] += 1;
    }
  }
  return {
    total,
    done,
    inProgress,
    todo: total - done - inProgress,
    percentDone: total === 0 ? 0 : Math.round((done / total) * 100),
    openHigh,
    images,
    priority,
    columns,
    // busiest first, then by id so the order never jumps around for equal counts
    people: Object.entries(people)
      .map(([uid, counts]) => ({ uid, ...counts }))
      .sort((a, b) => b.open - a.open || b.done - a.done || a.uid.localeCompare(b.uid)),
    unassigned,
  };
}

/** One row per project, from the project documents the user's listener already holds */
export function projectsSummary(projects) {
  return (projects ?? []).map((project) => {
    const stats = boardStats({ tasks: project.tasks ?? {}, columns: project.columns ?? {}, columnOrder: project.columnOrder ?? [] });
    return { id: project.id, name: project.name, total: stats.total, done: stats.done, percentDone: stats.percentDone };
  });
}

/** "just now" | seconds | minutes | hours, as a [unit, amount] pair the UI turns into words */
export function ageOf(receivedAt, now) {
  if (!receivedAt) return null;
  const seconds = Math.max(0, Math.floor((now - receivedAt) / 1000));
  if (seconds < 2) return ['now', 0];
  if (seconds < 60) return ['seconds', seconds];
  if (seconds < 3600) return ['minutes', Math.floor(seconds / 60)];
  return ['hours', Math.floor(seconds / 3600)];
}
