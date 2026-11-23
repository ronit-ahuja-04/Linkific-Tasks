// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../src/pages/auth/LoginPage';
import RegisterPage from '../src/pages/auth/RegisterPage';
import ForgotPasswordPage from '../src/pages/auth/ForgotPasswordPage';
import { fakeAuth, renderWithAuth } from './helpers/auth';

describe('LoginPage', () => {
  it('explains why you were signed out when the server ended the session (and says nothing otherwise)', () => {
    const { unmount } = renderWithAuth(<LoginPage />, { auth: fakeAuth({ sessionEnded: true }) });
    expect(screen.getByRole('status').textContent).toMatch(/server no longer knows this session/);
    unmount();
    renderWithAuth(<LoginPage />);
    expect(screen.queryByText(/server no longer knows this session/)).toBeNull();
  });

  it('signs in with email and password', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'demo-password-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(auth.signIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'demo-password-123' });
  });
  it('shows a friendly message for bad credentials', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ signIn: vi.fn(async () => ({ data: {}, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } })) });
    renderWithAuth(<LoginPage />, { auth });
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
  });
  it('validates the email before calling the server', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('alert')).toHaveTextContent('valid email');
    expect(auth.signIn).not.toHaveBeenCalled();
  });
  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginPage />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });
  it('magic link shows the check your email state', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Email me a magic link' }));
    expect(auth.signInWithMagicLink).toHaveBeenCalledWith('new@example.com');
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('new@example.com');
  });
  it('magic link error is shown', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ signInWithMagicLink: vi.fn(async () => ({ data: null, error: { status: 429, message: 'x' } })) });
    renderWithAuth(<LoginPage />, { auth });
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Email me a magic link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });
  it('hides OAuth buttons when no provider is enabled', () => {
    renderWithAuth(<LoginPage />);
    expect(screen.queryByText(/Continue with/)).toBeNull();
  });
  it('shows only the enabled OAuth providers and starts the flow', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ providers: { github: true, google: false } });
    renderWithAuth(<LoginPage />, { auth });
    expect(screen.queryByText('Continue with Google')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue with GitHub' }));
    expect(auth.signInWithProvider).toHaveBeenCalledWith('github');
  });
  it('shows the error from the URL and a notice when redirected', () => {
    renderWithAuth(<LoginPage />, { route: '/login?error_description=Link+expired' });
    expect(screen.getByRole('alert')).toHaveTextContent('Link expired');
  });
  it('has a forgot password link and sets the title', () => {
    renderWithAuth(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute('href', '/forgot-password');
    expect(document.title).toBe('Sign in · Huddle');
  });
});

describe('RegisterPage', () => {
  async function fill(user, { username = '' } = {}) {
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    if (username) await user.type(screen.getByLabelText(/Username/), username);
    await user.type(screen.getByLabelText(/Full name/), 'New Person');
  }
  it('passes username and full name to signUp', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<RegisterPage />);
    await fill(user, { username: 'newbie' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret123', username: 'newbie', fullName: 'New Person' });
  });
  it('rejects a bad username without calling the server', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<RegisterPage />);
    await fill(user, { username: 'A!' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('3 to 24');
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it('requires a 6 character password', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<RegisterPage />);
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.type(screen.getByLabelText('Password'), '123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least 6');
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it('updates the strength hint while typing', async () => {
    const user = userEvent.setup();
    renderWithAuth(<RegisterPage />);
    await user.type(screen.getByLabelText('Password'), 'Abcdefghij1!');
    expect(screen.getByText(/Strength: Strong/)).toBeTruthy();
  });
  it('shows check your email when no session comes back', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ signUp: vi.fn(async () => ({ data: { user: {}, session: null }, error: null })) });
    renderWithAuth(<RegisterPage />, { auth });
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('new@example.com');
  });
  it('shows server errors', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ signUp: vi.fn(async () => ({ data: {}, error: { code: 'user_already_exists', message: 'x' } })) });
    renderWithAuth(<RegisterPage />, { auth });
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
  });
  it('does not show the confirmation screen when a session is returned', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ signUp: vi.fn(async () => ({ data: { session: { access_token: 't' } }, error: null })) });
    renderWithAuth(<RegisterPage />, { auth });
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(auth.signUp).toHaveBeenCalled());
    expect(screen.queryByRole('heading', { name: 'Check your email' })).toBeNull();
  });
});

describe('ForgotPasswordPage', () => {
  it('calls resetPassword and shows the confirmation', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(auth.resetPassword).toHaveBeenCalledWith('ada@example.com');
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
  });
  it('shows the same confirmation even when the server reports an error', async () => {
    const user = userEvent.setup();
    const auth = fakeAuth({ resetPassword: vi.fn(async () => ({ data: null, error: { message: 'User not found' } })) });
    renderWithAuth(<ForgotPasswordPage />, { auth });
    await user.type(screen.getByLabelText('Email'), 'ghost@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
    expect(screen.queryByText('User not found')).toBeNull();
  });
  it('validates the email', async () => {
    const user = userEvent.setup();
    const { auth } = renderWithAuth(<ForgotPasswordPage />);
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(screen.getByRole('alert')).toHaveTextContent('required');
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });
});
