import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createProject, createTask, deleteProject, deleteTask, listProjects, listTasks, updateTask } from '../../api/projectsApi';
import TaskCard from '../../components/app/TaskCard';
import { COLUMNS } from '../../components/app/columns';
import '../../styles/app.css';

const LABEL = Object.fromEntries(COLUMNS.map((c) => [c.status, c.label]));
const message = (error, fallback) => (error && error.message) || fallback;

// "FlowLane-lite": the protected content. Every request here carries the access token, and the server
// only ever returns THIS user's projects (authorization by ownership).
export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('project');

  const [projects, setProjects] = useState(null); // null = loading
  const [projectsError, setProjectsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [tasks, setTasks] = useState({ status: 'idle', items: [], error: '' });
  const [taskReload, setTaskReload] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTitleError, setTaskTitleError] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  // id of the element to focus after the next render (set by handlers, which always also change state)
  const pendingFocus = useRef(null);
  const setPendingFocus = (id) => {
    pendingFocus.current = id;
  };

  useEffect(() => {
    document.title = 'Dashboard · FlowLane';
  }, []);

  useEffect(() => {
    let cancelled = false;
    listProjects().then(
      (list) => {
        if (cancelled) return;
        setProjects(list);
        setProjectsError('');
      },
      (error) => {
        if (cancelled) return;
        setProjectsError(message(error, 'Could not load your projects.'));
        setProjects([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    listTasks(selectedId).then(
      (items) => {
        if (!cancelled) setTasks({ status: 'ready', items, error: '' });
      },
      (error) => {
        if (!cancelled) setTasks({ status: 'error', items: [], error: message(error, 'Could not load the tasks.') });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [selectedId, taskReload]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    document.getElementById(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });

  const selected = projects?.find((p) => p.id === selectedId) ?? null;
  const loadingTasks = Boolean(selectedId) && tasks.status !== 'ready' && tasks.status !== 'error';

  const selectProject = useCallback(
    (id) => {
      if (id === selectedId) return;
      setTasks({ status: 'loading', items: [], error: '' });
      setTaskTitle('');
      setTaskTitleError('');
      setParams({ project: id });
    },
    [setParams, selectedId]
  );

  function reloadProjects() {
    setProjects(null);
    setProjectsError('');
    setReloadKey((k) => k + 1);
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    const name = projectName.trim();
    if (name.length < 1 || name.length > 60) {
      setProjectNameError('Project name must be 1 to 60 characters.');
      document.getElementById('new-project-name')?.focus();
      return;
    }
    setProjectNameError('');
    setCreatingProject(true);
    try {
      const project = await createProject(name);
      setProjects((prev) => [project, ...(prev ?? [])]);
      setProjectName('');
      selectProject(project.id);
      setPendingFocus(`project-btn-${project.id}`);
      setAnnouncement(`Project ${project.name} created`);
      toast.success('Project created');
    } catch (error) {
      toast.error(message(error, 'Could not create the project.'));
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleDeleteProject(project) {
    const snapshot = projects;
    setConfirmId(null);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    if (selectedId === project.id) setParams({});
    setPendingFocus('new-project-name');
    try {
      await deleteProject(project.id);
      setAnnouncement(`Project ${project.name} deleted`);
      toast.success('Project deleted');
    } catch (error) {
      setProjects(snapshot); // rollback
      toast.error(message(error, 'Could not delete the project.'));
    }
  }

  async function handleAddTask(event) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (title.length < 1 || title.length > 120) {
      setTaskTitleError('Task title must be 1 to 120 characters.');
      document.getElementById('new-task-title')?.focus();
      return;
    }
    setTaskTitleError('');
    setAddingTask(true);
    try {
      const task = await createTask(selectedId, title);
      setTasks((prev) => ({ ...prev, items: [...prev.items, task] }));
      setTaskTitle('');
      setAnnouncement(`Task ${task.title} added to To do`);
      setPendingFocus('new-task-title');
    } catch (error) {
      toast.error(message(error, 'Could not add the task.'));
    } finally {
      setAddingTask(false);
    }
  }

  const patchTask = (id, patch) =>
    setTasks((prev) => ({ ...prev, items: prev.items.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  // Optimistic: show the change at once, ask the server, and roll back if it fails.
  async function handleMove(task, status) {
    if (status === task.status) return;
    patchTask(task.id, { status });
    setPendingFocus(`task-move-${task.id}`);
    try {
      await updateTask(task.id, { status });
      setAnnouncement(`${task.title} moved to ${LABEL[status]}`);
    } catch (error) {
      patchTask(task.id, { status: task.status });
      toast.error(message(error, 'Could not move the task.'));
    }
  }

  async function handleRename(task, title) {
    patchTask(task.id, { title });
    try {
      await updateTask(task.id, { title });
      setAnnouncement(`Task renamed to ${title}`);
    } catch (error) {
      patchTask(task.id, { title: task.title });
      toast.error(message(error, 'Could not rename the task.'));
    }
  }

  async function handleDeleteTask(task) {
    const index = tasks.items.findIndex((t) => t.id === task.id);
    setTasks((prev) => ({ ...prev, items: prev.items.filter((t) => t.id !== task.id) }));
    setPendingFocus('new-task-title');
    try {
      await deleteTask(task.id);
      setAnnouncement(`Task ${task.title} deleted`);
    } catch (error) {
      setTasks((prev) => {
        const items = [...prev.items];
        items.splice(Math.min(index, items.length), 0, task);
        return { ...prev, items };
      });
      toast.error(message(error, 'Could not delete the task.'));
    }
  }

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0];
  const counts = (project) => {
    if (selected && project.id === selected.id && tasks.status === 'ready') {
      return { total: tasks.items.length, done: tasks.items.filter((t) => t.status === 'done').length };
    }
    const c = project.taskCounts ?? { todo: 0, doing: 0, done: 0 };
    return { total: c.todo + c.doing + c.done, done: c.done };
  };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Welcome back, {firstName}</h1>
        <p className="muted">Your projects and tasks. Only you can see them.</p>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
      <div className="dash">
        <section className="card" aria-labelledby="projects-heading">
          <h2 id="projects-heading">Projects</h2>
          <form className="inline-form" onSubmit={handleCreateProject} noValidate>
            <div className="field">
              <label htmlFor="new-project-name">New project name</label>
              <input
                id="new-project-name"
                className="input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                aria-invalid={projectNameError ? 'true' : undefined}
                aria-describedby={projectNameError ? 'new-project-error' : undefined}
                autoComplete="off"
              />
              {projectNameError && <span className="field-error" id="new-project-error">{projectNameError}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={creatingProject}>
              {creatingProject ? 'Creating…' : 'Create project'}
            </button>
          </form>

          {projects === null && <p className="state-box" role="status">Loading projects…</p>}
          {projects !== null && projectsError && (
            <div className="state-box" role="alert">
              <p>{projectsError}</p>
              <button type="button" className="btn" onClick={reloadProjects}>Retry</button>
            </div>
          )}
          {projects !== null && !projectsError && projects.length === 0 && (
            <p className="state-box">No projects yet. Create your first one.</p>
          )}
          {projects !== null && projects.length > 0 && (
            <ul className="project-list">
              {projects.map((project) => {
                const c = counts(project);
                const isSelected = project.id === selectedId;
                return (
                  <li key={project.id} className="project-item" data-selected={isSelected}>
                    <button
                      type="button"
                      id={`project-btn-${project.id}`}
                      className="project-select"
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => selectProject(project.id)}
                    >
                      <span className="project-dot" style={{ background: project.color }} aria-hidden="true" />
                      <span>
                        <span className="project-name">{project.name}</span>
                        <br />
                        <span className="project-counts">{c.total} {c.total === 1 ? 'task' : 'tasks'}, {c.done} done</span>
                      </span>
                    </button>
                    <span className="project-actions">
                      {confirmId === project.id ? (
                        <span className="confirm-row">
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteProject(project)}>
                            Confirm delete {project.name}
                          </button>
                          <button type="button" className="btn btn-sm" onClick={() => setConfirmId(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button type="button" className="icon-btn" aria-label={`Delete ${project.name}`} onClick={() => setConfirmId(project.id)}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label="Board">
          {!selectedId && <p className="card state-box">Select a project to see its board.</p>}
          {selectedId && projects !== null && !selected && !projectsError && (
            <p className="card state-box">That project was not found.</p>
          )}
          {selected && (
            <div className="card">
              <h2>{selected.name}</h2>
              <form className="inline-form" onSubmit={handleAddTask} noValidate>
                <div className="field">
                  <label htmlFor="new-task-title">New task title</label>
                  <input
                    id="new-task-title"
                    className="input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    aria-invalid={taskTitleError ? 'true' : undefined}
                    aria-describedby={taskTitleError ? 'new-task-error' : undefined}
                    autoComplete="off"
                  />
                  {taskTitleError && <span className="field-error" id="new-task-error">{taskTitleError}</span>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={addingTask}>
                  {addingTask ? 'Adding…' : 'Add task'}
                </button>
              </form>
              {loadingTasks && <p className="state-box" role="status">Loading tasks…</p>}
              {tasks.status === 'error' && (
                <div className="state-box" role="alert">
                  <p>{tasks.error}</p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setTasks({ status: 'loading', items: [], error: '' });
                      setTaskReload((k) => k + 1);
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
              {tasks.status === 'ready' && (
                <div className="board">
                  {COLUMNS.map((col) => {
                    const items = tasks.items.filter((t) => t.status === col.status);
                    return (
                      <section key={col.status} className="column" data-status={col.status} aria-labelledby={`col-${col.status}`}>
                        <h3 id={`col-${col.status}`}>
                          <span>{col.label}</span>
                          <span aria-label={`${items.length} tasks`}>{items.length}</span>
                        </h3>
                        {items.length === 0 ? (
                          <p className="muted">No tasks</p>
                        ) : (
                          <ul className="task-list">
                            {items.map((task) => (
                              <TaskCard key={task.id} task={task} onMove={handleMove} onRename={handleRename} onDelete={handleDeleteTask} />
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
