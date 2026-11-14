import { http } from './http';

// Thin wrappers over the protected endpoints. Each one unwraps the JSON envelope
// ({ projects: [...] } -> [...]) so components never deal with response shapes.
// The Bearer token is added by the http instance; a 404 is also what you get for
// someone else's project (the server never reveals that it exists).
export async function listProjects() {
  const { data } = await http.get('/projects');
  return data.projects;
}
export async function createProject(name) {
  const { data } = await http.post('/projects', { name });
  return data.project;
}
export async function deleteProject(id) {
  await http.delete(`/projects/${id}`);
}
export async function listTasks(projectId) {
  const { data } = await http.get(`/projects/${projectId}/tasks`);
  return data.tasks;
}
export async function createTask(projectId, title) {
  const { data } = await http.post(`/projects/${projectId}/tasks`, { title });
  return data.task;
}
export async function updateTask(id, patch) {
  const { data } = await http.patch(`/tasks/${id}`, patch);
  return data.task;
}
export async function deleteTask(id) {
  await http.delete(`/tasks/${id}`);
}
// Admin only: a member gets 403 forbidden.
export async function listUsers() {
  const { data } = await http.get('/admin/users');
  return data.users;
}
