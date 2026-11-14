// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('../../../src/api/projectsApi', () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));
import * as api from '../../../src/api/projectsApi';
import DashboardPage from '../../../src/pages/app/DashboardPage';
import { AuthContext } from '../../../src/auth/AuthContext';
import { ToastProvider } from '../../../src/context/ToastContext';

const auth = { user: { id: 'u1', name: 'Ada Lovelace', role: 'member', emailVerified: true } };
const projects = () => [
  { id: 'p1', name: 'Website', color: '#FF5630', taskCounts: { todo: 1, doing: 1, done: 1 }, createdAt: '2026-01-01' },
  { id: 'p2', name: 'Mobile', color: '#36B37E', taskCounts: { todo: 0, doing: 0, done: 0 }, createdAt: '2026-01-02' },
];
const tasks = () => [
  { id: 't1', projectId: 'p1', title: 'Design logo', status: 'todo' },
  { id: 't2', projectId: 'p1', title: 'Build header', status: 'doing' },
  { id: 't3', projectId: 'p1', title: 'Ship it', status: 'done' },
];

function Where() {
  const loc = useLocation();
  return <output data-testid="search">{loc.search}</output>;
}
function setup(url = '/dashboard') {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[url]}>
        <AuthContext.Provider value={auth}>
          <DashboardPage />
          <Where />
        </AuthContext.Provider>
      </MemoryRouter>
    </ToastProvider>
  );
  return user;
}
const column = (name) => screen.getByRole('region', { name: new RegExp(`^${name}`) });

beforeEach(() => {
  vi.resetAllMocks();
  api.listProjects.mockResolvedValue(projects());
  api.listTasks.mockResolvedValue(tasks());
});

