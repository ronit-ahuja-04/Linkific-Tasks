import { Router } from 'express';
import { notFound, validationFailed } from '../errors.js';
import { body, str } from '../validate.js';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#059669', '#0891B2', '#CA8A04', '#4F46E5'];
const STATUSES = ['todo', 'doing', 'done'];

export function createProjectsRouter(ctx) {
  const { store, now, auth } = ctx;
  const router = Router();
  router.use(['/projects', '/tasks'], auth.requireAuth);

  const toProject = (p) => {
    const taskCounts = { todo: 0, doing: 0, done: 0 };
    for (const t of store.tasks.filter((x) => x.projectId === p.id)) taskCounts[t.status] += 1;
    return { id: p.id, name: p.name, color: p.color, taskCounts, createdAt: p.createdAt };
  };
  const toTask = (t) => ({ id: t.id, projectId: t.projectId, title: t.title, status: t.status, createdAt: t.createdAt });

  // Authorization by OWNERSHIP: the lookup includes the user id, and a miss is a 404, not a 403,
  // so nobody can probe which ids exist in other people's accounts.
  const ownProject = (req) => {
    const p = store.projects.byId(req.params.id);
    if (!p || p.userId !== req.auth.userId) throw notFound('Project not found.');
    return p;
  };
  const ownTask = (req) => {
    const t = store.tasks.byId(req.params.id);
    const p = t && store.projects.byId(t.projectId);
    if (!t || !p || p.userId !== req.auth.userId) throw notFound('Task not found.');
    return t;
  };
  const textField = (value, field, label, max) => {
    const v = str(value).trim();
    if (v.length < 1 || v.length > max) throw validationFailed({ [field]: `${label} must be 1-${max} characters.` });
    return v;
  };

  router.get('/projects', (req, res) => {
    const projects = store.projects.filter((p) => p.userId === req.auth.userId).reverse().map(toProject);
    res.json({ projects });
  });

  router.post('/projects', (req, res) => {
    const name = textField(body(req).name, 'name', 'Name', 60);
    const count = store.projects.filter((p) => p.userId === req.auth.userId).length;
    const project = store.projects.insert({
      userId: req.auth.userId,
      name,
      color: COLORS[count % COLORS.length],
      createdAt: new Date(now()).toISOString(),
    });
    res.status(201).json({ project: toProject(project) });
  });

  router.delete('/projects/:id', (req, res) => {
    const p = ownProject(req);
    store.tasks.removeWhere((t) => t.projectId === p.id);
    store.projects.remove(p.id);
    res.status(204).end();
  });

  router.get('/projects/:id/tasks', (req, res) => {
    const p = ownProject(req);
    res.json({ tasks: store.tasks.filter((t) => t.projectId === p.id).map(toTask) });
  });

  router.post('/projects/:id/tasks', (req, res) => {
    const p = ownProject(req);
    const title = textField(body(req).title, 'title', 'Title', 120);
    const task = store.tasks.insert({ projectId: p.id, title, status: 'todo', createdAt: new Date(now()).toISOString() });
    res.status(201).json({ task: toTask(task) });
  });

  router.patch('/tasks/:id', (req, res) => {
    const t = ownTask(req);
    const b = body(req);
    const patch = {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) throw validationFailed({ status: 'Status must be todo, doing or done.' });
      patch.status = b.status;
    }
    if (b.title !== undefined) patch.title = textField(b.title, 'title', 'Title', 120);
    if (!Object.keys(patch).length) throw validationFailed({ status: 'Provide a status or a title to update.' });
    res.json({ task: toTask(store.tasks.update(t.id, patch)) });
  });

  router.delete('/tasks/:id', (req, res) => {
    store.tasks.remove(ownTask(req).id);
    res.status(204).end();
  });

  return router;
}
