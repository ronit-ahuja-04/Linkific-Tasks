// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../../src/api/authApi';
import ForgotPasswordPage from '../../../src/pages/auth/ForgotPasswordPage';
import { FakeApiError, renderPage } from './helpers';

vi.mock('../../../src/api/authApi');

const CONFIRMATION = 'If an account exists for that email, we sent a reset link.';
const setup = () => renderPage(<ForgotPasswordPage />, { path: '/forgot-password', url: '/forgot-password' });

beforeEach(() => vi.resetAllMocks());

describe('ForgotPasswordPage', () => {
  it('validates the email and focuses it', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(authApi.forgotPassword).not.toHaveBeenCalled();
    expect(document.title).toBe('Forgot password · FlowLane');
  });

  it('calls forgotPassword and shows the confirmation with a way back', async () => {
    const user = userEvent.setup();
    authApi.forgotPassword.mockResolvedValue({ message: 'ok' });
    setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('status')).toHaveTextContent(CONFIRMATION);
    expect(authApi.forgotPassword).toHaveBeenCalledWith('a@b.co');
    await user.click(screen.getByRole('link', { name: 'Back to sign in' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });

  it('shows the identical confirmation for any response (no account enumeration)', async () => {
    const user = userEvent.setup();
    authApi.forgotPassword.mockResolvedValue({ message: 'Something different from the server' });
    setup();
    await user.type(screen.getByLabelText('Email'), 'unknown@nowhere.dev');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(CONFIRMATION)).toBeInTheDocument();
    expect(screen.queryByText(/Something different/)).not.toBeInTheDocument();
  });

  it('shows the rate limit error and keeps the form', async () => {
    const user = userEvent.setup();
    authApi.forgotPassword.mockRejectedValue(new FakeApiError({ status: 429, code: 'rate_limited', message: 'x' }));
    setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts. Wait a minute and try again.');
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled();
  });

  it('shows a network error', async () => {
    const user = userEvent.setup();
    authApi.forgotPassword.mockRejectedValue(new FakeApiError({ code: 'network_error', message: 'Cannot reach the server.' }));
    setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
  });
});
