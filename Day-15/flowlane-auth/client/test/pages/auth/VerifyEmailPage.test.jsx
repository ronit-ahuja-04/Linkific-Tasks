// @vitest-environment jsdom
import { StrictMode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../../src/api/authApi';
import VerifyEmailPage from '../../../src/pages/auth/VerifyEmailPage';
import { FakeApiError, makeAuth, renderPage } from './helpers';

vi.mock('../../../src/api/authApi');

const strict = (node) => <StrictMode>{node}</StrictMode>;
const setup = (options = {}) => renderPage(<VerifyEmailPage />, { path: '/verify-email', url: '/verify-email?token=tok1', wrapper: strict, ...options });
const user1 = { id: 'u1', name: 'Ronit', email: 'r@x.co', emailVerified: true };

beforeEach(() => vi.resetAllMocks());

describe('VerifyEmailPage', () => {
  it('shows verifying and then success, calling verifyEmail exactly once under StrictMode', async () => {
    authApi.verifyEmail.mockResolvedValue({ user: user1 });
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Verifying your email…');
    expect(await screen.findByText('Your email is verified. Thank you!')).toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledTimes(1);
    expect(authApi.verifyEmail).toHaveBeenCalledWith('tok1');
    expect(document.title).toBe('Verify email · FlowLane');
  });

  it('updates the signed-in user with the returned user', async () => {
    authApi.verifyEmail.mockResolvedValue({ user: user1 });
    const auth = makeAuth({ isAuthenticated: true, status: 'authenticated' });
    setup({ auth });
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toBeInTheDocument();
    expect(auth.setUser).toHaveBeenCalledWith(user1);
  });

  it('does not touch the auth user when signed out and links to sign in', async () => {
    authApi.verifyEmail.mockResolvedValue({ user: user1 });
    const { auth } = setup();
    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(auth.setUser).not.toHaveBeenCalled();
  });

  it('shows the server message on failure and no resend button when signed out', async () => {
    authApi.verifyEmail.mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { token: 'This link is invalid or has expired.' } }));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('This link is invalid or has expired.');
    expect(screen.queryByRole('button', { name: 'Resend verification email' })).not.toBeInTheDocument();
    expect(authApi.verifyEmail).toHaveBeenCalledTimes(1);
  });

  it('offers resend when signed in and reports success', async () => {
    const user = userEvent.setup();
    authApi.verifyEmail.mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { token: 'Expired.' } }));
    authApi.resendVerification.mockResolvedValue({ message: 'sent' });
    setup({ auth: makeAuth({ isAuthenticated: true, status: 'authenticated' }) });
    await user.click(await screen.findByRole('button', { name: 'Resend verification email' }));
    expect(await screen.findByText('A new verification email is on its way.')).toBeInTheDocument();
    expect(authApi.resendVerification).toHaveBeenCalledTimes(1);
  });

  it('reports a resend failure', async () => {
    const user = userEvent.setup();
    authApi.verifyEmail.mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { token: 'Expired.' } }));
    authApi.resendVerification.mockRejectedValue(new FakeApiError({ code: 'rate_limited', message: 'Slow down.' }));
    setup({ auth: makeAuth({ isAuthenticated: true, status: 'authenticated' }) });
    await user.click(await screen.findByRole('button', { name: 'Resend verification email' }));
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(screen.getByText('Slow down.')).toBeInTheDocument();
  });

  it('shows an error without calling the API when the token is missing', () => {
    setup({ url: '/verify-email' });
    expect(screen.getByRole('alert')).toHaveTextContent(/missing its token/);
    expect(authApi.verifyEmail).not.toHaveBeenCalled();
  });
});
