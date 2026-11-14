// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../../src/api/projectsApi', () => ({ listUsers: vi.fn() }));
import { listUsers } from '../../../src/api/projectsApi';
import AdminPage from '../../../src/pages/app/AdminPage';

const users = [
  { id: 'u1', name: 'Ada', email: 'ada@x.dev', role: 'admin', provider: 'password', emailVerified: true, createdAt: '2026-01-02T10:00:00.000Z' },
  { id: 'u2', name: 'Bob', email: 'bob@x.dev', role: 'member', provider: 'github', emailVerified: false, createdAt: '2026-02-03T10:00:00.000Z' },
];

beforeEach(() => vi.clearAllMocks());

describe('AdminPage', () => {
  it('shows loading then the users table', async () => {
    listUsers.mockResolvedValue(users);
    render(<AdminPage />);
    expect(screen.getByText('Loading users…')).toBeTruthy();
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('bob@x.dev')).toBeTruthy();
    expect(within(table).getByText('github')).toBeTruthy();
    expect(within(table).getByText('admin')).toBeTruthy();
    expect(within(table).getByText('Yes')).toBeTruthy();
    expect(within(table).getByText('No')).toBeTruthy();
  });
  it('sets the document title', async () => {
    listUsers.mockResolvedValue([]);
    render(<AdminPage />);
    await screen.findByRole('table');
    expect(document.title).toBe('Admin · FlowLane');
  });
  it('shows an access message on 403 without a retry', async () => {
    listUsers.mockRejectedValue({ status: 403, code: 'forbidden', message: 'Forbidden' });
    render(<AdminPage />);
    expect(await screen.findByText('You do not have access to this page.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
  it('shows other errors with Retry that reloads', async () => {
    listUsers.mockRejectedValueOnce({ status: 500, message: 'Server exploded' }).mockResolvedValueOnce(users);
    const user = userEvent.setup();
    render(<AdminPage />);
    expect(await screen.findByText('Server exploded')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('table')).toBeTruthy();
    expect(listUsers).toHaveBeenCalledTimes(2);
  });
});
