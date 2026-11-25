// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { avatarPathFor, friendlyProfileError, removeAvatar, signOutScope, updateProfile, uploadAvatar, validateAvatarFile } from '../src/lib/profiles';
import { fakeClient } from './helpers/auth';

const png = (size = 100) => ({ type: 'image/png', size, name: 'me.png' });

describe('friendlyProfileError', () => {
  it('23505 is a taken username, 23514 a format problem', () => {
    expect(friendlyProfileError({ code: '23505' })).toBe('That username is taken.');
    expect(friendlyProfileError({ code: '23514', message: 'violates check constraint "profiles_username_check"' })).toMatch(/3 to 24/);
    expect(friendlyProfileError({ code: '23514', message: 'profiles_bio_check' })).toMatch(/280/);
  });
  it('PGRST116 (an update that matched no row) means the account is gone: says so, in words', () => {
    expect(friendlyProfileError({ code: 'PGRST116', message: 'Cannot coerce the result to a single JSON object' })).toMatch(/account could not be found.*sign in again/i);
  });
  it('passes other messages through', () => {
    expect(friendlyProfileError({ code: '99', message: 'oops' })).toBe('oops');
  });
});

describe('validateAvatarFile', () => {
  it('accepts allowed types within 2 MiB', () => expect(validateAvatarFile(png())).toBe(''));
  it('rejects other types, big and empty files', () => {
    expect(validateAvatarFile({ type: 'application/pdf', size: 5 })).toMatch(/PNG/);
    expect(validateAvatarFile(png(2 * 1024 * 1024 + 1))).toMatch(/2 MiB/);
    expect(validateAvatarFile(png(0))).toMatch(/empty/);
    expect(validateAvatarFile(null)).toMatch(/Choose/);
  });
});

describe('updateProfile', () => {
  it('updates my row only and returns it', async () => {
    const client = fakeClient({ tables: { profiles: { data: { id: 'u-1' }, error: null } } });
    const { data, error } = await updateProfile(client, 'u-1', { fullName: ' Ada ', username: 'ada', bio: '' });
    expect(error).toBeNull();
    expect(data).toEqual({ id: 'u-1' });
    expect(client.queries[0].table).toBe('profiles');
    const calls = client.queries[0].q.calls;
    expect(calls[0]).toEqual(['update', { full_name: 'Ada', bio: null, username: 'ada' }]);
    expect(calls[1]).toEqual(['eq', 'id', 'u-1']);
  });
  it('does not send an empty username', async () => {
    const client = fakeClient();
    await updateProfile(client, 'u-1', { fullName: 'A', username: '  ', bio: 'b' });
    expect(client.queries[0].q.calls[0][1]).not.toHaveProperty('username');
  });
  it('returns the database error unchanged', async () => {
    const client = fakeClient({ tables: { profiles: { data: null, error: { code: '23505' } } } });
    expect((await updateProfile(client, 'u-1', { username: 'grace' })).error.code).toBe('23505');
  });
});

describe('avatars', () => {
  it('path is <user id>/avatar-<stamp>.<ext>', () => {
    expect(avatarPathFor('u-1', { type: 'image/jpeg' }, 5)).toBe('u-1/avatar-5.jpg');
  });
  it('uploads to the avatars bucket, saves the path, removes the old object', async () => {
    const client = fakeClient({ tables: { profiles: { data: { id: 'u-1', avatar_path: 'u-1/avatar-9.png' }, error: null } } });
    const { error } = await uploadAvatar(client, { userId: 'u-1', file: png(), oldPath: 'u-1/avatar-1.png', stamp: 9 });
    expect(error).toBeNull();
    expect(client.storage.from).toHaveBeenCalledWith('avatars');
    expect(client.bucket.upload).toHaveBeenCalledWith('u-1/avatar-9.png', expect.anything(), expect.objectContaining({ upsert: false, contentType: 'image/png' }));
    expect(client.queries[0].q.calls[0]).toEqual(['update', { avatar_path: 'u-1/avatar-9.png' }]);
    expect(client.bucket.remove).toHaveBeenCalledWith(['u-1/avatar-1.png']);
  });
  it('does not upload an invalid file', async () => {
    const client = fakeClient();
    const { error } = await uploadAvatar(client, { userId: 'u-1', file: { type: 'text/plain', size: 3 }, stamp: 1 });
    expect(error.message).toMatch(/PNG/);
    expect(client.bucket.upload).not.toHaveBeenCalled();
  });
  it('stops when the upload fails', async () => {
    const client = fakeClient({ storage: { upload: async () => ({ data: null, error: { message: 'too big' } }) } });
    const { error } = await uploadAvatar(client, { userId: 'u-1', file: png(), stamp: 1 });
    expect(error.message).toBe('too big');
    expect(client.from).not.toHaveBeenCalled();
  });
  it('removes the new object again when saving the path fails', async () => {
    const client = fakeClient({ tables: { profiles: { data: null, error: { message: 'denied' } } } });
    const { error } = await uploadAvatar(client, { userId: 'u-1', file: png(), oldPath: 'u-1/old.png', stamp: 2 });
    expect(error.message).toBe('denied');
    expect(client.bucket.remove).toHaveBeenCalledTimes(1);
    expect(client.bucket.remove).toHaveBeenCalledWith(['u-1/avatar-2.png']);
  });
  it('removeAvatar clears the column then deletes the file', async () => {
    const client = fakeClient({ tables: { profiles: { data: { id: 'u-1' }, error: null } } });
    await removeAvatar(client, { userId: 'u-1', path: 'u-1/avatar-1.png' });
    expect(client.queries[0].q.calls[0]).toEqual(['update', { avatar_path: null }]);
    expect(client.bucket.remove).toHaveBeenCalledWith(['u-1/avatar-1.png']);
  });
  it('removeAvatar keeps the file when the row update fails', async () => {
    const client = fakeClient({ tables: { profiles: { data: null, error: { message: 'x' } } } });
    const { error } = await removeAvatar(client, { userId: 'u-1', path: 'p' });
    expect(error).toBeTruthy();
    expect(client.bucket.remove).not.toHaveBeenCalled();
  });
});

describe('signOutScope', () => {
  it('passes the scope to auth.signOut', async () => {
    const client = fakeClient();
    await signOutScope(client, 'global');
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });
});
