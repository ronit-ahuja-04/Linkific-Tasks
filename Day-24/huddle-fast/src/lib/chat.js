/**
 * CHAT LIB: every Supabase call the chat uses, as plain functions that take the client FIRST.
 * (Taking the client as an argument keeps them testable with a fake, and keeps pages free of query details.)
 *
 * Reminder of what supabase-js does: `client.from('messages').select(...).eq(...)` builds an HTTP request to
 * PostgREST, which turns it into SQL and runs it AS THE SIGNED-IN USER, so Row Level Security (RLS) decides
 * which rows come back. Every call resolves to `{ data, error }`: it never throws for a database problem.
 */

export const PAGE_SIZE = 50;
/** Wait this long after the last key press before looking up @mentions (Day 24: one query per pause, not per key) */
export const MENTION_DEBOUNCE_MS = 150;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // the 'attachments' bucket limit
export const MAX_BODY = 2000; // messages.body check constraint

// An EMBEDDED RELATIONSHIP: "each message, plus its author's profile and its attached file", in ONE request.
// PostgREST follows the foreign keys (messages.user_id -> profiles, messages.attachment_id -> files) and
// the SQL it runs is a join with json aggregation. `author:` / `attachment:` rename the embedded objects.
export const MESSAGE_SELECT =
  '*, author:profiles(username, full_name, avatar_path), attachment:files(id, name, mime, size, path)';

/** Turn a supabase error into a short sentence for the UI */
export function friendlyError(error, fallback = 'Something went wrong. Try again.') {
  if (!error) return null;
  if (error.code === '42501' || /row-level security/i.test(error.message ?? '')) return 'You are not allowed to do that here.';
  if (error.code === '23505') return 'That name is already taken.';
  if (error.code === '23514') return 'That value is not allowed (check the length).';
  return error.message || fallback;
}

// ---- rooms ------------------------------------------------------------------------------------------------

/** Rooms I can see. No filter needed: the RLS policy already limits it to public rooms and my private ones. */
export function listRooms(client) {
  return client.from('rooms').select('id, name, slug, topic, is_private, created_by').order('name', { ascending: true });
}

/** Unread messages per room, from the SQL function unread_counts(): `rpc` calls a Postgres function by name */
export async function fetchUnreadCounts(client) {
  const { data, error } = await client.rpc('unread_counts');
  if (error) return { data: null, error };
  const counts = {};
  for (const row of data ?? []) counts[row.room_id] = Number(row.unread);
  return { data: counts, error: null };
}

/** Create a room. The creator becomes its first member through a database trigger (add_room_creator). */
export function createRoom(client, { name, topic, isPrivate }) {
  // created_by is filled by its column default auth.uid(), and RLS checks it is really me
  return client
    .from('rooms')
    .insert({ name: name.trim(), topic: topic?.trim() || null, is_private: Boolean(isPrivate) })
    .select('id, name, slug, topic, is_private, created_by')
    .single(); // `.single()`: expect exactly one row back and return it as an object, not an array
}

/** Opening a room marks it read, and joins a public room the first time (SQL function mark_room_read) */
export function markRoomRead(client, roomId) {
  return client.rpc('mark_room_read', { p_room: roomId });
}

// ---- messages ---------------------------------------------------------------------------------------------

/**
 * One page of a room, returned OLDEST FIRST. We ask for the newest (descending + limit) because that is what
 * the composite index (room_id, created_at desc) serves directly, then reverse it for display.
 * `before` (a created_at timestamp) turns it into "the page before this one": `.lt('created_at', before)`.
 */
export async function fetchMessages(client, roomId, { before = null, limit = PAGE_SIZE } = {}) {
  let query = client
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('room_id', roomId) // WHERE room_id = '...'
    .order('created_at', { ascending: false }) // ORDER BY created_at DESC
    .order('id', { ascending: false }) // , id DESC: messages with the same timestamp still come back in the order they were sent
    .limit(limit); // LIMIT 50
  if (before) query = query.lt('created_at', before); // AND created_at < '...'
  const { data, error } = await query;
  if (error) return { data: null, error };
  return { data: [...(data ?? [])].reverse(), error: null, hasMore: (data ?? []).length === limit };
}

/** One message with its author (a Realtime event only carries the bare row, so we fetch the rest) */
export function fetchMessage(client, id) {
  return client.from('messages').select(MESSAGE_SELECT).eq('id', id).maybeSingle();
}

/** Post a message. `.select(...)` after `.insert(...)` asks Postgres to RETURN the new row (INSERT ... RETURNING). */
export function sendMessage(client, { roomId, body, attachmentId = null }) {
  return client
    .from('messages')
    .insert({ room_id: roomId, body: body.trim(), attachment_id: attachmentId })
    .select(MESSAGE_SELECT)
    .single();
}

/** Edit my message. RLS only lets the author update; a trigger sets edited_at when the body changes. */
export function editMessage(client, id, body) {
  return client.from('messages').update({ body: body.trim() }).eq('id', id).select(MESSAGE_SELECT).single();
}

export function deleteMessage(client, id) {
  return client.from('messages').delete().eq('id', id);
}

// ---- merging live changes into the list (pure: easy to test) ----------------------------------------------

