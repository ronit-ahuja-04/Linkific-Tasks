// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../../src/api/authApi';
import LoginPage from '../../../src/pages/auth/LoginPage';
import { FakeApiError, makeAuth, renderPage } from './helpers';

vi.mock('../../../src/api/authApi');

const setup = (options = {}) => renderPage(<LoginPage />, { path: '/login', url: '/login', ...options });

beforeEach(() => {
  vi.resetAllMocks();
  authApi.providers.mockResolvedValue({ github: { enabled: false } });
});

describe('LoginPage', () => {
  it('renders the form, links and sets the title', async () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
    expect(document.title).toBe('Sign in · FlowLane');
    await waitFor(() => expect(authApi.providers).toHaveBeenCalled());
  });

  it('shows inline validation errors and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveFocus();
    expect(email).toHaveAccessibleDescription('Enter your email address.');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('focuses the password when only it is invalid', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('calls login with email, password and remember=false by default', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), 'Secret-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'Secret-123', remember: false }));
    expect(auth.clearNotice).toHaveBeenCalled();
  });

  it('passes remember=true when the box is checked', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), 'Secret-123');
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(auth.login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'Secret-123', remember: true }));
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByLabelText('Password');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
  });

  it.each([
    ['invalid_credentials', 'Whatever the server says', 'Email or password is incorrect.'],
    ['rate_limited', 'Slow down', 'Too many attempts. Wait a minute and try again.'],
    ['network_error', 'Cannot reach the server.', 'Cannot reach the server.'],
  ])('maps %s to a form-level alert', async (code, message, expected) => {
    const user = userEvent.setup();
    const auth = makeAuth({ login: vi.fn().mockRejectedValue(new FakeApiError({ status: 401, code, message })) });
    setup({ auth });
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), 'Secret-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(expected);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('shows server validation fields inline', async () => {
    const user = userEvent.setup();
    const auth = makeAuth({ login: vi.fn().mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { email: 'Email looks wrong.' } })) });
    setup({ auth });
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), 'Secret-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email looks wrong.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('disables the button while the request is pending', async () => {
    const user = userEvent.setup();
    let resolve;
    const auth = makeAuth({ login: vi.fn(() => new Promise((r) => (resolve = r))) });
    setup({ auth });
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), 'Secret-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const busy = await screen.findByRole('button', { name: 'Signing in…' });
    expect(busy).toBeDisabled();
    resolve({});
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('shows the GitHub button only when the provider is enabled and starts the login', async () => {
    const user = userEvent.setup();
    authApi.providers.mockResolvedValue({ github: { enabled: true } });
    const { auth } = setup();
    expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Continue with GitHub' }));
    expect(auth.beginGithubLogin).toHaveBeenCalledTimes(1);
  });

  it('hides the GitHub button when disabled or when the providers call fails', async () => {
    setup();
    await waitFor(() => expect(authApi.providers).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
  });

  it('hides the GitHub button when the providers call fails', async () => {
    authApi.providers.mockRejectedValue(new FakeApiError({ code: 'network_error' }));
    setup();
    await waitFor(() => expect(authApi.providers).toHaveBeenCalled());
    await Promise.resolve();
    expect(screen.queryByRole('button', { name: /github/i })).not.toBeInTheDocument();
  });

  it('renders the auth notice and clears it on dismiss', async () => {
    const user = userEvent.setup();
    const auth = makeAuth({ notice: { type: 'expired', message: 'Your session expired. Please sign in again.' } });
    setup({ auth });
    expect(screen.getByRole('alert')).toHaveTextContent('Your session expired. Please sign in again.');
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(auth.clearNotice).toHaveBeenCalled();
  });

  it('shows the oauth_failed query error and lets you dismiss it', async () => {
    const user = userEvent.setup();
    setup({ url: '/login?error=oauth_failed' });
    expect(screen.getByRole('alert')).toHaveTextContent('GitHub sign-in failed. Please try again.');
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('navigates to the register page from the footer link', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('link', { name: 'Create an account' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/register');
  });

  it('has a theme toggle', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument();
  });
});
