// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  MAX_FILE_BYTES, buildPath, createPreviewUrls, createShareLink, deleteFile, describeError, deleteFile as del,
  formatBytes, formatCountdown, isImage, listFiles, plainObjectUrl, probeUrl, safeName, uploadFile, validateFile,
} from '../src/lib/files';
import { makeClient } from './helpers/files';

const file = (over = {}) => ({ name: 'my notes.txt', size: 12, type: 'text/plain', ...over });

describe('names and paths', () => {
  it('sanitises file names', () => {
    expect(safeName('my notes (1).txt')).toBe('my-notes-1-.txt');
    expect(safeName('../../etc/passwd')).toBe('etc-passwd');
    expect(safeName('café.png')).toBe('cafe.png');
    expect(safeName('///')).toBe('file');
  });
  it('puts the user id first, the folder the storage policies check', () => {
    expect(buildPath('u1', 'a b.txt', 'abc')).toBe('u1/abc-a-b.txt');
  });
  it('generates a different path each time', () => {
    expect(buildPath('u1', 'a.txt')).not.toBe(buildPath('u1', 'a.txt'));
  });
});

describe('validation and formatting', () => {
  it('rejects empty and oversize files, accepts the limit', () => {
    expect(validateFile(null)).toMatch(/Choose/);
    expect(validateFile(file({ size: 0 }))).toMatch(/empty/);
    expect(validateFile(file({ size: MAX_FILE_BYTES + 1 }))).toMatch(/limit is 10.0 MB/);
    expect(validateFile(file({ size: MAX_FILE_BYTES }))).toBeNull();
  });
  it('formats sizes, countdowns and image types', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatCountdown(185)).toBe('3:05');
    expect(formatCountdown(3600)).toBe('1:00:00');
    expect(formatCountdown(-4)).toBe('0:00');
    expect(isImage('image/png')).toBe(true);
    expect(isImage('text/plain')).toBe(false);
    expect(isImage(null)).toBe(false);
  });
  it('maps errors to sentences', () => {
    expect(describeError({ message: 'new row violates row-level security policy' })).toMatch(/not allowed/);
    expect(describeError({ message: 'The object exceeded the maximum allowed size' })).toMatch(/10 MB/);
    expect(describeError({ message: 'boom' })).toBe('boom');
    expect(describeError(null)).toBe('Something went wrong.');
  });
});

describe('uploadFile', () => {
  it('uploads to the private bucket with upsert:false, then inserts the row', async () => {
    const row = { id: 'f1', name: 'my notes.txt' };
    const client = makeClient({ tables: { files: { data: row, error: null } } });
    const { data, error } = await uploadFile(client, 'u1', file(), { noteId: 'n1' });
    expect(error).toBeNull();
    expect(data).toBe(row);
    expect(client.storage.from).toHaveBeenCalledWith('attachments');
    const [path, , options] = client.storageBucket.upload.mock.calls[0];
    expect(path).toMatch(/^u1\/[0-9a-f-]{36}-my-notes.txt$/);
    expect(options).toEqual({ contentType: 'text/plain', upsert: false });
    const insert = client.log.find((c) => c.method === 'insert').args[0];
    expect(insert).toMatchObject({ name: 'my notes.txt', mime: 'text/plain', size: 12, path, note_id: 'n1' });
    expect(client.log.find((c) => c.method === 'select').args[0]).toContain('note:notes');
  });
  it('falls back to octet-stream when the type is unknown', async () => {
    const client = makeClient({ tables: { files: { data: {}, error: null } } });
    await uploadFile(client, 'u1', file({ type: '' }));
    expect(client.storageBucket.upload.mock.calls[0][2].contentType).toBe('application/octet-stream');
  });
  it('sends nothing when validation fails', async () => {
    const client = makeClient();
    const { error } = await uploadFile(client, 'u1', file({ size: MAX_FILE_BYTES + 1 }));
    expect(error.message).toMatch(/limit/);
    expect(client.storageBucket.upload).not.toHaveBeenCalled();
  });
  it('does not insert a row when the upload fails', async () => {
    const client = makeClient({ bucket: { upload: vi.fn(async () => ({ data: null, error: { message: 'nope' } })) } });
    const { error } = await uploadFile(client, 'u1', file());
    expect(error.message).toBe('nope');
    expect(client.from).not.toHaveBeenCalled();
  });
  it('rolls back the stored bytes when the row insert fails', async () => {
    const client = makeClient({ tables: { files: { data: null, error: { message: 'rls' } } } });
    const { error } = await uploadFile(client, 'u1', file());
    expect(error.message).toBe('rls');
    const uploaded = client.storageBucket.upload.mock.calls[0][0];
    expect(client.storageBucket.remove).toHaveBeenCalledWith([uploaded]);
  });
});

