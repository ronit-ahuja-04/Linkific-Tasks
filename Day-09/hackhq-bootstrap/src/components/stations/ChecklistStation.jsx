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
import {
  Badge as BsBadge,
  Button as BsButton,
  ButtonGroup,
  Form,
  InputGroup,
  ListGroup,
  ProgressBar,
} from 'react-bootstrap';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Button, Card, Eyebrow, cx } from '../ui.jsx';
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

  const iconBtn = 'p-1 lh-1 text-body-secondary';

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

      <div className="d-flex flex-column gap-4">
        {/* Progress Metric & Thin Bar (CL-5) */}
        <section className="rounded-4 p-3 p-sm-4 shadow-sm panel-board">
          <div className="mb-3 d-flex align-items-end justify-content-between gap-3">
            <div>
              <Eyebrow className="mb-1 text-reset opacity-75">Setup progress</Eyebrow>
              <span className="fs-4 fw-bold">
                {progress.done} of {progress.total} done
              </span>
            </div>
            <span className="display-5 fw-bold text-brand lh-1">{progress.percentage}%</span>
          </div>
          <ProgressBar
            now={progress.percentage}
            label={`${progress.percentage}%`}
            visuallyHidden
            aria-label="Checklist completion progress"
            style={{ height: 8 }}
            className="bg-secondary bg-opacity-25"
            variant="brand"
          />
        </section>

        {/* Add Task Controlled Form (CL-1) */}
        <Form onSubmit={handleAddTask} noValidate>
          <Form.Label htmlFor={inputId} visuallyHidden>
            Add setup task
          </Form.Label>
          <InputGroup hasValidation>
            <Form.Control
              id={inputId}
              type="text"
              maxLength={80}
              placeholder="Add a new setup task (e.g., Verify sponsor power strips)..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (inputError) setInputError('');
              }}
              className="py-2"
              isInvalid={!!inputError}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? `${inputId}-error` : undefined}
            />
            <Button type="submit" title="Add task" className="px-3 px-sm-4">
              <Plus size={18} aria-hidden="true" />
              <span>Add task</span>
            </Button>
            {inputError && (
              <Form.Control.Feedback type="invalid" id={`${inputId}-error`} role="alert">
                {inputError}
              </Form.Control.Feedback>
            )}
          </InputGroup>
        </Form>

        {/* Segmented Filter Control & Actions (CL-4, CL-6) */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <ButtonGroup role="tablist" aria-label="Filter tasks">
            {[
              ['all', 'All', tasks.length],
              ['open', 'Open', openCount],
              ['done', 'Done', doneCount],
            ].map(([key, label, count]) => (
              <BsButton
                key={key}
                type="button"
                role="tab"
                variant="outline-secondary"
                active={filter === key}
                aria-selected={filter === key}
                className="d-inline-flex align-items-center gap-2 fw-semibold"
                onClick={() => setFilter(key)}
              >
                <span>{label}</span>
                <BsBadge pill bg="secondary" className="font-monospace">
                  {count}
                </BsBadge>
              </BsButton>
            ))}
          </ButtonGroup>

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
        <Card className="overflow-hidden p-0">
          {visibleTasks.length === 0 ? (
            <div className="d-flex flex-column align-items-center gap-3 px-4 py-5 text-center">
              <span
                className="d-grid place-items-center rounded-circle bg-body-secondary text-body-secondary"
                style={{ width: 48, height: 48 }}
              >
                <ListFilter size={24} aria-hidden="true" />
              </span>
              <p className="mb-0 small text-body-secondary" style={{ maxWidth: '24rem' }}>
                {tasks.length === 0
                  ? 'No setup tasks yet. Add one above, or load the starter list.'
                  : 'No matching tasks found for this filter.'}
              </p>
            </div>
          ) : (
            <ListGroup as="ul" variant="flush" aria-label="Setup tasks">
              {visibleTasks.map((task) => {
                const originalIndex = tasks.findIndex((t) => t.id === task.id);
                const isEditing = editingId === task.id;

                return (
                  <ListGroup.Item
                    as="li"
                    key={task.id}
                    action={false}
                    className={cx(
                      'd-flex align-items-center gap-2 gap-sm-3 px-3 py-2',
                      task.done && 'bg-body-tertiary'
                    )}
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.done}
                      className="btn btn-link flex-shrink-0 p-0 lh-1"
                      onClick={() => handleToggleTask(task.id)}
                      aria-label={
                        task.done
                          ? `Mark "${task.text}" as incomplete`
                          : `Mark "${task.text}" as complete`
                      }
                    >
                      {task.done ? (
                        <CheckSquare size={22} className="animate-pop text-success" />
                      ) : (
                        <Square size={22} className="text-body-secondary" />
                      )}
                    </button>

                    <div className="flex-grow-1 min-w-0">
                      {isEditing ? (
                        <InputGroup size="sm">
                          <Form.Control
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                            autoFocus
                            maxLength={80}
                            aria-label="Edit task description"
                          />
                          <BsButton
                            type="button"
                            variant="outline-success"
                            onClick={() => saveEditing(task.id)}
                            title="Save changes (Enter)"
                          >
                            <Check size={16} />
                          </BsButton>
                          <BsButton
                            type="button"
                            variant="outline-secondary"
                            onClick={cancelEditing}
                            title="Cancel editing (Esc)"
                          >
                            <X size={16} />
                          </BsButton>
                        </InputGroup>
                      ) : (
                        <span
                          className={cx(
                            'd-block fw-medium text-break',
                            task.done
                              ? 'text-body-secondary text-decoration-line-through'
                              : 'text-body'
                          )}
                          onDoubleClick={() => startEditing(task)}
                          title="Double-click to edit"
                        >
                          {task.text}
                        </span>
                      )}
                    </div>

                    <div className="d-flex flex-shrink-0 align-items-center">
                      {!isEditing && (
                        <BsButton
                          type="button"
                          variant="link"
                          className={iconBtn}
                          onClick={() => startEditing(task)}
                          title="Edit task text"
                          aria-label={`Edit "${task.text}"`}
                        >
                          <Edit2 size={15} />
                        </BsButton>
                      )}

                      <BsButton
                        type="button"
                        variant="link"
                        className={iconBtn}
                        onClick={() => handleMoveUp(originalIndex)}
                        disabled={originalIndex === 0}
                        title="Move task up"
                        aria-label={`Move "${task.text}" up`}
                      >
                        <ArrowUp size={15} />
                      </BsButton>

                      <BsButton
                        type="button"
                        variant="link"
                        className={iconBtn}
                        onClick={() => handleMoveDown(originalIndex)}
                        disabled={originalIndex === tasks.length - 1}
                        title="Move task down"
                        aria-label={`Move "${task.text}" down`}
                      >
                        <ArrowDown size={15} />
                      </BsButton>

                      <BsButton
                        type="button"
                        variant="link"
                        className="p-1 lh-1 text-danger"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                        aria-label={`Delete "${task.text}"`}
                      >
                        <Trash2 size={15} />
                      </BsButton>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Card>

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