/** Insert or replace by id, keeping the list in created_at order. Duplicates (my own insert + its Realtime echo) collapse. */
export function upsertMessage(list, message) {
  const index = list.findIndex((m) => m.id === message.id);
  if (index >= 0) {
    const next = [...list];
    next[index] = { ...list[index], ...message };
    return next;
  }
  return [...list, message].sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : a.id - b.id));
}

export function removeMessage(list, id) {
  return list.filter((m) => m.id !== id);
}

/** Apply one postgres_changes payload ({ eventType, new, old }) to the list */
export function applyChange(list, payload) {
  if (payload.eventType === 'DELETE') return removeMessage(list, payload.old.id);
  if (payload.eventType === 'UPDATE') {
    // the event holds the bare row, so merge it over the message we already have (which keeps author and attachment)
    return list.some((m) => m.id === payload.new.id) ? upsertMessage(list, payload.new) : list;
  }
  return upsertMessage(list, payload.new);
}

// ---- mentions ---------------------------------------------------------------------------------------------

/** Split a body into plain and @mention parts, so React can render text only (never HTML) and highlight mentions */
export function splitMentions(body) {
  return String(body ?? '')
    .split(/(@[a-zA-Z0-9_]{3,24})/g)
    .filter((part) => part !== '')
    .map((text) => ({ text, mention: /^@[a-zA-Z0-9_]{3,24}$/.test(text) }));
}

/** The "@ada" the caret is in the middle of typing, or null. Returns { query, start } */
export function mentionQuery(text, caret) {
  const before = text.slice(0, caret);
  const match = /(^|\s)@([a-zA-Z0-9_]{0,24})$/.exec(before);
  if (!match) return null;
  return { query: match[2], start: before.length - match[2].length - 1 };
}

/** Replace the @fragment being typed with the chosen username and a space */
export function insertMention(text, caret, username) {
  const found = mentionQuery(text, caret);
  if (!found) return { text, caret };
  const inserted = `@${username} `;
  return { text: text.slice(0, found.start) + inserted + text.slice(caret), caret: found.start + inserted.length };
}

/** Usernames starting with a prefix. `ilike` is a case-insensitive LIKE; in LIKE, % and _ are wildcards, so escape them. */
export function searchUsernames(client, prefix, limit = 5) {
  const safe = prefix.replace(/[\\%_]/g, (c) => `\\${c}`);
  return client
    .from('profiles')
    .select('id, username, full_name')
    .ilike('username', `${safe}%`) // WHERE username ILIKE 'ad%'
    .order('username', { ascending: true })
    .limit(limit);
}

// ---- attachments ------------------------------------------------------------------------------------------

/** A file name that is safe inside a storage path: letters, digits, dot, dash, underscore */
export function safeFileName(name) {
  const cleaned = String(name ?? 'file').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+/, '').slice(-100);
  return cleaned || 'file';
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Attach a file: (1) upload the bytes to the PRIVATE bucket, in a folder named after my user id (the storage
 * policy checks that first folder), (2) insert the `files` row that describes it. If step 2 fails the upload is
 * removed again, so we never leave an orphan. Returns { data: fileRow, error }.
 */
export async function uploadAttachment(client, userId, file, uuid = () => crypto.randomUUID()) {
  if (file.size > MAX_ATTACHMENT_BYTES) return { data: null, error: { message: 'That file is larger than 10 MB.' } };
  const path = `${userId}/${uuid()}-${safeFileName(file.name)}`;
  const bucket = client.storage.from('attachments');
  const uploaded = await bucket.upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (uploaded.error) return { data: null, error: uploaded.error };
  const { data, error } = await client
    .from('files')
    .insert({ name: file.name.slice(0, 200), mime: file.type || null, size: file.size, path })
    .select('id, name, mime, size, path')
    .single();
  if (error) {
    await bucket.remove([path]);
    return { data: null, error };
  }
  return { data, error: null };
}

/** Undo an attachment (used when the message insert fails after the upload succeeded) */
export async function discardAttachment(client, file) {
  await client.from('files').delete().eq('id', file.id);
  await client.storage.from('attachments').remove([file.path]);
}

/**
 * A SIGNED URL is a normal URL with a signature and an expiry baked in: anyone holding it can download that one
 * private object until it expires (60 s here), without being signed in. Nothing permanent is ever shown.
 * Storage RLS runs when it is created: only people allowed to read the object can obtain one.
 */
export function signedDownloadUrl(client, file, seconds = 60) {
  return client.storage.from('attachments').createSignedUrl(file.path, seconds, { download: file.name });
}

// ---- notifications ----------------------------------------------------------------------------------------

/** How many unread notifications. `head: true` asks for NO rows, only the count (an HTTP HEAD request). */
export function countUnreadNotifications(client) {
  return client.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null); // WHERE read_at IS NULL
}

export function listNotifications(client, limit = 10) {
  return client
    .from('notifications')
    .select('id, type, room_id, message_id, message, created_at, read_at, rooms(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
}

/** The browser may only change read_at (a column-level grant), which is exactly what this does */
export function markAllNotificationsRead(client, now = new Date()) {
  return client.from('notifications').update({ read_at: now.toISOString() }).is('read_at', null);
}
