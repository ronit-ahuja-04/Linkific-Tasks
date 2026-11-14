import { describe, expect, it } from 'vitest';
import { bearer, login, makeApp, register } from './helpers.js';
import { seedDemo } from '../src/seed.js';

async function twoUsers() {
  const ctx = makeApp();
  const a = await register(ctx.api);
  const b = await register(ctx.api);
  return { ...ctx, a, b };
}
const mkProject = (api, token, name = "Alpha") => api.post('/api/projects').set(bearer(token)).send({ name });

describe('projects', () => {
  it('requires auth', async () => {
    const { api } = makeApp();
    expect((await api.get('/api/projects')).status).toBe(401);
    expect((await api.post('/api/projects').send({ name: 'x' })).status).toBe(401);
  });
  it('creates and lists projects, newest first, with colors and zero counts', async () => {
    const { api, clock } = makeApp();
    const { token } = await register(api);
    const p1 = await mkProject(api, token, 'First');
    clock.advance(1000);
    const p2 = await mkProject(api, token, 'Second');
    expect(p1.status).toBe(201);
    expect(p1.body.project).toMatchObject({ name: 'First', taskCounts: { todo: 0, doing: 0, done: 0 } });
    expect(p1.body.project.color).toMatch(/^#[0-9A-F]{6}$/i);
    expect(p2.body.project.color).not.toBe(p1.body.project.color);
    const list = await api.get('/api/projects').set(bearer(token));
    expect(list.body.projects.map((p) => p.name)).toEqual(['Second', 'First']);
  });
  it('validates the name (1-60 chars, trimmed)', async () => {
    const { api } = makeApp();
    const { token } = await register(api);
    for (const name of ['', '   ', 'x'.repeat(61), null, 42]) {
      const res = await mkProject(api, token, name);
      expect(res.status).toBe(400);
      expect(res.body.error.fields.name).toBeTruthy();
    }
    expect((await mkProject(api, token, 'x'.repeat(60))).status).toBe(201);
  });
  it('deletes a project together with its tasks', async () => {
    const { api, store } = makeApp();
    const { token } = await register(api);
    const { id } = (await mkProject(api, token)).body.project;
    await api.post(`/api/projects/${id}/tasks`).set(bearer(token)).send({ title: 't' });
    expect((await api.delete(`/api/projects/${id}`).set(bearer(token))).status).toBe(204);
    expect(store.tasks.all()).toHaveLength(0);
    expect((await api.get(`/api/projects/${id}/tasks`).set(bearer(token))).status).toBe(404);
  });
  it('only lists own projects', async () => {
    const { api, a, b } = await twoUsers();
    await mkProject(api, a.token, 'Mine');
    expect((await api.get('/api/projects').set(bearer(b.token))).body.projects).toEqual([]);
  });
});

describe('tasks', () => {
  async function withProject() {
    const ctx = makeApp();
    const user = await register(ctx.api);
    const project = (await mkProject(ctx.api, user.token)).body.project;
    return { ...ctx, ...user, project };
  }
  it('creates tasks as todo and lists them with updated taskCounts', async () => {
    const { api, token, project } = await withProject();
    const t = await api.post(`/api/projects/${project.id}/tasks`).set(bearer(token)).send({ title: '  Write tests ' });
    expect(t.status).toBe(201);
    expect(t.body.task).toMatchObject({ projectId: project.id, title: 'Write tests', status: 'todo' });
    await api.post(`/api/projects/${project.id}/tasks`).set(bearer(token)).send({ title: 'Two' });
    await api.patch(`/api/tasks/${t.body.task.id}`).set(bearer(token)).send({ status: 'doing' });
    const list = await api.get(`/api/projects/${project.id}/tasks`).set(bearer(token));
    expect(list.body.tasks).toHaveLength(2);
    const projects = await api.get('/api/projects').set(bearer(token));
    expect(projects.body.projects[0].taskCounts).toEqual({ todo: 1, doing: 1, done: 0 });
  });
  it('validates the title (1-120)', async () => {
    const { api, token, project } = await withProject();
    for (const title of ['', ' ', 'x'.repeat(121), null]) {
      const res = await api.post(`/api/projects/${project.id}/tasks`).set(bearer(token)).send({ title });
      expect(res.status).toBe(400);
      expect(res.body.error.fields.title).toBeTruthy();
    }
  });
  it('PATCH validates status and title, and needs something to change', async () => {
    const { api, token, project } = await withProject();
    const id = (await api.post(`/api/projects/${project.id}/tasks`).set(bearer(token)).send({ title: 'T' })).body.task.id;
    const patch = (b) => api.patch(`/api/tasks/${id}`).set(bearer(token)).send(b);
    expect((await patch({ status: 'finished' })).body.error.fields.status).toBeTruthy();
    expect((await patch({ title: '' })).body.error.fields.title).toBeTruthy();
    expect((await patch({})).status).toBe(400);
    const ok = await patch({ status: 'done', title: 'Renamed' });
    expect(ok.status).toBe(200);
    expect(ok.body.task).toMatchObject({ status: 'done', title: 'Renamed' });
  });
  it('deletes a task', async () => {
    const { api, token, project } = await withProject();
    const id = (await api.post(`/api/projects/${project.id}/tasks`).set(bearer(token)).send({ title: 'T' })).body.task.id;
    expect((await api.delete(`/api/tasks/${id}`).set(bearer(token))).status).toBe(204);
    expect((await api.delete(`/api/tasks/${id}`).set(bearer(token))).status).toBe(404);
  });
  it('unknown ids are 404 not_found', async () => {
    const { api, token } = await withProject();
    expect((await api.get('/api/projects/nope/tasks').set(bearer(token))).body.error.code).toBe('not_found');
    expect((await api.patch('/api/tasks/nope').set(bearer(token)).send({ status: 'done' })).status).toBe(404);
  });
});

describe('ownership (authorization)', () => {
  async function setup() {
    const ctx = await twoUsers();
    const project = (await mkProject(ctx.api, ctx.a.token)).body.project;
    const task = (await ctx.api.post(`/api/projects/${project.id}/tasks`).set(bearer(ctx.a.token)).send({ title: 'Secret' })).body.task;
    return { ...ctx, project, task };
  }
  it("cannot read another user's tasks (404)", async () => {
    const { api, b, project } = await setup();
    const res = await api.get(`/api/projects/${project.id}/tasks`).set(bearer(b.token));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });
  it("cannot add a task to another user's project", async () => {
    const { api, b, project, store } = await setup();
    expect((await api.post(`/api/projects/${project.id}/tasks`).set(bearer(b.token)).send({ title: 'x' })).status).toBe(404);
    expect(store.tasks.all()).toHaveLength(1);
  });
  it("cannot delete another user's project", async () => {
    const { api, b, project, store } = await setup();
    expect((await api.delete(`/api/projects/${project.id}`).set(bearer(b.token))).status).toBe(404);
    expect(store.projects.all()).toHaveLength(1);
  });
  it("cannot modify or delete another user's task", async () => {
    const { api, b, task, store } = await setup();
    expect((await api.patch(`/api/tasks/${task.id}`).set(bearer(b.token)).send({ status: 'done' })).status).toBe(404);
    expect((await api.delete(`/api/tasks/${task.id}`).set(bearer(b.token))).status).toBe(404);
    expect(store.tasks.all()[0]).toMatchObject({ status: 'todo', title: 'Secret' });
  });
  it('the 404 for a foreign resource is identical to the 404 for a missing one', async () => {
    const { api, b, project } = await setup();
    const foreign = await api.get(`/api/projects/${project.id}/tasks`).set(bearer(b.token));
    const missing = await api.get('/api/projects/does-not-exist/tasks').set(bearer(b.token));
    expect(foreign.body).toEqual(missing.body);
  });
});

describe('admin', () => {
  it('member gets 403 forbidden, admin gets the user list without secrets', async () => {
    const { api, store, clock } = makeApp();
    seedDemo(store, { bcryptCost: 4 }, clock.now);
    const member = await login(api, 'demo@flowlane.dev', 'Demo-Pass-123');
    const forbidden = await api.get('/api/admin/users').set(bearer(member.token));
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('forbidden');
    const admin = await login(api, 'admin@flowlane.dev', 'Admin-Pass-123');
    const res = await api.get('/api/admin/users').set(bearer(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.users.map((u) => u.email).sort()).toEqual(['admin@flowlane.dev', 'demo@flowlane.dev']);
    expect(Object.keys(res.body.users[0]).sort()).toEqual(['createdAt', 'email', 'emailVerified', 'id', 'name', 'provider', 'role']);
  });
  it('requires authentication first', async () => {
    const { api } = makeApp();
    expect((await api.get('/api/admin/users')).status).toBe(401);
  });
  it('role changes apply immediately even with an old token', async () => {
    const { api, store } = makeApp();
    const { token, user } = await register(api);
    store.users.update(user.id, { role: 'admin' });
    expect((await api.get('/api/admin/users').set(bearer(token))).status).toBe(200);
  });
});

describe('seed', () => {
  it('creates the demo accounts, one project with 3 tasks, and is idempotent', () => {
    const { store } = makeApp();
    seedDemo(store, { bcryptCost: 4 });
    seedDemo(store, { bcryptCost: 4 });
    expect(store.users.all()).toHaveLength(2);
    expect(store.users.all().map((u) => [u.email, u.role, u.emailVerified])).toEqual([
      ['demo@flowlane.dev', 'member', true],
      ['admin@flowlane.dev', 'admin', true],
    ]);
    expect(store.projects.all()).toHaveLength(1);
    expect(store.tasks.all()).toHaveLength(3);
  });
});
