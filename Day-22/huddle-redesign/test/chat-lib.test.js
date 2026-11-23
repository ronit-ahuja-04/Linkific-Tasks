// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  MESSAGE_SELECT, applyChange, countUnreadNotifications, createRoom, deleteMessage, discardAttachment, editMessage, fetchMessages, fetchUnreadCounts,
  friendlyError, insertMention, listRooms, markAllNotificationsRead, mentionQuery, safeFileName, searchUsernames, sendMessage, signedDownloadUrl,
  splitMentions, uploadAttachment, upsertMessage,
} from '../src/lib/chat';
import { makeFakeClient, message } from './helpers/chat.jsx';

describe('chat lib: queries', () => {
  it('fetchMessages asks for the newest page with the embedded author, and returns it oldest first', async () => {
    const client = makeFakeClient();
    client.reply('messages:select', { data: [message(3), message(2), message(1)], error: null });
    const result = await fetchMessages(client, 'r1');
    const call = client.callsOn('messages', 'select')[0];
    expect(client.op(call, 'select')).toEqual([MESSAGE_SELECT]);
    expect(MESSAGE_SELECT).toContain('author:profiles(username, full_name, avatar_path)');
    expect(client.op(call, 'eq')).toEqual(['room_id', 'r1']);
    expect(client.op(call, 'order')).toEqual(['created_at', { ascending: false }]);
    expect(client.op(call, 'limit')).toEqual([50]);
    expect(result.data.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(result.hasMore).toBe(false);
  });

  it('fetchMessages pages with .lt(created_at) and reports hasMore for a full page', async () => {
    const client = makeFakeClient();
    client.reply('messages:select', { data: [message(2), message(1)], error: null });
    const result = await fetchMessages(client, 'r1', { before: '2026-11-17T10:00:05Z', limit: 2 });
    expect(client.op(client.callsOn('messages')[0], 'lt')).toEqual(['created_at', '2026-11-17T10:00:05Z']);
    expect(result.hasMore).toBe(true);
  });

  it('fetchMessages passes errors through', async () => {
    const client = makeFakeClient();
    client.reply('messages:select', { data: null, error: { message: 'boom' } });
    expect((await fetchMessages(client, 'r1')).error.message).toBe('boom');
  });

  it('listRooms selects from rooms ordered by name (RLS does the filtering)', async () => {
    const client = makeFakeClient();
    await listRooms(client);
    const call = client.callsOn('rooms', 'select')[0];
    expect(client.op(call, 'order')).toEqual(['name', { ascending: true }]);
    expect(client.op(call, 'eq')).toBeUndefined();
  });

  it('fetchUnreadCounts maps the rpc rows to { roomId: number }', async () => {
    const client = makeFakeClient();
    client.replyRpc('unread_counts', { data: [{ room_id: 'a', unread: '3' }, { room_id: 'b', unread: 0 }], error: null });
    expect((await fetchUnreadCounts(client)).data).toEqual({ a: 3, b: 0 });
    expect(client.rpcCalls[0].name).toBe('unread_counts');
  });

  it('createRoom inserts trimmed values and returns the row', async () => {
    const client = makeFakeClient();
    await createRoom(client, { name: '  Design ', topic: '', isPrivate: true });
    const call = client.callsOn('rooms', 'insert')[0];
    expect(client.op(call, 'insert')).toEqual([{ name: 'Design', topic: null, is_private: true }]);
    expect(call.ops.at(-1)[0]).toBe('single');
  });

  it('sendMessage, editMessage and deleteMessage use the right filters', async () => {
    const client = makeFakeClient();
    await sendMessage(client, { roomId: 'r1', body: ' hi ', attachmentId: 'f1' });
    expect(client.op(client.callsOn('messages', 'insert')[0], 'insert')).toEqual([{ room_id: 'r1', body: 'hi', attachment_id: 'f1' }]);
    await editMessage(client, 7, ' new ');
    const update = client.callsOn('messages', 'update')[0];
    expect(client.op(update, 'update')).toEqual([{ body: 'new' }]);
    expect(client.op(update, 'eq')).toEqual(['id', 7]);
    await deleteMessage(client, 7);
    expect(client.op(client.callsOn('messages', 'delete')[0], 'eq')).toEqual(['id', 7]);
  });

  it('searchUsernames uses ilike with a prefix and escapes LIKE wildcards', async () => {
    const client = makeFakeClient();
    await searchUsernames(client, 'a_d');
    expect(client.op(client.callsOn('profiles')[0], 'ilike')).toEqual(['username', 'a\\_d%']);
  });

  it('notification helpers count unread with head+exact and mark read with a timestamp', async () => {
    const client = makeFakeClient();
    await countUnreadNotifications(client);
    const count = client.callsOn('notifications', 'select')[0];
    expect(client.op(count, 'select')).toEqual(['id', { count: 'exact', head: true }]);
    expect(client.op(count, 'is')).toEqual(['read_at', null]);
    await markAllNotificationsRead(client, new Date('2026-11-17T10:00:00Z'));
    expect(client.op(client.callsOn('notifications', 'update')[0], 'update')).toEqual([{ read_at: '2026-11-17T10:00:00.000Z' }]);
  });
});

describe('chat lib: attachments', () => {
  const file = new File(['hello'], 'my report (1).pdf', { type: 'application/pdf' });

  it('safeFileName keeps only safe characters', () => {
    expect(safeFileName('my report (1).pdf')).toBe('my-report-1-.pdf');
    expect(safeFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(safeFileName('')).toBe('file');
  });

  it('uploadAttachment uploads to <user>/<uuid>-<name> in the private bucket, then inserts the files row', async () => {
    const client = makeFakeClient();
    client.reply('files:insert', { data: { id: 'f1', name: file.name, path: 'p' }, error: null });
    const { data } = await uploadAttachment(client, 'u-ada', file, () => 'uuid-1');
    const upload = client.storageCalls[0];
    expect(upload.bucket).toBe('attachments');
    expect(upload.args[0]).toBe('u-ada/uuid-1-my-report-1-.pdf');
    expect(upload.args[2]).toEqual({ contentType: 'application/pdf', upsert: false });
    expect(client.op(client.callsOn('files', 'insert')[0], 'insert')[0]).toMatchObject({ name: 'my report (1).pdf', size: 5, path: 'u-ada/uuid-1-my-report-1-.pdf' });
    expect(data.id).toBe('f1');
  });

  it('uploadAttachment removes the object when the files row cannot be inserted', async () => {
    const client = makeFakeClient();
    client.reply('files:insert', { data: null, error: { message: 'nope' } });
    const result = await uploadAttachment(client, 'u-ada', file, () => 'u');
    expect(result.error.message).toBe('nope');
    expect(client.storageCalls.map((c) => c.op)).toEqual(['upload', 'remove']);
  });

  it('uploadAttachment refuses files over 10 MB before sending anything', async () => {
    const client = makeFakeClient();
    const big = { name: 'big.bin', size: 11 * 1024 * 1024, type: '' };
    expect((await uploadAttachment(client, 'u', big)).error.message).toMatch(/10 MB/);
    expect(client.storageCalls).toHaveLength(0);
  });

  it('signedDownloadUrl creates a 60 second signed URL for the file path', async () => {
    const client = makeFakeClient();
    await signedDownloadUrl(client, { path: 'u/x-a.txt', name: 'a.txt' });
    expect(client.storageCalls[0]).toMatchObject({ bucket: 'attachments', op: 'createSignedUrl', args: ['u/x-a.txt', 60, { download: 'a.txt' }] });
  });

  it('discardAttachment deletes the row and the object', async () => {
    const client = makeFakeClient();
    await discardAttachment(client, { id: 'f1', path: 'u/x' });
    expect(client.op(client.callsOn('files', 'delete')[0], 'eq')).toEqual(['id', 'f1']);
    expect(client.storageCalls[0].op).toBe('remove');
  });
});

describe('chat lib: pure helpers', () => {
  it('upsertMessage de-duplicates by id and keeps created_at order', () => {
    const list = [message(1), message(3)];
    expect(upsertMessage(list, message(2)).map((m) => m.id)).toEqual([1, 2, 3]);
    expect(upsertMessage(list, message(3, { body: 'x' }))).toHaveLength(2);
  });

  it('applyChange handles INSERT, UPDATE (keeps the author) and DELETE', () => {
    let list = [message(1)];
    list = applyChange(list, { eventType: 'INSERT', new: message(2) });
    expect(list).toHaveLength(2);
    list = applyChange(list, { eventType: 'UPDATE', new: { id: 1, body: 'edited', edited_at: 'now' } });
    expect(list[0]).toMatchObject({ body: 'edited', author: { username: 'grace' } });
    list = applyChange(list, { eventType: 'DELETE', old: { id: 1 } });
    expect(list.map((m) => m.id)).toEqual([2]);
    expect(applyChange(list, { eventType: 'UPDATE', new: { id: 99, body: 'ghost' } })).toBe(list);
  });

  it('splitMentions marks @names and leaves the rest as text', () => {
    expect(splitMentions('hi @ada and @x!')).toEqual([
      { text: 'hi ', mention: false }, { text: '@ada', mention: true }, { text: ' and @x!', mention: false },
    ]);
  });

  it('mentionQuery and insertMention work around the caret', () => {
    expect(mentionQuery('hello @gr', 9)).toEqual({ query: 'gr', start: 6 });
    expect(mentionQuery('mail a@b', 8)).toBeNull();
    expect(insertMention('hello @gr and more', 9, 'grace')).toEqual({ text: 'hello @grace  and more', caret: 13 });
  });

  it('friendlyError maps RLS and constraint codes', () => {
    expect(friendlyError({ code: '42501', message: 'x' })).toMatch(/not allowed/);
    expect(friendlyError({ message: 'plain' })).toBe('plain');
    expect(friendlyError(null)).toBeNull();
  });
});
