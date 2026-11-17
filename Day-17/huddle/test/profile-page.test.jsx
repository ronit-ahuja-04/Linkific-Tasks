// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '../src/pages/ProfilePage';
import { PROFILE, USER, fakeAuth, fakeClient, renderWithAuth } from './helpers/auth';

function setup(overrides = {}, clientOpts = {}) {
  const client = fakeClient({ tables: { profiles: { data: { ...PROFILE }, error: null } }, ...clientOpts });
  const auth = fakeAuth({ client, status: 'authenticated', user: USER, profile: PROFILE, ...overrides });
  return { ...renderWithAuth(<ProfilePage />, { auth }), client, auth };
}
const png = () => new File(['x'], 'me.png', { type: 'image/png' });

describe('ProfilePage', () => {
  it('shows the current details and account facts', () => {
    setup();
    expect(screen.getByLabelText('Full name')).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Username')).toHaveValue('ada');
    expect(screen.getByLabelText('Bio')).toHaveValue('Hello');
    expect(screen.getByText('ada@example.com')).toBeTruthy();
    expect(screen.getByText('u-1')).toBeTruthy();
    expect(screen.getByText('email')).toBeTruthy();
    expect(document.title).toBe('Profile · Huddle');
  });
  it('shows a loading state until the profile arrives', () => {
    renderWithAuth(<ProfilePage />, { auth: fakeAuth({ status: 'authenticated', user: USER, profile: null }) });
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });
  it('saves with update().eq() and refreshes the profile', async () => {
    const user = userEvent.setup();
    const { client, auth } = setup();
    await user.clear(screen.getByLabelText('Bio'));
    await user.type(screen.getByLabelText('Bio'), 'New bio');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() => expect(auth.refreshProfile).toHaveBeenCalled());
    const calls = client.queries[0].q.calls;
    expect(client.queries[0].table).toBe('profiles');
    expect(calls[0][1]).toMatchObject({ bio: 'New bio', username: 'ada', full_name: 'Ada Lovelace' });
    expect(calls[1]).toEqual(['eq', 'id', 'u-1']);
    expect(await screen.findByText('Profile saved')).toBeTruthy();
  });
  it('maps 23505 to "That username is taken"', async () => {
    const user = userEvent.setup();
    setup({}, { tables: { profiles: { data: null, error: { code: '23505', message: 'dup' } } } });
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That username is taken');
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
  });
  it('maps 23514 to the format message', async () => {
    const user = userEvent.setup();
    setup({}, { tables: { profiles: { data: null, error: { code: '23514', message: 'profiles_username_check' } } } });
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('3 to 24');
  });
  it('checks the username format on the client', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'No Good');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByRole('alert')).toHaveTextContent('3 to 24');
    expect(client.from).not.toHaveBeenCalled();
  });
  it('uploads an avatar to the avatars bucket and saves the path', async () => {
    const user = userEvent.setup();
    const { client, auth } = setup();
    await user.upload(screen.getByLabelText('Choose a profile picture'), png());
    await waitFor(() => expect(auth.refreshProfile).toHaveBeenCalled());
    expect(client.storage.from).toHaveBeenCalledWith('avatars');
    const [path] = client.bucket.upload.mock.calls[0];
    expect(path).toMatch(/^u-1\/avatar-\d+\.png$/);
    expect(client.queries[0].q.calls[0]).toEqual(['update', { avatar_path: path }]);
  });
  it('rejects a non-image file on the client', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { client } = setup();
    await user.upload(screen.getByLabelText('Choose a profile picture'), new File(['x'], 'a.pdf', { type: 'application/pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('PNG, JPEG');
    expect(client.bucket.upload).not.toHaveBeenCalled();
  });
  it('rejects an image over 2 MiB', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Choose a profile picture'), big);
    expect(await screen.findByRole('alert')).toHaveTextContent('2 MiB');
    expect(client.bucket.upload).not.toHaveBeenCalled();
  });
  it('shows the avatar from the public URL and removes it', async () => {
    const user = userEvent.setup();
    const profile = { ...PROFILE, avatar_path: 'u-1/avatar-1.png' };
    const { client, auth } = setup({ profile });
    expect(document.querySelector('.avatar img')).toHaveAttribute('src', 'http://storage/avatars/u-1/avatar-1.png');
    await user.click(screen.getByRole('button', { name: 'Remove picture' }));
    await waitFor(() => expect(auth.refreshProfile).toHaveBeenCalled());
    expect(client.bucket.remove).toHaveBeenCalledWith(['u-1/avatar-1.png']);
  });
  it('hides "Remove picture" without an avatar', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'Remove picture' })).toBeNull();
  });
  it('changes the password when both fields match', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.type(screen.getByLabelText('New password'), 'another-pass');
    await user.type(screen.getByLabelText('Confirm new password'), 'another-pass');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(auth.updatePassword).toHaveBeenCalledWith('another-pass');
    expect(await screen.findByText('Password changed')).toBeTruthy();
    expect(screen.getByLabelText('New password')).toHaveValue('');
  });
  it('does not change the password when they differ', async () => {
    const user = userEvent.setup();
    const { auth } = setup();
    await user.type(screen.getByLabelText('New password'), 'another-pass');
    await user.type(screen.getByLabelText('Confirm new password'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    expect(screen.getByRole('alert')).toHaveTextContent('do not match');
    expect(auth.updatePassword).not.toHaveBeenCalled();
  });
  it('signs out of this device with signOut()', async () => {
    const user = userEvent.setup();
    const { auth, client } = setup();
    await user.click(screen.getByRole('button', { name: 'Sign out of this device' }));
    expect(auth.signOut).toHaveBeenCalled();
    expect(client.auth.signOut).not.toHaveBeenCalled();
  });
  it('signs out everywhere with scope global', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    await user.click(screen.getByRole('button', { name: 'Sign out of all devices' }));
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });
  it('shows a sign-out error', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    client.auth.signOut.mockResolvedValue({ error: { message: 'network down' } });
    await user.click(screen.getByRole('button', { name: 'Sign out of all devices' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });
});