describe('DashboardPage projects', () => {
  it('greets with the first name and sets the title', async () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back, Ada' })).toBeTruthy();
    await screen.findByText('Website');
    expect(document.title).toBe('Dashboard · FlowLane');
  });
  it('shows loading then the project list with counts', async () => {
    setup();
    expect(screen.getByText('Loading projects…')).toBeTruthy();
    expect(await screen.findByText('Website')).toBeTruthy();
    expect(screen.getByText('3 tasks, 1 done')).toBeTruthy();
    expect(screen.getByText('0 tasks, 0 done')).toBeTruthy();
  });
  it('shows the empty state', async () => {
    api.listProjects.mockResolvedValue([]);
    setup();
    expect(await screen.findByText('No projects yet. Create your first one.')).toBeTruthy();
  });
  it('shows an error with Retry that reloads', async () => {
    api.listProjects.mockRejectedValueOnce({ status: 500, message: 'Boom' });
    const user = setup();
    expect(await screen.findByText('Boom')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Website')).toBeTruthy();
    expect(api.listProjects).toHaveBeenCalledTimes(2);
  });
  it('prompts to select a project when none is chosen', async () => {
    setup();
    await screen.findByText('Website');
    expect(screen.getByText('Select a project to see its board.')).toBeTruthy();
  });
  it('selecting a project loads its board and updates the URL', async () => {
    const user = setup();
    await user.click(await screen.findByRole('button', { name: /^Website/ }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Website' })).toBeTruthy();
    expect(api.listTasks).toHaveBeenCalledWith('p1');
    expect(screen.getByTestId('search').textContent).toBe('?project=p1');
  });
  it('restores the selected project from the URL', async () => {
    setup('/dashboard?project=p1');
    expect(await screen.findByText('Design logo')).toBeTruthy();
    expect(api.listTasks).toHaveBeenCalledWith('p1');
  });
  it('says so when the URL project does not exist', async () => {
    setup('/dashboard?project=nope');
    expect(await screen.findByText('That project was not found.')).toBeTruthy();
  });
  it('validates the project name', async () => {
    const user = setup();
    await screen.findByText('Website');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByText('Project name must be 1 to 60 characters.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('New project name'));
    expect(screen.getByLabelText('New project name').getAttribute('aria-invalid')).toBe('true');
    await user.type(screen.getByLabelText('New project name'), 'x'.repeat(61));
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(api.createProject).not.toHaveBeenCalled();
  });
  it('creates a project, selects it and focuses it', async () => {
    api.createProject.mockResolvedValue({ id: 'p3', name: 'Fresh', color: '#0052CC', taskCounts: { todo: 0, doing: 0, done: 0 } });
    api.listTasks.mockResolvedValue([]);
    const user = setup();
    await screen.findByText('Website');
    await user.type(screen.getByLabelText('New project name'), '  Fresh ');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(api.createProject).toHaveBeenCalledWith('Fresh');
    const btn = await screen.findByRole('button', { name: /^Fresh/ });
    await waitFor(() => expect(document.activeElement).toBe(btn));
    expect(screen.getByTestId('search').textContent).toBe('?project=p3');
    expect((screen.getByLabelText('New project name')).value).toBe('');
  });
  it('toasts when creating a project fails', async () => {
    api.createProject.mockRejectedValue({ status: 500, message: 'Nope' });
    const user = setup();
    await screen.findByText('Website');
    await user.type(screen.getByLabelText('New project name'), 'Fresh');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(await screen.findByText('Nope')).toBeTruthy();
    expect(screen.getByLabelText('New project name').value).toBe('Fresh');
  });
  it('deletes a project only after an inline confirm', async () => {
    api.deleteProject.mockResolvedValue();
    const user = setup();
    await screen.findByText('Website');
    await user.click(screen.getByRole('button', { name: 'Delete Website' }));
    expect(api.deleteProject).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Confirm delete Website' }));
    expect(api.deleteProject).toHaveBeenCalledWith('p1');
    await waitFor(() => expect(screen.queryByText('Website')).toBeNull());
    expect(document.activeElement).toBe(screen.getByLabelText('New project name'));
  });
  it('cancel leaves the project alone', async () => {
    const user = setup();
    await screen.findByText('Website');
    await user.click(screen.getByRole('button', { name: 'Delete Website' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Delete Website' })).toBeTruthy();
    expect(api.deleteProject).not.toHaveBeenCalled();
  });
  it('rolls a project back when delete fails', async () => {
    api.deleteProject.mockRejectedValue({ status: 500, message: 'Cannot delete' });
    const user = setup();
    await screen.findByText('Website');
    await user.click(screen.getByRole('button', { name: 'Delete Website' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete Website' }));
    expect(await screen.findByText('Cannot delete')).toBeTruthy();
    expect(screen.getByText('Website')).toBeTruthy();
  });
  it('clears the selection when the selected project is deleted', async () => {
    api.deleteProject.mockResolvedValue();
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Delete Website' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete Website' }));
    await waitFor(() => expect(screen.getByTestId('search').textContent).toBe(''));
    expect(screen.queryByText('Design logo')).toBeNull();
  });
});

describe('DashboardPage board', () => {
  it('shows three columns with counts and tasks as cards', async () => {
    setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    expect(within(column('To do')).getByText('Design logo')).toBeTruthy();
    expect(within(column('In progress')).getByText('Build header')).toBeTruthy();
    expect(within(column('Done')).getByText('Ship it')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /To do/ }).textContent).toContain('1');
  });
  it('shows an error with Retry when tasks fail', async () => {
    api.listTasks.mockRejectedValueOnce({ status: 500, message: 'Tasks broke' });
    const user = setup('/dashboard?project=p1');
    expect(await screen.findByText('Tasks broke')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Design logo')).toBeTruthy();
  });
  it('validates the task title', async () => {
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(screen.getByText('Task title must be 1 to 120 characters.')).toBeTruthy();
    expect(api.createTask).not.toHaveBeenCalled();
  });
  it('adds a task to To do and keeps focus in the field', async () => {
    api.createTask.mockResolvedValue({ id: 't9', projectId: 'p1', title: 'Write docs', status: 'todo' });
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.type(screen.getByLabelText('New task title'), 'Write docs');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(api.createTask).toHaveBeenCalledWith('p1', 'Write docs');
    expect(await within(column('To do')).findByText('Write docs')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('New task title')));
  });
  it('toasts when adding a task fails and keeps the text', async () => {
    api.createTask.mockRejectedValue({ status: 500, message: 'Add failed' });
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.type(screen.getByLabelText('New task title'), 'Write docs');
    await user.click(screen.getByRole('button', { name: 'Add task' }));
    expect(await screen.findByText('Add failed')).toBeTruthy();
    expect(screen.getByLabelText('New task title').value).toBe('Write docs');
  });
  it('moves a task optimistically with the select', async () => {
    let resolve;
    api.updateTask.mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Move Design logo to' }), 'Done');
    // visible before the server answers
    expect(within(column('Done')).getByText('Design logo')).toBeTruthy();
    expect(api.updateTask).toHaveBeenCalledWith('t1', { status: 'done' });
    resolve({});
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Move Design logo to' })));
  });
  it('rolls the move back and toasts when the server fails', async () => {
    api.updateTask.mockRejectedValue({ status: 500, message: 'Move failed' });
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Move Design logo to' }), 'In progress');
    expect(await screen.findByText('Move failed')).toBeTruthy();
    expect(within(column('To do')).getByText('Design logo')).toBeTruthy();
  });
  it('deletes a task and focuses the add field', async () => {
    api.deleteTask.mockResolvedValue();
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Delete Design logo' }));
    expect(api.deleteTask).toHaveBeenCalledWith('t1');
    await waitFor(() => expect(screen.queryByText('Design logo')).toBeNull());
    expect(document.activeElement).toBe(screen.getByLabelText('New task title'));
  });
  it('restores a task when delete fails', async () => {
    api.deleteTask.mockRejectedValue({ status: 500, message: 'Delete failed' });
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Delete Design logo' }));
    expect(await screen.findByText('Delete failed')).toBeTruthy();
    expect(within(column('To do')).getByText('Design logo')).toBeTruthy();
  });
  it('edits a title inline', async () => {
    api.updateTask.mockResolvedValue({});
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Edit Design logo' }));
    const input = screen.getByRole('textbox', { name: 'Edit title of Design logo' });
    await user.clear(input);
    await user.type(input, 'Design brand{Enter}');
    expect(api.updateTask).toHaveBeenCalledWith('t1', { title: 'Design brand' });
    expect(screen.getByText('Design brand')).toBeTruthy();
  });
  it('rejects an empty edited title and can cancel', async () => {
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Edit Design logo' }));
    await user.clear(screen.getByRole('textbox', { name: /Edit title/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert').textContent).toMatch(/1 to 120/);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Design logo')).toBeTruthy();
    expect(api.updateTask).not.toHaveBeenCalled();
  });
  it('reverts an inline rename when the server fails', async () => {
    api.updateTask.mockRejectedValue({ status: 500, message: 'Rename failed' });
    const user = setup('/dashboard?project=p1');
    await screen.findByText('Design logo');
    await user.click(screen.getByRole('button', { name: 'Edit Design logo' }));
    const input = screen.getByRole('textbox', { name: /Edit title/ });
    await user.clear(input);
    await user.type(input, 'Other{Enter}');
    expect(await screen.findByText('Rename failed')).toBeTruthy();
    expect(screen.getByText('Design logo')).toBeTruthy();
  });
});
