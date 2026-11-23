// @vitest-environment jsdom
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../src/auth/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import FilesPage from '../src/pages/FilesPage';
import { makeClient } from './helpers/files';
import { expectToast } from './helpers/toast';

const FILES = [
  { id: 'f1', name: 'photo.png', mime: 'image/png', size: 2048, path: 'u1/a-photo.png', created_at: '2026-11-17T10:00:00Z', note: { id: 'n1', title: 'Launch plan' } },
  { id: 'f2', name: 'report.pdf', mime: 'application/pdf', size: 3 * 1024 * 1024, path: 'u1/b-report.pdf', created_at: '2026-11-16T10:00:00Z', note: null },
];

function setup(clientOpts = {}, { profile = { username: 'ada' } } = {}) {
  const client = makeClient({
    tables: { files: { data: FILES, error: null }, notes: { data: [{ id: 'n1', title: 'Launch plan' }], error: null } },
    ...clientOpts,
  });
  const value = { client, user: { id: 'u1' }, profile, status: 'authenticated' };
  const utils = render(
    <MemoryRouter><AuthContext.Provider value={value}><ToastProvider><FilesPage /></ToastProvider></AuthContext.Provider></MemoryRouter>
  );
  return { client, ...utils };
}

describe('FilesPage', () => {
  it('sets the title and lists files with size, type and the attached note', async () => {
    setup();
    expect(document.title).toBe('Files · Huddle');
    expect(screen.getByText('Loading your files...')).toBeTruthy();
    const rows = await screen.findAllByTestId('file-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('photo.png')).toBeTruthy();
    expect(within(rows[0]).getByText(/2.0 KB/)).toBeTruthy();
    expect(within(rows[0]).getByText('Note: Launch plan')).toBeTruthy();
    expect(within(rows[1]).getByText(/3.0 MB/)).toBeTruthy();
  });

  it('shows a preview of image files through a signed URL', async () => {
    const { client } = setup();
    const img = await screen.findByAltText('Preview of photo.png');
    expect(img.getAttribute('src')).toBe('http://x/sign/u1/a-photo.png');
    expect(client.storageBucket.createSignedUrls).toHaveBeenCalledWith(['u1/a-photo.png'], 600);
  });

  it('shows the empty state', async () => {
    setup({ tables: { files: { data: [], error: null }, notes: { data: [], error: null } } });
    expect(await screen.findByText(/No files yet/)).toBeTruthy();
  });

  it('shows a load error', async () => {
    setup({ tables: { files: { data: null, error: { message: 'db down' } }, notes: { data: [], error: null } } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/db down/);
  });

  it('uploads a chosen file and adds it to the list', async () => {
    const created = { id: 'f3', name: 'new.txt', mime: 'text/plain', size: 5, path: 'u1/c-new.txt', created_at: '2026-11-17T11:00:00Z', note: null };
    const user = userEvent.setup();
    const { client } = setup({ tables: { files: { data: FILES, error: null }, notes: { data: [], error: null } } });
    await screen.findAllByTestId('file-row');
    client.from.mockImplementation(() => makeClient({ tables: { files: { data: created, error: null } } }).from('files'));
    await user.upload(screen.getByLabelText('Choose files to upload'), new File(['hello'], 'new.txt', { type: 'text/plain' }));
    await waitFor(() => expect(client.storageBucket.upload).toHaveBeenCalled());
    expect(await screen.findByText('new.txt')).toBeTruthy();
    expect(screen.getAllByRole('status').some((n) => /Uploaded 1 file/.test(n.textContent))).toBe(true);
  });

  it('refuses a file over 10 MB without calling storage and shows the reason', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    await screen.findAllByTestId('file-row');
    const big = new File(['x'], 'big.bin');
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    await user.upload(screen.getByLabelText('Choose files to upload'), big);
    expect((await expectToast(/big.bin.*limit is 10.0 MB/)).textContent).toMatch(/11.0 MB/);
    expect(client.storageBucket.upload).not.toHaveBeenCalled();
  });

  it('rolls back and reports when the row insert fails', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    await screen.findAllByTestId('file-row');
    client.from.mockImplementation(() => makeClient({ tables: { files: { data: null, error: { message: 'row-level security' } } } }).from('files'));
    await user.upload(screen.getByLabelText('Choose files to upload'), new File(['hello'], 'x.txt', { type: 'text/plain' }));
    await expectToast(/x.txt: You are not allowed/);
    expect(client.storageBucket.remove).toHaveBeenCalledTimes(1);
  });

  it('downloads through storage.download and an object URL', async () => {
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { client } = setup();
    const rows = await screen.findAllByTestId('file-row');
    await user.click(within(rows[1]).getByRole('button', { name: /Download/ }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(client.storageBucket.download).toHaveBeenCalledWith('u1/b-report.pdf');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    click.mockRestore();
  });

  it('shows an error toast when the download fails', async () => {
    const user = userEvent.setup();
    setup({ bucket: { download: vi.fn(async () => ({ data: null, error: { message: 'Object not found' } })) } });
    const rows = await screen.findAllByTestId('file-row');
    await user.click(within(rows[0]).getByRole('button', { name: /Download/ }));
    await expectToast(/Download failed: Object not found/);
  });

  it('deletes after confirmation: storage first, then the row, then removes it from the list', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    const rows = await screen.findAllByTestId('file-row');
    await user.click(within(rows[1]).getByRole('button', { name: 'Delete report.pdf' }));
    expect(client.storageBucket.remove).not.toHaveBeenCalled();
    await user.click(within(rows[1]).getByRole('button', { name: 'Confirm delete' }));
    await waitFor(() => expect(screen.getAllByTestId('file-row')).toHaveLength(1));
    expect(client.storageBucket.remove).toHaveBeenCalledWith(['u1/b-report.pdf']);
    expect(client.log.some((c) => c.method === 'delete')).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'My files' }));
  });

  it('can cancel a delete', async () => {
    const user = userEvent.setup();
    const { client } = setup();
    const rows = await screen.findAllByTestId('file-row');
    await user.click(within(rows[0]).getByRole('button', { name: 'Delete photo.png' }));
    await user.click(within(rows[0]).getByRole('button', { name: 'Cancel' }));
    expect(within(rows[0]).getByRole('button', { name: 'Delete photo.png' })).toBeTruthy();
    expect(client.storageBucket.remove).not.toHaveBeenCalled();
  });
});

