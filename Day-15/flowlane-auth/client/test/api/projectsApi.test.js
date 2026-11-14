// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/api/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
import { http } from '../../src/api/http';
import * as api from '../../src/api/projectsApi';

beforeEach(() => vi.clearAllMocks());

describe('projectsApi', () => {
  it('exports exactly the contract functions', () => {
    expect(Object.keys(api).sort()).toEqual(
      ['createProject', 'createTask', 'deleteProject', 'deleteTask', 'listProjects', 'listTasks', 'listUsers', 'updateTask']
    );
  });
  it('listProjects unwraps projects', async () => {
    http.get.mockResolvedValue({ data: { projects: [{ id: 'p1' }] } });
    expect(await api.listProjects()).toEqual([{ id: 'p1' }]);
    expect(http.get).toHaveBeenCalledWith('/projects');
  });
  it('createProject posts the name and unwraps project', async () => {
    http.post.mockResolvedValue({ data: { project: { id: 'p2' } } });
    expect(await api.createProject('Alpha')).toEqual({ id: 'p2' });
    expect(http.post).toHaveBeenCalledWith('/projects', { name: 'Alpha' });
  });
  it('deleteProject calls DELETE and resolves undefined', async () => {
    http.delete.mockResolvedValue({ status: 204 });
    expect(await api.deleteProject('p1')).toBeUndefined();
    expect(http.delete).toHaveBeenCalledWith('/projects/p1');
  });
  it('listTasks unwraps tasks', async () => {
    http.get.mockResolvedValue({ data: { tasks: [{ id: 't1' }] } });
    expect(await api.listTasks('p1')).toEqual([{ id: 't1' }]);
    expect(http.get).toHaveBeenCalledWith('/projects/p1/tasks');
  });
  it('createTask posts the title and unwraps task', async () => {
    http.post.mockResolvedValue({ data: { task: { id: 't2' } } });
    expect(await api.createTask('p1', 'Write')).toEqual({ id: 't2' });
    expect(http.post).toHaveBeenCalledWith('/projects/p1/tasks', { title: 'Write' });
  });
  it('updateTask patches and unwraps task', async () => {
    http.patch.mockResolvedValue({ data: { task: { id: 't1', status: 'done' } } });
    expect(await api.updateTask('t1', { status: 'done' })).toEqual({ id: 't1', status: 'done' });
    expect(http.patch).toHaveBeenCalledWith('/tasks/t1', { status: 'done' });
  });
  it('deleteTask calls DELETE', async () => {
    http.delete.mockResolvedValue({ status: 204 });
    await api.deleteTask('t1');
    expect(http.delete).toHaveBeenCalledWith('/tasks/t1');
  });
  it('listUsers unwraps users', async () => {
    http.get.mockResolvedValue({ data: { users: [{ id: 'u1' }] } });
    expect(await api.listUsers()).toEqual([{ id: 'u1' }]);
    expect(http.get).toHaveBeenCalledWith('/admin/users');
  });
  it('propagates errors', async () => {
    http.get.mockRejectedValue({ status: 403, code: 'forbidden', message: 'no' });
    await expect(api.listUsers()).rejects.toMatchObject({ status: 403 });
  });
});
