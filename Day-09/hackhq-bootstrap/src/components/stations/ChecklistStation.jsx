import { useState, useId } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import confetti from 'canvas-confetti';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ListFilter,
} from 'lucide-react';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Button, Card, Eyebrow, cx, errorClass, inputClass } from '../ui.jsx';
import { STARTER_TASKS } from '../../data/starterTasks.js';
import {
  createTask,
  filterTasks,
  calculateProgress,
  insertTaskAtIndex,
  swapTaskPosition,
  mergeStarterTasks,
} from '../../lib/checklist.js';

export default function ChecklistStation({ xrayOn, onToggleXray, onNotify }) {
  // Tasks state persisted in localStorage (LS-1, drop-in tuple replacement)
  const [tasks, setTasks] = useLocalStorage('hackhq_tasks', STARTER_TASKS);
  const [filter, setFilter] = useState('all');
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('');

  // Inline editing state (CL-10)
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const inputId = useId();

  // Pure derived state computations (CL-4, CL-5)
  const progress = calculateProgress(tasks);
  const visibleTasks = filterTasks(tasks, filter);

  const openCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  // Add Task Handler (CL-1)
  const handleAddTask = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();

    if (!trimmed) {
      setInputError('Task description cannot be empty.');
      return;
    }

    if (trimmed.length > 80) {
      setInputError('Task description must be 80 characters or fewer.');
      return;
    }

    const newTask = createTask(trimmed);
    setTasks((prev) => [newTask, ...prev]);
    setInputText('');
    setInputError('');
    onNotify('Task added', null, 'success');
  };

  // Toggle Task Handler with Confetti (CL-2, CL-9)
  const handleToggleTask = (id) => {
    setTasks((prev) => {
      const nextTasks = prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task));

      // Check if completing this task finishes all tasks (minimum 3 tasks)
      const nextProgress = calculateProgress(nextTasks);
      if (nextProgress.isComplete) {
        // Fire confetti directly from event handler, respecting reduced motion
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2F5BFF', '#FFC93C', '#0F7A64', '#C42B31'],
          });
        }
        onNotify('All tasks completed! Hackathon setup is ready.', null, 'success');
      }

      return nextTasks;
    });
  };

  // Delete Task Handler with Undo Action (CL-3, CL-8)
  const handleDeleteTask = (id) => {
    const originalIndex = tasks.findIndex((t) => t.id === id);
    const taskToDelete = tasks[originalIndex];

    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));

    // Offer Undo in the toast notification (CL-8)
    onNotify(
      `Deleted "${taskToDelete.text.slice(0, 30)}${taskToDelete.text.length > 30 ? '...' : ''}"`,
      {
        label: 'Undo',
        onClick: () => {
          setTasks((prev) => insertTaskAtIndex(prev, taskToDelete, originalIndex));
        },
      },
      'info'
    );
  };

  // Inline Editing Handlers (CL-10)
  const startEditing = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEditing = (id) => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text: trimmed.slice(0, 80) } : t)));
    setEditingId(null);
    setEditText('');
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Swap Position Handlers (CL-11)
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setTasks((prev) => swapTaskPosition(prev, index, index - 1));
  };

  const handleMoveDown = (index) => {
    if (index >= tasks.length - 1) return;
    setTasks((prev) => swapTaskPosition(prev, index, index + 1));
  };

  // Clear Completed Tasks Handler (CL-6)
  const handleClearCompleted = () => {
    const countToClear = doneCount;
    if (countToClear === 0) return;
    setTasks((prev) => prev.filter((t) => !t.done));
    onNotify(`Cleared ${countToClear} completed tasks`, null, 'info');
  };

  // Add Starter Tasks Handler (CL-7)
  const handleLoadStarters = () => {
    setTasks((prev) => mergeStarterTasks(prev, STARTER_TASKS));
    onNotify('Starter setup tasks added', null, 'info');
  };

  const statePayload = {
    totalTasks: tasks.length,
    openTasks: openCount,
    doneTasks: doneCount,
    filter,
    progressPercentage: progress.percentage,
    tasks,
  };

  const tabClass = (active) =>
    cx(
      'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition',
      active ? 'bg-ink text-bg shadow-sm' : 'text-muted hover:bg-surface hover:text-ink'
    );
  const tabCountClass = (active) =>
    cx(
      'rounded-full px-1.5 font-mono text-[0.68rem] tabular-nums',
      active ? 'bg-bg/20 text-bg' : 'bg-surface text-muted'
    );
  const iconBtn =
    'inline-flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className="animate-rise">
      <PageHeader breadcrumb="Checklist" title="Checklist" pill="Live">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLoadStarters}
          title="Append starter operational tasks"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>Add starter tasks</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Progress Metric & Thin Bar (CL-5) */}
          <section className="rounded-card bg-board p-5 text-on-board shadow-card sm:p-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <Eyebrow className="mb-1 text-on-board/60">Setup progress</Eyebrow>
                <span className="font-display text-xl font-bold tabular-nums sm:text-2xl">
                  {progress.done} of {progress.total} done
                </span>
              </div>
              <span className="font-display text-4xl font-bold tracking-tight text-brand tabular-nums sm:text-5xl">
                {progress.percentage}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-on-board/15"
              role="progressbar"
              aria-valuenow={progress.done}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-label="Checklist completion progress"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </section>

          {/* Add Task Controlled Form (CL-1) */}
          <form onSubmit={handleAddTask}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor={inputId} className="sr-only">
                Add setup task
              </label>
              <input
                id={inputId}
                type="text"
                maxLength={80}
                placeholder="Add a new setup task (e.g., Verify sponsor power strips)..."
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (inputError) setInputError('');
                }}
                className={cx(inputClass, 'flex-1 py-3')}
                aria-invalid={!!inputError}
                aria-describedby={inputError ? `${inputId}-error` : undefined}
              />
              <Button type="submit" title="Add task" className="sm:px-5">
                <Plus size={18} aria-hidden="true" />
                <span>Add task</span>
              </Button>
            </div>
            {inputError && (
              <p id={`${inputId}-error`} className={errorClass} role="alert">
                {inputError}
              </p>
            )}
          </form>

          {/* Segmented Filter Control & Actions (CL-4, CL-6) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="inline-flex gap-1 rounded-xl border border-line bg-surface-2 p-1"
              role="tablist"
              aria-label="Filter tasks"
            >
              {[
                ['all', 'All', tasks.length],
                ['open', 'Open', openCount],
                ['done', 'Done', doneCount],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={tabClass(filter === key)}
                  onClick={() => setFilter(key)}
                >
                  <span>{label}</span>
                  <span className={tabCountClass(filter === key)}>{count}</span>
                </button>
              ))}
            </div>

            {doneCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCompleted}
                title="Remove completed tasks"
              >
                Clear completed ({doneCount})
              </Button>
            )}
          </div>

          {/* Ruled Strip Whiteboard Task List (CL-2, CL-3, CL-10, CL-11) */}
          <Card className="overflow-hidden">
            {visibleTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-muted">
                  <ListFilter size={24} aria-hidden="true" />
                </span>
                <p className="max-w-sm text-sm text-muted">
                  {tasks.length === 0
                    ? 'No setup tasks yet. Add one above, or load the starter list.'
                    : 'No matching tasks found for this filter.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line" aria-label="Setup tasks">
                {visibleTasks.map((task) => {
                  const originalIndex = tasks.findIndex((t) => t.id === task.id);
                  const isEditing = editingId === task.id;

                  return (
                    <li
                      key={task.id}
                      className={cx(
                        'group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2/60 sm:px-5',
                        task.done && 'bg-surface-2/40'
                      )}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.done}
                        className="shrink-0 rounded-md p-0.5 transition active:scale-90 focus-visible:outline-2 focus-visible:outline-accent"
                        onClick={() => handleToggleTask(task.id)}
                        aria-label={
                          task.done
                            ? `Mark "${task.text}" as incomplete`
                            : `Mark "${task.text}" as complete`
                        }
                      >
                        {task.done ? (
                          <CheckSquare size={22} className="animate-pop text-good" />
                        ) : (
                          <Square size={22} className="text-muted hover:text-ink" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                              autoFocus
                              maxLength={80}
                              className={cx(inputClass, 'min-w-0 flex-1 py-1.5')}
                              aria-label="Edit task description"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditing(task.id)}
                              className={cx(iconBtn, 'bg-good-soft text-good hover:bg-good-soft')}
                              title="Save changes (Enter)"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className={iconBtn}
                              title="Cancel editing (Esc)"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={cx(
                              'block break-words text-sm font-medium transition sm:text-base',
                              task.done ? 'text-muted line-through' : 'text-ink'
                            )}
                            onDoubleClick={() => startEditing(task)}
                            title="Double-click to edit"
                          >
                            {task.text}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5 sm:opacity-60 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                        {!isEditing && (
                          <button
                            type="button"
                            className={iconBtn}
                            onClick={() => startEditing(task)}
                            title="Edit task text"
                            aria-label={`Edit "${task.text}"`}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() => handleMoveUp(originalIndex)}
                          disabled={originalIndex === 0}
                          title="Move task up"
                          aria-label={`Move "${task.text}" up`}
                        >
                          <ArrowUp size={15} />
                        </button>

                        <button
                          type="button"
                          className={iconBtn}
                          onClick={() => handleMoveDown(originalIndex)}
                          disabled={originalIndex === tasks.length - 1}
                          title="Move task down"
                          aria-label={`Move "${task.text}" down`}
                        >
                          <ArrowDown size={15} />
                        </button>

                        <button
                          type="button"
                          className={cx(iconBtn, 'hover:bg-bad-soft hover:text-bad')}
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                          aria-label={`Delete "${task.text}"`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Checklist"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