describe('share link', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
  afterEach(() => { vi.useRealTimers(); });

  it('creates a signed URL with the chosen expiry, counts down and expires', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { client } = setup();
    const rows = await screen.findAllByTestId('file-row');
    const row = rows[1];
    await user.selectOptions(within(row).getByLabelText(/Link expires after/), '60');
    const intervals = vi.spyOn(globalThis, 'setInterval');
    await user.click(within(row).getByRole('button', { name: /Share link/ }));
    expect(client.storageBucket.createSignedUrl).toHaveBeenCalledWith('u1/b-report.pdf', 60);
    expect(within(row).getByLabelText('Signed URL').value).toBe('http://x/sign/u1/b-report.pdf?t=60');
    expect(within(row).getByTestId('countdown').textContent).toMatch(/^Expires in (1:00|0:59)$/);
    // user-event clicks outside act(), so the effect that starts the 1-second tick can still be queued here.
    // Advancing the clock before it exists moved nothing (the Day 17 flake): wait for the tick to be scheduled first.
    await waitFor(() => expect(intervals.mock.calls.some(([, ms]) => ms === 1000)).toBe(true));
    intervals.mockRestore();
    act(() => { vi.advanceTimersByTime(5000); });
    // (real time also leaks into the fake clock with shouldAdvanceTime, so a slow machine may be a second further)
    expect(within(row).getByTestId('countdown').textContent).toMatch(/^Expires in 0:5[2-5]$/);
    act(() => { vi.advanceTimersByTime(60000); });
    expect(within(row).getByTestId('countdown').textContent).toMatch(/Expired/);
    expect(within(row).getByRole('button', { name: /Copy/ }).disabled).toBe(true);
  });

  it('copies the link and confirms it', async () => {
    const writeText = vi.fn(async () => {});
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { client } = setup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const rows = await screen.findAllByTestId('file-row');
    await user.click(within(rows[0]).getByRole('button', { name: /Share link/ }));
    await user.click(within(rows[0]).getByRole('button', { name: /Copy/ }));
    expect(writeText).toHaveBeenCalledWith('http://x/sign/u1/a-photo.png?t=3600');
    expect(await within(rows[0]).findByText('Copied to the clipboard')).toBeTruthy();
    expect(client.storageBucket.createSignedUrl).toHaveBeenCalledWith('u1/a-photo.png', 3600);
  });

  it('shows an error when signing fails', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    setup({ bucket: { createSignedUrl: vi.fn(async () => ({ data: null, error: { message: 'Object not found' } })) } });
    const rows = await screen.findAllByTestId('file-row');
    await user.click(within(rows[0]).getByRole('button', { name: /Share link/ }));
    await expectToast(/Could not create a link: Object not found/);
    expect(within(rows[0]).queryByTestId('countdown')).toBeNull();
  });
});

describe('public vs private panel', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('says a private object is refused without a signature', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => ({ status: 400, ok: false }));
    vi.stubGlobal('fetch', fetchMock);
    setup();
    await screen.findAllByTestId('file-row');
    await user.click(screen.getByRole('button', { name: 'Try to open it without a signature' }));
    expect((await screen.findByTestId('private-result')).textContent).toMatch(/Refused \(HTTP 400\)/);
    expect(fetchMock.mock.calls[0][0]).toBe('http://x/public/u1/a-photo.png');
  });

  it('opens a public avatar URL without auth', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(async () => ({ status: 200, ok: true })));
    setup({}, { profile: { username: 'ada', avatar_path: 'u1/avatar.png' } });
    await user.click(await screen.findByRole('button', { name: /Open my avatar without signing in/ }));
    expect((await screen.findByTestId('public-result')).textContent).toMatch(/Opened \(HTTP 200\)/);
  });

  it('asks for a profile picture when there is none', async () => {
    setup();
    expect(await screen.findByText(/Set a profile picture/)).toBeTruthy();
  });
});