describe('queries', () => {
  it('lists my files newest first with the note joined in, one page at a time with the total (Day 24)', () => {
    const client = makeClient();
    listFiles(client, 'u1');
    expect(client.from).toHaveBeenCalledWith('files');
    expect(client.log.map((c) => [c.method, ...c.args])).toEqual([
      ['select', '*, note:notes(id, title)', { count: 'exact' }], ['eq', 'owner_id', 'u1'], ['order', 'created_at', { ascending: false }],
      ['order', 'id', { ascending: false }], ['range', 0, 99],
    ]);
    listFiles(client, 'u1', { from: 100 });
    expect(client.log.at(-1)).toEqual({ table: 'files', method: 'range', args: [100, 199] });
  });
  it('creates a signed URL with the chosen expiry', async () => {
    const client = makeClient();
    const { data } = await createShareLink(client, 'u1/a.txt', 3600);
    expect(client.storageBucket.createSignedUrl).toHaveBeenCalledWith('u1/a.txt', 3600);
    expect(data).toEqual({ url: 'http://x/sign/u1/a.txt?t=3600', seconds: 3600 });
  });
  it('returns the error when signing fails', async () => {
    const client = makeClient({ bucket: { createSignedUrl: vi.fn(async () => ({ data: null, error: { message: 'Object not found' } })) } });
    const { data, error } = await createShareLink(client, 'u1/a.txt', 60);
    expect(data).toBeNull();
    expect(error.message).toBe('Object not found');
  });
  it('builds a path to url map for previews in one request', async () => {
    const client = makeClient();
    const { data } = await createPreviewUrls(client, ['a', 'b']);
    expect(client.storageBucket.createSignedUrls).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ a: 'http://x/sign/a', b: 'http://x/sign/b' });
    expect((await createPreviewUrls(client, [])).data).toEqual({});
  });
  it('removes the object first, then the row by id', async () => {
    const client = makeClient();
    const { error } = await deleteFile(client, { id: 'f1', path: 'u1/a.txt' });
    expect(error).toBeNull();
    expect(client.storageBucket.remove).toHaveBeenCalledWith(['u1/a.txt']);
    expect(client.log.find((c) => c.method === 'eq').args).toEqual(['id', 'f1']);
  });
  it('keeps the row when the object cannot be removed', async () => {
    const client = makeClient({ bucket: { remove: vi.fn(async () => ({ data: null, error: { message: 'x' } })) } });
    const { error } = await del(client, { id: 'f1', path: 'p' });
    expect(error.message).toBe('x');
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe('probeUrl and plainObjectUrl', () => {
  it('builds the public-style URL used for the demo', () => {
    expect(plainObjectUrl(makeClient(), 'u1/a.txt')).toBe('http://x/public/u1/a.txt');
  });
  it('reports the status without any auth header', async () => {
    const fetchFn = vi.fn(async () => ({ status: 400, ok: false }));
    expect(await probeUrl('http://x', fetchFn)).toEqual({ status: 400, ok: false });
    expect(fetchFn.mock.calls[0][1].headers).toBeUndefined();
  });
  it('reports a network failure', async () => {
    const r = await probeUrl('http://x', vi.fn(async () => { throw new Error('offline'); }));
    expect(r).toMatchObject({ ok: false, status: null, error: 'offline' });
  });
});
