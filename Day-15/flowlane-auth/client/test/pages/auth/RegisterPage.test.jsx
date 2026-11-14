// @vitest-environment jsdom
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../../../src/api/authApi';
import RegisterPage from '../../../src/pages/auth/RegisterPage';
import { FakeApiError, makeAuth, renderPage } from './helpers';

vi.mock('../../../src/api/authApi');

const setup = (options = {}) => renderPage(<RegisterPage />, { path: '/register', url: '/register', ...options });

async function fill(user, { name = 'Ronit Ahuja', email = 'ronit@example.com', password = 'Zk3-vq9xLm', confirm = password } = {}) {
  if (name) await user.type(screen.getByLabelText('Name'), name);
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password', { selector: '#register-password' }), password);
  if (confirm) await user.type(screen.getByLabelText('Confirm password'), confirm);
}

beforeEach(() => {
  vi.resetAllMocks();
  authApi.providers.mockResolvedValue({ github: { enabled: false } });
});

describe('RegisterPage', () => {
  it('renders fields with correct autocomplete and title', async () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('Password', { selector: '#register-password' })).toHaveAttribute('autocomplete', 'new-password');
    expect(document.title).toBe('Create account · FlowLane');
    await waitFor(() => expect(authApi.providers).toHaveBeenCalled());
  });

  it('shows all validation errors and focuses the name first', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter a password.')).toBeInTheDocument();
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('flags a mismatching confirmation and focuses it', async () => {
    const user = userEvent.setup();
    setup();
    await fill(user, { confirm: 'Different-1' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toHaveFocus();
  });

  it('rejects a common password', async () => {
    const user = userEvent.setup();
    setup();
    await fill(user, { password: 'Password1' });
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText(/too common/)).toBeInTheDocument();
  });

  it('calls register with name, email and password only', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(auth.register).toHaveBeenCalledWith({ name: 'Ronit Ahuja', email: 'ronit@example.com', password: 'Zk3-vq9xLm' }));
  });

  it('puts email_taken inline on the email field', async () => {
    const user = userEvent.setup();
    const auth = makeAuth({ register: vi.fn().mockRejectedValue(new FakeApiError({ status: 409, code: 'email_taken', message: 'taken' })) });
    setup({ auth });
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('shows server validation fields inline', async () => {
    const user = userEvent.setup();
    const auth = makeAuth({ register: vi.fn().mockRejectedValue(new FakeApiError({ code: 'validation_failed', fields: { name: 'Name is not allowed.', password: 'Server dislikes it.' } })) });
    setup({ auth });
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Name is not allowed.')).toBeInTheDocument();
    expect(screen.getByText('Server dislikes it.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });

  it('shows a network error as a form alert', async () => {
    const user = userEvent.setup();
    const auth = makeAuth({ register: vi.fn().mockRejectedValue(new FakeApiError({ code: 'network_error', message: 'Cannot reach the server.' })) });
    setup({ auth });
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server.');
  });

  it('updates the strength meter while typing', async () => {
    const user = userEvent.setup();
    setup();
    const meter = screen.getByRole('progressbar', { name: 'Password strength' });
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('Strength: enter a password')).toBeInTheDocument();
    const field = screen.getByLabelText('Password', { selector: '#register-password' });
    await user.type(field, 'abc');
    expect(screen.getByText('Strength: Too weak')).toBeInTheDocument();
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    await user.clear(field);
    await user.type(field, 'Hdjkwpqz1xyzw!Q9');
    expect(meter).toHaveAttribute('aria-valuenow', '4');
    expect(meter).toHaveAttribute('aria-valuetext', 'Strong');
    expect(screen.getByText('Strength: Strong')).toBeInTheDocument();
  });

  it('penalises the email local part in the meter', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Email'), 'ronit@example.com');
    await user.type(screen.getByLabelText('Password', { selector: '#register-password' }), 'Hdjkwronit1xyzw');
    expect(screen.getByText('Do not include your name or email.')).toBeInTheDocument();
  });

  it('describes the password field by the strength meter', () => {
    setup();
    expect(screen.getByLabelText('Password', { selector: '#register-password' })).toHaveAttribute('aria-describedby', 'register-strength');
  });

  it('has independent show/hide toggles', async () => {
    const user = userEvent.setup();
    setup();
    const toggles = screen.getAllByRole('button', { name: 'Show password' });
    expect(toggles).toHaveLength(2);
    await user.click(toggles[0]);
    expect(screen.getByLabelText('Password', { selector: '#register-password' })).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');
  });

  it('shows the GitHub button only when enabled', async () => {
    const user = userEvent.setup();
    authApi.providers.mockResolvedValue({ github: { enabled: true } });
    const { auth } = setup();
    await user.click(await screen.findByRole('button', { name: 'Continue with GitHub' }));
    expect(auth.beginGithubLogin).toHaveBeenCalled();
  });

  it('links to the login page', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Sign in' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/login');
  });
});
