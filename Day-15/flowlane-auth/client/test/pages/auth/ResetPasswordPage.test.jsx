// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../../src/api/authApi';
import ResetPasswordPage from '../../../src/pages/auth/ResetPasswordPage';
import { FakeApiError, renderPage } from './helpers';

vi.mock('../../../src/api/authApi');

const setup = (url = '/reset-password?token=abc123') => renderPage(<ResetPasswordPage />, { path: '/reset-password', url });
const newPassword = () => screen.getByLabelText('New password');

beforeEach(() => vi.resetAllMocks());

describe('ResetPasswordPage', () => {
  it('explains a missing token and links to request a new one', async () => {
    const user = userEvent.setup();
    setup('/reset-password');
    expect(screen.getByRole('alert')).toHaveTextContent(/missing its token/);
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Request a new reset link' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/forgot-password');
  });

  it('renders the form when a token is present', () => {
    setup();
    expect(newPassword()).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
    expect(document.title).toBe('Reset password · FlowLane');
  });

  it('validates and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(newPassword()).toHaveFocus();
    await user.type(newPassword(), 'Zk3-vq9xLm');
    await user.type(screen.getByLabelText('Confirm new password'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(screen.getByLabelText('Confirm new password')).toHaveFocus();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it('updates the strength meter', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(newPassword(), 'Hdjkwpqz1xyzw');
    expect(screen.getByText('Strength: Good')).toBeInTheDocument();
  });

  it('submits token and password, then confirms and mentions the signed-out sessions', async () => {
    const user = userEvent.setup();
    authApi.resetPassword.mockResolvedValue({ message: 'ok' });
    setup();
    await user.type(newPassword(), 'Zk3-vq9xLm');
    await user.type(screen.getByLabelText('Confirm new password'), 'Zk3-vq9xLm');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/signed you out of every device/);
    expect(authApi.resetPassword).toHaveBeenCalledWith('abc123', 'Zk3-vq9xLm');
    await user.click(screen.getByRole('link', { name: 'Sign in' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });

  it('shows a bad-token error from the server with a link to request a new link', async () => {
    const user = userEvent.setup();
    authApi.resetPassword.mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { token: 'This link is invalid or has expired.' } }));
    setup();
    await user.type(newPassword(), 'Zk3-vq9xLm');
    await user.type(screen.getByLabelText('Confirm new password'), 'Zk3-vq9xLm');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This link is invalid or has expired.');
    expect(alert).toContainElement(screen.getByRole('link', { name: 'Request a new reset link' }));
  });

  it('shows server password policy errors inline', async () => {
    const user = userEvent.setup();
    authApi.resetPassword.mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { password: 'Server says no.' } }));
    setup();
    await user.type(newPassword(), 'Zk3-vq9xLm');
    await user.type(screen.getByLabelText('Confirm new password'), 'Zk3-vq9xLm');
    await user.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText('Server says no.')).toBeInTheDocument();
    expect(newPassword()).toHaveFocus();
  });
});
