// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthCallbackPage, { CALLBACK_TIMEOUT_MS } from '../src/pages/auth/AuthCallbackPage';
import ResetPasswordPage, { RECOVERY_WAIT_MS } from '../src/pages/auth/ResetPasswordPage';
import { fakeAuth, fakeClient, renderWithAuth } from './helpers/auth';

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState({}, '', '/');
});

describe('AuthCallbackPage', () => {
  it('goes home when getSession already has a session', async () => {
    const client = fakeClient({ session: { access_token: 't' } });
    renderWithAuth(<AuthCallbackPage />, { auth: fakeAuth({ client }), path: '/auth/callback', route: '/auth/callback?code=abc' });
    expect(await screen.findByText('HOME PAGE')).toBeTruthy();
  });
  it('waits, then goes home when onAuthStateChange delivers the session', async () => {
    const client = fakeClient();
    renderWithAuth(<AuthCallbackPage />, { auth: fakeAuth({ client }), path: '/auth/callback' });
    expect(screen.getByRole('status')).toHaveTextContent('One moment');
    await act(async () => client.listeners[0]('SIGNED_IN', { access_token: 't' }));
    expect(screen.getByText('HOME PAGE')).toBeTruthy();
  });
  it('shows a timeout state after 8 seconds', async () => {
    const client = fakeClient();
    renderWithAuth(<AuthCallbackPage />, { auth: fakeAuth({ client }), path: '/auth/callback' });
    await act(async () => vi.advanceTimersByTime(CALLBACK_TIMEOUT_MS + 10));
    expect(screen.getByRole('alert')).toHaveTextContent('could not complete');
  });
  it('shows the error from the URL without waiting', () => {
    window.history.replaceState({}, '', '/auth/callback?error=access_denied&error_description=Email+link+is+invalid');
    renderWithAuth(<AuthCallbackPage />, { auth: fakeAuth({ client: fakeClient() }), path: '/auth/callback' });
    expect(screen.getByRole('alert')).toHaveTextContent('Email link is invalid');
  });
  it('removes its listener on unmount', async () => {
    const client = fakeClient();
    const { unmount } = renderWithAuth(<AuthCallbackPage />, { auth: fakeAuth({ client }), path: '/auth/callback' });
    const sub = client.auth.onAuthStateChange.mock.results[0].value.data.subscription;
    unmount();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });
});

describe('ResetPasswordPage', () => {
  it('without a session the link is invalid or expired', async () => {
    renderWithAuth(<ResetPasswordPage />, { auth: fakeAuth({ client: fakeClient() }), path: '/auth/reset' });
    await act(async () => vi.advanceTimersByTime(RECOVERY_WAIT_MS + 10));
    expect(screen.getByRole('alert')).toHaveTextContent('invalid or expired');
  });
  it('with a recovery session the form updates the password', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const auth = fakeAuth({ client: fakeClient({ session: { access_token: 't' } }) });
    renderWithAuth(<ResetPasswordPage />, { auth, path: '/auth/reset' });
    await user.type(await screen.findByLabelText('New password'), 'brand-new-1');
    await user.type(screen.getByLabelText('Confirm new password'), 'brand-new-1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(auth.updatePassword).toHaveBeenCalledWith('brand-new-1');
    expect(await screen.findByRole('link', { name: 'Go to Huddle' })).toBeTruthy();
  });
  it('picks up the PASSWORD_RECOVERY event', async () => {
    const client = fakeClient();
    renderWithAuth(<ResetPasswordPage />, { auth: fakeAuth({ client }), path: '/auth/reset' });
    await act(async () => client.listeners[0]('PASSWORD_RECOVERY', { access_token: 't' }));
    expect(screen.getByLabelText('New password')).toBeTruthy();
  });
  it('requires both passwords to match', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const auth = fakeAuth({ client: fakeClient({ session: { access_token: 't' } }) });
    renderWithAuth(<ResetPasswordPage />, { auth, path: '/auth/reset' });
    await user.type(await screen.findByLabelText('New password'), 'brand-new-1');
    await user.type(screen.getByLabelText('Confirm new password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByRole('alert')).toHaveTextContent('do not match');
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });
  it('shows an error from updateUser', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const auth = fakeAuth({ client: fakeClient({ session: { access_token: 't' } }), updatePassword: vi.fn(async () => ({ data: null, error: { code: 'same_password', message: 'x' } })) });
    renderWithAuth(<ResetPasswordPage />, { auth, path: '/auth/reset' });
    await user.type(await screen.findByLabelText('New password'), 'brand-new-1');
    await user.type(screen.getByLabelText('Confirm new password'), 'brand-new-1');
    await user.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('different from your current');
  });
});
