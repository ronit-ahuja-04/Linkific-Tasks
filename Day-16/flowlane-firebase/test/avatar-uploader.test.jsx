// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../src/context/LanguageContext.jsx';
import { ToastProvider } from '../src/context/ToastContext.jsx';
import ToastViewport from '../src/components/ToastViewport.jsx';
import AvatarUploader from '../src/components/AvatarUploader.jsx';

const h = vi.hoisted(() => ({ auth: {}, setProfilePhoto: vi.fn(), removeProfilePhoto: vi.fn() }));
vi.mock('../src/context/AuthContext', () => ({ useAuth: () => h.auth }));
vi.mock('../src/lib/profilePhoto', () => ({
  setProfilePhoto: (...a) => h.setProfilePhoto(...a),
  removeProfilePhoto: (...a) => h.removeProfilePhoto(...a),
}));

const png = (over = {}) => new File([new Uint8Array(100)], 'me.png', { type: 'image/png', ...over });

function setup(user = {}) {
  h.auth = { user: { uid: 'u1', email: 'ann@x.com', photoURL: null, ...user }, refreshUser: vi.fn().mockResolvedValue(undefined) };
  render(
    <LanguageProvider><ToastProvider><AvatarUploader /><ToastViewport /></ToastProvider></LanguageProvider>,
  );
  return userEvent.setup({ applyAccept: false });
}
const chooser = () => screen.getByLabelText('Choose a profile photo');

beforeEach(() => { localStorage.clear(); h.setProfilePhoto.mockReset().mockResolvedValue('https://files/x'); h.removeProfilePhoto.mockReset().mockResolvedValue(); });
afterEach(cleanup);

describe('AvatarUploader', () => {
  it('shows the first letter of the email when there is no photo, and no Remove button', () => {
    setup();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upload photo' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull();
  });

  it('shows the photo when there is one, with Change and Remove', () => {
    setup({ photoURL: 'https://files/me.png' });
    expect(screen.getByRole('img', { name: 'Your profile photo' }).getAttribute('src')).toBe('https://files/me.png');
    expect(screen.getByRole('button', { name: 'Change photo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeTruthy();
  });

  it('uploads the chosen image, reloads the user and says so', async () => {
    const user = setup();
    await user.upload(chooser(), png());
    await waitFor(() => expect(h.auth.refreshUser).toHaveBeenCalledOnce());
    expect(h.setProfilePhoto).toHaveBeenCalledOnce();
    expect(h.setProfilePhoto.mock.calls[0][0].name).toBe('me.png');
    expect((await screen.findAllByText('Profile photo updated')).length).toBeGreaterThan(0);
  });

  it('shows progress while uploading and disables the buttons', async () => {
    let finish;
    h.setProfilePhoto.mockImplementation((_file, onProgress) => new Promise((resolve) => { onProgress(40); finish = resolve; }));
    const user = setup();
    await user.upload(chooser(), png());
    const bar = await screen.findByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(screen.getByRole('status').textContent).toBe('Uploading... 40%');
    expect(screen.getByRole('button', { name: 'Upload photo' }).disabled).toBe(true);
    finish('https://files/x');
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
  });

  it('refuses a file that is not an image without calling Storage', async () => {
    const user = setup();
    await user.upload(chooser(), png({ type: 'application/pdf' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Choose a PNG, JPEG, GIF or WebP image.');
    expect(h.setProfilePhoto).not.toHaveBeenCalled();
  });

  it('refuses an image over 2 MB and names the limit', async () => {
    const user = setup();
    await user.upload(chooser(), new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
    expect((await screen.findByRole('alert')).textContent).toBe('That image is too big. The limit is 2.0 MB.');
    expect(h.setProfilePhoto).not.toHaveBeenCalled();
  });

  it('explains a Storage failure and leaves the user unchanged', async () => {
    h.setProfilePhoto.mockRejectedValue({ code: 'storage/unauthorized' });
    const user = setup();
    await user.upload(chooser(), png());
    expect((await screen.findByRole('alert')).textContent).toMatch(/not allowed/);
    expect(h.auth.refreshUser).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Upload photo' }).disabled).toBe(false);
  });

  it('removes the photo', async () => {
    const user = setup({ photoURL: 'https://files/me.png' });
    await user.click(screen.getByRole('button', { name: 'Remove photo' }));
    await waitFor(() => expect(h.removeProfilePhoto).toHaveBeenCalledOnce());
    expect(h.auth.refreshUser).toHaveBeenCalledOnce();
    expect((await screen.findAllByText('Profile photo removed')).length).toBeGreaterThan(0);
  });

  it('can pick the same file again after an error', async () => {
    const user = setup();
    await user.upload(chooser(), png({ type: 'text/plain' }));
    await screen.findByRole('alert');
    await user.upload(chooser(), png());
    await waitFor(() => expect(h.setProfilePhoto).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
