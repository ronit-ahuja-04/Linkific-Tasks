// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { avatarSources } from '../src/lib/avatars';
import { canThumbnail, deleteFile } from '../src/lib/files';
import { avatarFiles, uploadAvatar } from '../src/lib/profiles';
import { fakeClient } from './helpers/auth';

/** Day 24: resized avatars (64 and 256 px WebP) and file thumbnails. The resizing itself needs a real canvas: e2e. */
const png = { type: 'image/png', size: 100, name: 'me.png' };
const variant = (size) => ({ size, ext: 'webp', blob: new Blob(['x'], { type: 'image/webp' }) });
const client = { storage: { from: () => ({ getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn/avatars/${p}` } }) }) } };

describe('avatar variants', () => {
  it('uploads every variant, points the profile at the largest, with a year of caching', async () => {
    const c = fakeClient({ tables: { profiles: { data: { id: 'u-1' }, error: null } } });
    const { error } = await uploadAvatar(c, { userId: 'u-1', file: png, stamp: 7, variants: [variant(64), variant(256)] });
    expect(error).toBeNull();
    expect(c.bucket.upload).toHaveBeenCalledWith('u-1/avatar-7-64.webp', expect.anything(), expect.objectContaining({ contentType: 'image/webp', cacheControl: '31536000' }));
    expect(c.bucket.upload).toHaveBeenCalledWith('u-1/avatar-7-256.webp', expect.anything(), expect.anything());
    expect(c.queries[0].q.calls[0]).toEqual(['update', { avatar_path: 'u-1/avatar-7-256.webp' }]);
  });

  it('replacing a resized avatar removes BOTH old files', async () => {
    const c = fakeClient({ tables: { profiles: { data: { id: 'u-1' }, error: null } } });
    await uploadAvatar(c, { userId: 'u-1', file: png, oldPath: 'u-1/avatar-3-256.webp', stamp: 8, variants: [variant(64), variant(256)] });
    expect(c.bucket.remove).toHaveBeenCalledWith(['u-1/avatar-3-64.webp', 'u-1/avatar-3-256.webp']);
  });

  it('a failed second upload removes the first one (no half-saved avatar)', async () => {
    let n = 0;
    const c = fakeClient({ storage: { upload: async () => (++n === 2 ? { data: null, error: { message: 'full' } } : { data: {}, error: null }) } });
    const { error } = await uploadAvatar(c, { userId: 'u-1', file: png, stamp: 9, variants: [variant(64), variant(256)] });
    expect(error.message).toBe('full');
    expect(c.bucket.remove).toHaveBeenCalledWith(['u-1/avatar-9-64.webp']);
    expect(c.from).not.toHaveBeenCalled();
  });

  it('avatarFiles: both sizes for a resized avatar, the one file for an older avatar', () => {
    expect(avatarFiles('u/avatar-1-256.webp')).toEqual(['u/avatar-1-64.webp', 'u/avatar-1-256.webp']);
    expect(avatarFiles('u/avatar-1.png')).toEqual(['u/avatar-1.png']);
  });

  it('avatarSources: a srcset of both sizes for resized avatars; the original for older ones; null for none', () => {
    expect(avatarSources(client, 'u/avatar-1-256.webp')).toEqual({
      src: 'https://cdn/avatars/u/avatar-1-64.webp',
      srcSet: 'https://cdn/avatars/u/avatar-1-64.webp 64w, https://cdn/avatars/u/avatar-1-256.webp 256w',
    });
    expect(avatarSources(client, 'u/avatar-1.jpg')).toEqual({ src: 'https://cdn/avatars/u/avatar-1.jpg' });
    expect(avatarSources(client, null)).toBeNull();
  });
});

describe('file thumbnails', () => {
  it('only still pictures get one: not GIFs (animation), SVGs (vector) or other files', () => {
    expect(canThumbnail('image/jpeg')).toBe(true);
    expect(canThumbnail('image/png')).toBe(true);
    expect(canThumbnail('image/gif')).toBe(false);
    expect(canThumbnail('image/svg+xml')).toBe(false);
    expect(canThumbnail('application/pdf')).toBe(false);
  });

  it('deleting a file removes its thumbnail too', async () => {
    const remove = vi.fn(async () => ({ error: null }));
    const del = vi.fn(() => ({ eq: async () => ({ error: null }) }));
    const c = { storage: { from: () => ({ remove }) }, from: () => ({ delete: del }) };
    await deleteFile(c, { id: 'f', path: 'u/a.jpg', thumb_path: 'u/a.jpg.thumb.webp' });
    expect(remove).toHaveBeenCalledWith(['u/a.jpg', 'u/a.jpg.thumb.webp']);
    await deleteFile(c, { id: 'g', path: 'u/b.txt', thumb_path: null });
    expect(remove).toHaveBeenLastCalledWith(['u/b.txt']);
  });
});
