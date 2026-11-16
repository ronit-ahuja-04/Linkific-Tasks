import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  ref: vi.fn((storage, path) => ({ storage, path, fullPath: path })),
  deleteObject: vi.fn(),
  getDownloadURL: vi.fn(),
  uploadBytesResumable: vi.fn(),
}));
vi.mock('firebase/storage', () => sdk);
vi.mock('../src/lib/firebase.js', () => ({ storage: { fake: true } }));

const {
  validateImage, safeFileName, avatarPath, attachmentPath, formatBytes, uploadFile, deleteFile, storageErrorKey,
  MAX_AVATAR_BYTES, MAX_ATTACHMENT_BYTES,
} = await import('../src/lib/storage.js');

const file = (type = 'image/png', size = 1000, name = 'a.png') => ({ type, size, name });

beforeEach(() => vi.clearAllMocks());

describe('validateImage', () => {
  it('accepts png, jpeg, gif and webp within the limit', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/gif', 'image/webp']) expect(validateImage(file(type), MAX_AVATAR_BYTES)).toBeNull();
  });
  it('refuses a missing file, a wrong type (svg can carry scripts) and a file over the limit', () => {
    expect(validateImage(undefined, 10)).toBe('none');
    expect(validateImage(file('image/svg+xml'), MAX_AVATAR_BYTES)).toBe('type');
    expect(validateImage(file('application/pdf'), MAX_AVATAR_BYTES)).toBe('type');
    expect(validateImage(file('image/png', MAX_AVATAR_BYTES + 1), MAX_AVATAR_BYTES)).toBe('size');
  });
  it('allows exactly the limit, and attachments get a bigger one than avatars', () => {
    expect(validateImage(file('image/png', MAX_AVATAR_BYTES), MAX_AVATAR_BYTES)).toBeNull();
    expect(MAX_ATTACHMENT_BYTES).toBeGreaterThan(MAX_AVATAR_BYTES);
  });
});

describe('file names and paths', () => {
  it('makes a name safe for a path and keeps the extension', () => {
    expect(safeFileName('My Photo (1).PNG')).toBe('my-photo-1.png');
    expect(safeFileName('../../etc/passwd')).not.toContain('/');
    expect(safeFileName('')).toBe('file');
    expect(safeFileName('!!!')).toBe('file');
  });
  it('puts avatars under the user and attachments under the project and task, with a unique prefix', () => {
    const a = avatarPath('u1', 'me.png');
    expect(a).toMatch(/^avatars\/u1\/[0-9a-f-]{8}-me\.png$/);
    const b = attachmentPath('p1', 't1', 'shot.png');
    expect(b).toMatch(/^projects\/p1\/tasks\/t1\/[0-9a-f-]{8}-shot\.png$/);
    expect(attachmentPath('p1', 't1', 'shot.png')).not.toBe(b);
  });
});

describe('formatBytes', () => {
  it('writes sizes for people', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatBytes(NaN)).toBe('');
  });
});

describe('uploadFile', () => {
  function fakeTask() {
    const handlers = {};
    return {
      handlers,
      snapshot: { ref: { fullPath: 'x' } },
      on: (_event, next, error, complete) => Object.assign(handlers, { next, error, complete }),
    };
  }

  it('reports progress, then resolves with the download URL and the file facts', async () => {
    const task = fakeTask();
    sdk.uploadBytesResumable.mockReturnValue(task);
    sdk.getDownloadURL.mockResolvedValue('https://files/x');
    const progress = vi.fn();
    const promise = uploadFile('avatars/u1/a.png', file('image/png', 1234, 'a.png'), progress);
    task.handlers.next({ bytesTransferred: 50, totalBytes: 200 });
    task.handlers.next({ bytesTransferred: 200, totalBytes: 200 });
    await task.handlers.complete();
    await expect(promise).resolves.toEqual({ url: 'https://files/x', path: 'avatars/u1/a.png', name: 'a.png', size: 1234, contentType: 'image/png' });
    expect(progress.mock.calls.map((c) => c[0])).toEqual([25, 100]);
    expect(sdk.uploadBytesResumable.mock.calls[0][2]).toEqual({ contentType: 'image/png' });
    expect(promise.task).toBe(task);
  });

  it('rejects when the upload fails, and when the download URL cannot be read', async () => {
    const t1 = fakeTask();
    sdk.uploadBytesResumable.mockReturnValueOnce(t1);
    const p1 = uploadFile('a', file());
    t1.handlers.error({ code: 'storage/unauthorized' });
    await expect(p1).rejects.toMatchObject({ code: 'storage/unauthorized' });

    const t2 = fakeTask();
    sdk.uploadBytesResumable.mockReturnValueOnce(t2);
    sdk.getDownloadURL.mockRejectedValueOnce(new Error('boom'));
    const p2 = uploadFile('b', file());
    await t2.handlers.complete();
    await expect(p2).rejects.toThrow('boom');
  });
});

describe('deleteFile', () => {
  it('deletes the object at the path', async () => {
    sdk.deleteObject.mockResolvedValue();
    await deleteFile('avatars/u1/a.png');
    expect(sdk.ref).toHaveBeenCalledWith({ fake: true }, 'avatars/u1/a.png');
    expect(sdk.deleteObject).toHaveBeenCalledOnce();
  });
  it('treats an already deleted file as deleted but reports every other failure', async () => {
    sdk.deleteObject.mockRejectedValueOnce({ code: 'storage/object-not-found' });
    await expect(deleteFile('gone')).resolves.toBeUndefined();
    sdk.deleteObject.mockRejectedValueOnce({ code: 'storage/unauthorized' });
    await expect(deleteFile('nope')).rejects.toMatchObject({ code: 'storage/unauthorized' });
  });
  it('does nothing without a path', async () => {
    await deleteFile('');
    expect(sdk.deleteObject).not.toHaveBeenCalled();
  });
});

describe('storageErrorKey', () => {
  it('maps SDK error codes to message keys', () => {
    expect(storageErrorKey({ code: 'storage/unauthorized' })).toBe('storage.error.denied');
    expect(storageErrorKey({ code: 'storage/retry-limit-exceeded' })).toBe('storage.error.network');
    expect(storageErrorKey({ code: 'storage/canceled' })).toBe('storage.error.canceled');
    expect(storageErrorKey({ code: 'storage/not-configured' })).toBe('storage.error.notConfigured');
    expect(storageErrorKey(new Error('x'))).toBe('storage.error.generic');
  });
});
