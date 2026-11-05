/**
 * Pure board logic. No React, no Firebase, no Redux: these functions take a board
 * `{ tasks, columns, columnOrder }` and return a new one, so they are easy to test and the
 * Redux reducers can reuse them.
 */
export const makeEmptyBoard = () => ({
  tasks: {},
  columns: {
    todo: { id: 'todo', title: 'To Do', taskIds: [] },
    inprogress: { id: 'inprogress', title: 'In Progress', taskIds: [] },
    done: { id: 'done', title: 'Done', taskIds: [] },
  },
  columnOrder: ['todo', 'inprogress', 'done'],
});

export const findColumnOfTask = (board, taskId) =>
  Object.values(board.columns).find((col) => col.taskIds.includes(taskId))?.id ?? null;

/**
 * Result of a drag-and-drop ({ source, destination, draggableId } as given by @hello-pangea/dnd).
 * Returns the SAME board object when nothing should change: dropped outside a column, dropped
 * in place, or moving a task out of "Done" (finished tasks stay finished).
 */
export function moveTask(board, { source, destination, draggableId }) {
  if (!destination) return board;
  if (destination.droppableId === source.droppableId && destination.index === source.index) {
    return board;
  }
  if (source.droppableId === 'done' && destination.droppableId !== 'done') return board;

  const start = board.columns[source.droppableId];
  const finish = board.columns[destination.droppableId];
  if (!start || !finish) return board;

  if (start === finish) {
    const taskIds = [...start.taskIds];
    taskIds.splice(source.index, 1);
    taskIds.splice(destination.index, 0, draggableId);
    return { ...board, columns: { ...board.columns, [start.id]: { ...start, taskIds } } };
  }

  const startIds = [...start.taskIds];
  startIds.splice(source.index, 1);
  const finishIds = [...finish.taskIds];
  finishIds.splice(destination.index, 0, draggableId);
  return {
    ...board,
    columns: {
      ...board.columns,
      [start.id]: { ...start, taskIds: startIds },
      [finish.id]: { ...finish, taskIds: finishIds },
    },
  };
}

/** Add a task at the end of a column */
export function addTask(board, task, columnId) {
  const column = board.columns[columnId];
  if (!column) return board;
  return {
    ...board,
    tasks: { ...board.tasks, [task.id]: task },
    columns: { ...board.columns, [columnId]: { ...column, taskIds: [...column.taskIds, task.id] } },
  };
}

/** Remove a task from the map and from whichever column holds it */
export function removeTask(board, taskId) {
  const columnId = findColumnOfTask(board, taskId);
  if (!columnId) return board;
  const { [taskId]: _removed, ...tasks } = board.tasks;
  const column = board.columns[columnId];
  return {
    ...board,
    tasks,
    columns: {
      ...board.columns,
      [columnId]: { ...column, taskIds: column.taskIds.filter((id) => id !== taskId) },
    },
  };
}

/** Replace one task's data (edits from the task panel) */
export function updateTask(board, task) {
  if (!board.tasks[task.id]) return board;
  return { ...board, tasks: { ...board.tasks, [task.id]: task } };
}

/** Build a brand new task object (draft until saved) */
export function createDraftTask({ columnId, uid }) {
  return {
    id: `task-${Date.now()}`,
    content: '',
    description: '',
    date: new Date().toLocaleDateString(),
    priority: 'medium',
    tags: [],
    comments: 0,
    users: [uid].filter(Boolean),
    _isDraft: true,
    _columnId: columnId,
  };
}
