import { useState, useId, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import styled, { css } from 'styled-components';
import StateXray from '../StateXray.jsx';
import PageHeader from '../layout/PageHeader.jsx';
import { Button, Card, Eyebrow, Board, Input, ErrorText, Stack } from '../ui.jsx';
import { animateRise, animatePop } from '../../styles/animations.js';
import { calculateProgress } from '../../lib/checklist.js';
import {
  addTask,
  toggleTask,
  removeTask,
  restoreTask,
  editTask,
  moveTask,
  clearCompleted,
  restoreStarterTasks,
  selectTasks,
  selectProgress,
  makeSelectFilteredTasks,
} from '../../store/slices/tasksSlice.js';
import { selectXrayOn, toggleXray } from '../../store/slices/uiSlice.js';
import { notify } from '../../store/slices/toastsSlice.js';

const Page = styled.div`
  ${animateRise}
`;
const ProgressBoard = styled(Board)`
  padding: ${({ theme }) => theme.space(3)};
  box-shadow: ${({ theme }) => theme.shadow};
  border-radius: 1rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: ${({ theme }) => theme.space(4)};
  }
`;
const ProgressHead = styled.div`
  margin-bottom: ${({ theme }) => theme.space(3)};
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  ${Eyebrow} {
    margin-bottom: ${({ theme }) => theme.space(1)};
    color: inherit;
    opacity: 0.75;
  }
`;
const ProgressText = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
`;
const Percent = styled.span`
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  color: ${({ theme }) => theme.colors.accent};
`;
const ProgressTrack = styled.div`
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgb(255 255 255 / 0.2);
`;
const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 0.3s ease;
`;
const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const HiddenLabel = styled(VisuallyHidden).attrs({ as: 'label' })``;
const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  > ${Input} {
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  > ${Button} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  ${({ theme }) => theme.media.down('sm')} {
    > ${Button} {
      padding-inline: ${({ theme }) => theme.space(3)};
    }
  }
`;
const InlineError = styled(ErrorText)`
  width: 100%;
  margin-top: ${({ theme }) => theme.space(1)};
`;
const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;
const Segmented = styled.div`
  display: inline-flex;
`;
const Segment = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme, $active }) => ($active ? theme.colors.ink : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.bg : theme.colors.ink)};
  &:not(:first-child) {
    margin-left: -1px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
  &:not(:last-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  &:first-child {
    border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
  }
  &:last-child {
    border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
  }
  &:hover:not([aria-selected='true']) {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;
const CountPill = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  padding: 0.15em 0.6em;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.surface};
`;
const ListCard = styled(Card)`
  overflow: hidden;
  padding: 0;
`;
const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(4)}`};
  text-align: center;
`;
const EmptyIcon = styled.span`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
`;
const EmptyText = styled.p`
  margin: 0;
  max-width: 24rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const TaskList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  > li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
`;
const TaskItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(3)}`};
  background: ${({ theme, $done }) => ($done ? theme.colors.surface2 : 'transparent')};
  ${({ theme }) => theme.media.up('sm')} {
    gap: ${({ theme }) => theme.space(3)};
  }
`;
const bareButton = css`
  display: inline-flex;
  align-items: center;
  background: none;
  border: 0;
  line-height: 1;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
const CheckButton = styled.button`
  ${bareButton}
  flex-shrink: 0;
  padding: 0;
  color: ${({ theme, $done }) => ($done ? theme.colors.good : theme.colors.muted)};
  ${({ $done }) =>
    $done &&
    css`
      svg {
        ${animatePop}
      }
    `}
`;
const TaskBody = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;
const TaskText = styled.span`
  display: block;
  font-weight: 500;
  overflow-wrap: anywhere;
  color: ${({ theme, $done }) => ($done ? theme.colors.muted : theme.colors.ink)};
  ${({ $done }) => $done && 'text-decoration: line-through;'}
`;
const EditGroup = styled(InputGroup)`
  > ${Input} {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  > button {
    border-radius: 0;
  }
  > button:last-child {
    border-top-right-radius: ${({ theme }) => theme.radii.md};
    border-bottom-right-radius: ${({ theme }) => theme.radii.md};
  }
`;
const EditAction = styled.button`
  ${bareButton}
  padding: 0.25rem 0.5rem;
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'good' ? theme.colors.good : theme.colors.line)};
  color: ${({ theme, $tone }) => ($tone === 'good' ? theme.colors.good : theme.colors.muted)};
  margin-left: -1px;
  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;
const RowActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
`;
const RowIconButton = styled.button`
  ${bareButton}
  padding: 0.25rem;
  color: ${({ theme, $danger }) => ($danger ? theme.colors.bad : theme.colors.muted)};
  &:hover:not(:disabled) {
    color: ${({ theme, $danger }) => ($danger ? theme.colors.bad : theme.colors.ink)};
  }
`;

export default function ChecklistStation() {
  // UI-only state stays local on purpose: only the tasks themselves are global
  const [filter, setFilter] = useState('all');
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState('');

  // Inline editing state (CL-10)
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const inputId = useId();

  // REDUX: useSelector subscribes this component to just these slices of state (tasks,
  // derived progress, X-ray flag); useDispatch sends actions to the reducers in tasksSlice.
  const tasks = useSelector(selectTasks);
  const progress = useSelector(selectProgress);
  const selectVisibleTasks = useMemo(() => makeSelectFilteredTasks(filter), [filter]);
  const visibleTasks = useSelector(selectVisibleTasks);
  const xrayOn = useSelector(selectXrayOn);
  const dispatch = useDispatch();
  const onNotify = (message, action, type) => dispatch(notify(message, action, type));

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

    dispatch(addTask(trimmed));
    setInputText('');
    setInputError('');
    onNotify('Task added', null, 'success');
  };

  // Toggle Task Handler with Confetti (CL-2, CL-9)
  const handleToggleTask = (id) => {
    // Side effects (confetti, toast) fire here in the handler, never inside a reducer
    const nextTasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
    const nextProgress = calculateProgress(nextTasks);
    dispatch(toggleTask(id));

    // Check if completing this task finishes all tasks (minimum 3 tasks)
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
  };

  // Delete Task Handler with Undo Action (CL-3, CL-8)
  const handleDeleteTask = (id) => {
    const originalIndex = tasks.findIndex((t) => t.id === id);
    const taskToDelete = tasks[originalIndex];

    if (!taskToDelete) return;

    dispatch(removeTask(id));

    // Offer Undo in the toast notification (CL-8)
    onNotify(
      `Deleted "${taskToDelete.text.slice(0, 30)}${taskToDelete.text.length > 30 ? '...' : ''}"`,
      {
        label: 'Undo',
        onClick: () => {
          dispatch(restoreTask({ task: taskToDelete, index: originalIndex }));
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

    dispatch(editTask({ id, text: trimmed }));
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
    dispatch(moveTask({ from: index, to: index - 1 }));
  };

  const handleMoveDown = (index) => {
    if (index >= tasks.length - 1) return;
    dispatch(moveTask({ from: index, to: index + 1 }));
  };

  // Clear Completed Tasks Handler (CL-6)
  const handleClearCompleted = () => {
    const countToClear = doneCount;
    if (countToClear === 0) return;
    dispatch(clearCompleted());
    onNotify(`Cleared ${countToClear} completed tasks`, null, 'info');
  };

  // Add Starter Tasks Handler (CL-7)
  const handleLoadStarters = () => {
    dispatch(restoreStarterTasks());
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
    <Page>
      <PageHeader breadcrumb="Checklist" title="Checklist" pill="Live">
        <Button
          $variant="secondary"
          $size="sm"
          onClick={handleLoadStarters}
          title="Append starter operational tasks"
        >
          <Sparkles size={16} aria-hidden="true" />
          <span>Add starter tasks</span>
        </Button>
      </PageHeader>

      <Stack $gap={4}>
        {/* Progress Metric & Thin Bar (CL-5) */}
        <ProgressBoard as="section">
          <ProgressHead>
            <div>
              <Eyebrow>Setup progress</Eyebrow>
              <ProgressText>
                {progress.done} of {progress.total} done
              </ProgressText>
            </div>
            <Percent>{progress.percentage}%</Percent>
          </ProgressHead>
          <ProgressTrack
            role="progressbar"
            aria-label="Checklist completion progress"
            aria-valuenow={progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <ProgressFill $pct={progress.percentage} />
            <VisuallyHidden>{`${progress.percentage}%`}</VisuallyHidden>
          </ProgressTrack>
        </ProgressBoard>

        {/* Add Task Controlled Form (CL-1) */}
        <form onSubmit={handleAddTask} noValidate>
          <HiddenLabel htmlFor={inputId}>Add setup task</HiddenLabel>
          <InputGroup>
            <Input
              id={inputId}
              type="text"
              maxLength={80}
              placeholder="Add a new setup task (e.g., Verify sponsor power strips)..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (inputError) setInputError('');
              }}
              $invalid={!!inputError}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? `${inputId}-error` : undefined}
            />
            <Button type="submit" title="Add task">
              <Plus size={18} aria-hidden="true" />
              <span>Add task</span>
            </Button>
            {inputError && (
              <InlineError id={`${inputId}-error`} role="alert">
                {inputError}
              </InlineError>
            )}
          </InputGroup>
        </form>

        {/* Segmented Filter Control & Actions (CL-4, CL-6) */}
        <FilterRow>
          <Segmented role="tablist" aria-label="Filter tasks">
            {[
              ['all', 'All', tasks.length],
              ['open', 'Open', openCount],
              ['done', 'Done', doneCount],
            ].map(([key, label, count]) => (
              <Segment
                key={key}
                type="button"
                role="tab"
                $active={filter === key}
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
              >
                <span>{label}</span>
                <CountPill>{count}</CountPill>
              </Segment>
            ))}
          </Segmented>

          {doneCount > 0 && (
            <Button
              $variant="ghost"
              $size="sm"
              onClick={handleClearCompleted}
              title="Remove completed tasks"
            >
              Clear completed ({doneCount})
            </Button>
          )}
        </FilterRow>

        {/* Ruled Strip Whiteboard Task List (CL-2, CL-3, CL-10, CL-11) */}
        <ListCard>
          {visibleTasks.length === 0 ? (
            <EmptyState>
              <EmptyIcon>
                <ListFilter size={24} aria-hidden="true" />
              </EmptyIcon>
              <EmptyText>
                {tasks.length === 0
                  ? 'No setup tasks yet. Add one above, or load the starter list.'
                  : 'No matching tasks found for this filter.'}
              </EmptyText>
            </EmptyState>
          ) : (
            <TaskList aria-label="Setup tasks">
              {visibleTasks.map((task) => {
                const originalIndex = tasks.findIndex((t) => t.id === task.id);
                const isEditing = editingId === task.id;

                return (
                  <TaskItem key={task.id} $done={task.done}>
                    <CheckButton
                      type="button"
                      role="checkbox"
                      $done={task.done}
                      aria-checked={task.done}
                      onClick={() => handleToggleTask(task.id)}
                      aria-label={
                        task.done
                          ? `Mark "${task.text}" as incomplete`
                          : `Mark "${task.text}" as complete`
                      }
                    >
                      {task.done ? <CheckSquare size={22} /> : <Square size={22} />}
                    </CheckButton>

                    <TaskBody>
                      {isEditing ? (
                        <EditGroup>
                          <Input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                            autoFocus
                            maxLength={80}
                            aria-label="Edit task description"
                          />
                          <EditAction
                            type="button"
                            $tone="good"
                            onClick={() => saveEditing(task.id)}
                            title="Save changes (Enter)"
                          >
                            <Check size={16} />
                          </EditAction>
                          <EditAction
                            type="button"
                            onClick={cancelEditing}
                            title="Cancel editing (Esc)"
                          >
                            <X size={16} />
                          </EditAction>
                        </EditGroup>
                      ) : (
                        <TaskText
                          $done={task.done}
                          onDoubleClick={() => startEditing(task)}
                          title="Double-click to edit"
                        >
                          {task.text}
                        </TaskText>
                      )}
                    </TaskBody>

                    <RowActions>
                      {!isEditing && (
                        <RowIconButton
                          type="button"
                          onClick={() => startEditing(task)}
                          title="Edit task text"
                          aria-label={`Edit "${task.text}"`}
                        >
                          <Edit2 size={15} />
                        </RowIconButton>
                      )}

                      <RowIconButton
                        type="button"
                        onClick={() => handleMoveUp(originalIndex)}
                        disabled={originalIndex === 0}
                        title="Move task up"
                        aria-label={`Move "${task.text}" up`}
                      >
                        <ArrowUp size={15} />
                      </RowIconButton>

                      <RowIconButton
                        type="button"
                        onClick={() => handleMoveDown(originalIndex)}
                        disabled={originalIndex === tasks.length - 1}
                        title="Move task down"
                        aria-label={`Move "${task.text}" down`}
                      >
                        <ArrowDown size={15} />
                      </RowIconButton>

                      <RowIconButton
                        type="button"
                        $danger
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                        aria-label={`Delete "${task.text}"`}
                      >
                        <Trash2 size={15} />
                      </RowIconButton>
                    </RowActions>
                  </TaskItem>
                );
              })}
            </TaskList>
          )}
        </ListCard>

        <StateXray
          isOpen={xrayOn}
          stationName="Checklist"
          statePayload={statePayload}
          onClose={() => dispatch(toggleXray())}
        />
      </Stack>
    </Page>
  );
}
