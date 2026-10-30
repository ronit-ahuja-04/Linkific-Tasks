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

  return (
    <div className="station-view station-checklist">
      <div className="station-breadcrumb">CONTROL ROOM / CHECKLIST</div>

      <div className="station-header">
        <div className="station-title-row">
          <h1 className="station-title">Checklist</h1>
          <span className="live-status-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Live</span>
          </span>
        </div>
        <div className="station-header-actions">
          <button
            type="button"
            className="btn btn-starter-tasks"
            onClick={handleLoadStarters}
            title="Append starter operational tasks"
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Add starter tasks</span>
          </button>
        </div>
      </div>

      <div className="station-layout">
        <div className="station-workspace">
          {/* Progress Metric & Thin Bar (CL-5) */}
          <div className="checklist-progress-bar-wrap">
            <div className="checklist-progress-meta">
              <span className="checklist-progress-count tabular-nums">
                {progress.done} of {progress.total} done
              </span>
              <span className="checklist-progress-pct tabular-nums">{progress.percentage}%</span>
            </div>
            <div
              className="checklist-progress-track"
              role="progressbar"
              aria-valuenow={progress.done}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-label="Checklist completion progress"
            >
              <div
                className="checklist-progress-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Add Task Controlled Form (CL-1) */}
          <form onSubmit={handleAddTask} className="add-task-form">
            <div className="task-input-wrapper">
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
                className={`task-text-input ${inputError ? 'input-error' : ''}`}
                aria-invalid={!!inputError}
                aria-describedby={inputError ? `${inputId}-error` : undefined}
              />
              <button type="submit" className="btn btn-primary btn-add-task" title="Add task">
                <Plus size={18} aria-hidden="true" />
                <span>Add task</span>
              </button>
            </div>
            {inputError && (
              <p id={`${inputId}-error`} className="task-error-text" role="alert">
                {inputError}
              </p>
            )}
          </form>

          {/* Segmented Filter Control & Actions (CL-4, CL-6) */}
          <div className="checklist-toolbar">
            <div className="filter-segmented-control" role="tablist" aria-label="Filter tasks">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                <span>All</span>
                <span className="filter-count tabular-nums">{tasks.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'open'}
                className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
                onClick={() => setFilter('open')}
              >
                <span>Open</span>
                <span className="filter-count tabular-nums">{openCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'done'}
                className={`filter-tab ${filter === 'done' ? 'active' : ''}`}
                onClick={() => setFilter('done')}
              >
                <span>Done</span>
                <span className="filter-count tabular-nums">{doneCount}</span>
              </button>
            </div>

            {doneCount > 0 && (
              <button
                type="button"
                className="btn-clear-completed"
                onClick={handleClearCompleted}
                title="Remove completed tasks"
              >
                Clear completed ({doneCount})
              </button>
            )}
          </div>

          {/* Ruled Strip Whiteboard Task List (CL-2, CL-3, CL-10, CL-11) */}
          <div className="checklist-strip-container">
            {visibleTasks.length === 0 ? (
              <div className="checklist-empty-state">
                <ListFilter size={24} className="empty-icon" aria-hidden="true" />
                <p className="empty-title">
                  {tasks.length === 0
                    ? 'No setup tasks yet. Add one above, or load the starter list.'
                    : 'No matching tasks found for this filter.'}
                </p>
              </div>
            ) : (
              <ul className="checklist-strip-list" aria-label="Setup tasks">
                {visibleTasks.map((task) => {
                  const originalIndex = tasks.findIndex((t) => t.id === task.id);
                  const isEditing = editingId === task.id;

                  return (
                    <li
                      key={task.id}
                      className={`checklist-strip-item ${task.done ? 'is-done' : ''}`}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={task.done}
                        className="task-checkbox-btn"
                        onClick={() => handleToggleTask(task.id)}
                        aria-label={
                          task.done
                            ? `Mark "${task.text}" as incomplete`
                            : `Mark "${task.text}" as complete`
                        }
                      >
                        {task.done ? (
                          <CheckSquare size={22} className="check-icon-done" />
                        ) : (
                          <Square size={22} className="check-icon-open" />
                        )}
                      </button>

                      <div className="task-content-area">
                        {isEditing ? (
                          <div className="inline-edit-wrapper">
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                              autoFocus
                              maxLength={80}
                              className="inline-edit-input"
                              aria-label="Edit task description"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditing(task.id)}
                              className="btn-inline-action save"
                              title="Save changes (Enter)"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="btn-inline-action cancel"
                              title="Cancel editing (Esc)"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="task-text-label"
                            onDoubleClick={() => startEditing(task)}
                            title="Double-click to edit"
                          >
                            {task.text}
                          </span>
                        )}
                      </div>

                      <div className="task-actions-group">
                        {!isEditing && (
                          <button
                            type="button"
                            className="btn-task-action"
                            onClick={() => startEditing(task)}
                            title="Edit task text"
                            aria-label={`Edit "${task.text}"`}
                          >
                            <Edit2 size={15} />
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-task-action"
                          onClick={() => handleMoveUp(originalIndex)}
                          disabled={originalIndex === 0}
                          title="Move task up"
                          aria-label={`Move "${task.text}" up`}
                        >
                          <ArrowUp size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-task-action"
                          onClick={() => handleMoveDown(originalIndex)}
                          disabled={originalIndex === tasks.length - 1}
                          title="Move task down"
                          aria-label={`Move "${task.text}" down`}
                        >
                          <ArrowDown size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-task-action action-delete"
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
          </div>
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
