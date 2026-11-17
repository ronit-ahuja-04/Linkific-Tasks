/**
 * NOTES: every supabase-js call the Notes page makes. Each function takes the client first, so a test can pass a fake.
 *
 * How supabase-js talks to the database: `client.from('notes')` builds a URL for PostgREST (a small web server that sits
 * in front of Postgres). `.select().eq()...` are URL parameters; PostgREST turns them into one SQL query and runs it AS the
 * signed-in user, so the Row Level Security policies decide which rows come back.
 */

export const PAGE_SIZE = 6;

// An EMBEDDED SELECT: one request, three tables. `owner:profiles(...)` follows the foreign key notes.owner_id -> profiles.id
// (many notes to one author). `note_tags(tags(...))` follows the many-to-many through the join table note_tags.
// PostgREST does the JOINs for us; no SQL, no second request.
export const NOTE_SELECT = '*, owner:profiles(username, full_name, avatar_path), note_tags(tags(id, name))';

/** Tags of a note as a flat, sorted list: [{ id, name }] (hides the join table) */
export function flattenTags(note) {
  return (note?.note_tags ?? [])
    .map((link) => link.tags)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** "Work, ideas ,WORK" -> ['work', 'ideas'] (lowercase, unique, max 30 characters each, as the tags table allows) */
export function parseTagInput(text) {
  const names = String(text ?? '')
    .split(',')
    .map((part) => part.trim().toLowerCase().slice(0, 30))
    .filter(Boolean);
  return [...new Set(names)];
}

/** ILIKE has its own wildcards (% and _). Escape them so "50%" searches for the text "50%" and not "50 followed by anything" */
export function escapeLike(text) {
  return String(text).replace(/[\\%_]/g, (character) => `\\${character}`);
}

/** Turns supabase's error into a sentence for the screen. Codes are Postgres / PostgREST codes. */
export function mapNoteError(error) {
  if (!error) return '';
  if (error.code === '42501') return 'You are not allowed to do that (a Row Level Security policy said no).';
  if (error.code === 'PGRST116') return 'That note no longer exists, or it is not yours to change.';
  if (error.code === '23514') return 'Check the fields: the title needs 1 to 120 characters and priority is 0 to 5.';
  if (error.code === '23505') return 'That already exists.';
  if (/failed to fetch|networkerror/i.test(error.message ?? '')) return 'Could not reach Supabase. Is the local stack running?';
  return error.message || 'Something went wrong.';
}

export const DEFAULT_FILTERS = { scope: 'all', title: '', priorityAbove: '', priorityBelow: '', pinnedOnly: false, since: '', tagId: '' };

/**
 * The list query. Every filter you pick adds one call to the chain, and each call is a WHERE condition:
 *   .eq('owner_id', me)      ->  where owner_id = 'me'
 *   .eq('visibility','team') ->  where visibility = 'team'
 *   .gt('priority', 2)       ->  where priority > 2          (.lt is <, .gte is >=)
 *   .ilike('title', '%x%')   ->  where title ilike '%x%'     (case-insensitive LIKE)
 *   .eq('pinned', true)      ->  where pinned = true
 *   .order(...).order(...)   ->  order by pinned desc, updated_at desc
 *   .range(0, 5)             ->  limit 6 offset 0  (the range is inclusive)
 * `{ count: 'exact' }` makes PostgREST also count ALL matching rows (ignoring the range), so we can show "1-6 of 23".
 */
export async function listNotes(client, { userId, filters = DEFAULT_FILTERS, page = 0, pageSize = PAGE_SIZE }) {
  let noteIds = null;
  if (filters.tagId) {
    // Filtering by a tag: ask the join table which notes carry it, then use .in('id', ids) ( where id in (...) ).
    // (Filtering inside the embedded select would also hide the note's OTHER tags on the card.)
    const linked = await client.from('note_tags').select('note_id').eq('tag_id', filters.tagId);
    if (linked.error) return { data: [], count: 0, error: linked.error };
    noteIds = linked.data.map((row) => row.note_id);
    if (noteIds.length === 0) return { data: [], count: 0, error: null };
  }

  let query = client.from('notes').select(NOTE_SELECT, { count: 'exact' });
  if (filters.scope === 'mine') query = query.eq('owner_id', userId);
  if (filters.scope === 'team') query = query.eq('visibility', 'team');
  if (filters.scope === 'private') query = query.eq('visibility', 'private');
  if (filters.title.trim()) query = query.ilike('title', `%${escapeLike(filters.title.trim())}%`);
  if (filters.priorityAbove !== '') query = query.gt('priority', Number(filters.priorityAbove));
  if (filters.priorityBelow !== '') query = query.lt('priority', Number(filters.priorityBelow));
  if (filters.pinnedOnly) query = query.eq('pinned', true);
  if (filters.since) query = query.gte('created_at', new Date(`${filters.since}T00:00:00`).toISOString());
  if (noteIds) query = query.in('id', noteIds);

  const from = page * pageSize;
  const { data, count, error } = await query
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(from, from + pageSize - 1);
  return { data: data ?? [], count: count ?? 0, error };
}

/** One note with its author and tags (used after a change, to refresh a single card) */
export function getNote(client, id) {
  return client.from('notes').select(NOTE_SELECT).eq('id', id).maybeSingle();
}

/**
 * INSERT. `.insert([row])` sends one row (or several, in the array). Without `.select()` the new row is NOT returned;
 * `.select().single()` asks Postgres for it back (insert ... returning *) and unwraps the one-element array.
 */
export function createNote(client, userId, { title, body, visibility, pinned, priority }) {
  return client
    .from('notes')
    .insert([{ owner_id: userId, title: title.trim(), body, visibility, pinned, priority: Number(priority) }])
    .select()
    .single();
}

/** UPDATE ... where id = ... returning *. If RLS hides the row (not mine) zero rows match and .single() reports PGRST116 */
export function updateNote(client, id, { title, body, visibility, pinned, priority }) {
  return client
    .from('notes')
    .update({ title: title.trim(), body, visibility, pinned, priority: Number(priority) })
    .eq('id', id)
    .select()
    .single();
}

/** DELETE ... where id = ... (the rows in note_tags go with it: on delete cascade) */
export function deleteNote(client, id) {
  return client.from('notes').delete().eq('id', id);
}

/** All of MY tags (the tags policy only lets me see my own) */
export function listTags(client) {
  return client.from('tags').select('id, name').order('name');
}

/**
 * Make a note's tags equal `wanted` (array of names). A many-to-many is two writes:
 *   1. find-or-create the tags (rows in `tags`)       2. add / remove the links (rows in `note_tags`)
 */
export async function setNoteTags(client, userId, noteId, wanted, current = []) {
  const currentNames = current.map((tag) => tag.name);
  const toAdd = wanted.filter((name) => !currentNames.includes(name));
  const toRemove = current.filter((tag) => !wanted.includes(tag.name));

  if (toRemove.length > 0) {
    // delete from note_tags where note_id = ... and tag_id in (...)
    const removed = await client.from('note_tags').delete().eq('note_id', noteId).in('tag_id', toRemove.map((tag) => tag.id));
    if (removed.error) return { error: removed.error };
  }
  if (toAdd.length === 0) return { error: null };

  // which of the wanted tags exist already?
  const existing = await client.from('tags').select('id, name').in('name', toAdd);
  if (existing.error) return { error: existing.error };
  const known = new Map(existing.data.map((tag) => [tag.name, tag.id]));

  const missing = toAdd.filter((name) => !known.has(name));
  if (missing.length > 0) {
    const created = await client.from('tags').insert(missing.map((name) => ({ owner_id: userId, name }))).select('id, name');
    if (created.error) return { error: created.error };
    created.data.forEach((tag) => known.set(tag.name, tag.id));
  }

  const linked = await client.from('note_tags').insert(toAdd.map((name) => ({ note_id: noteId, tag_id: known.get(name) })));
  return { error: linked.error ?? null };
}

/**
 * FULL-TEXT SEARCH through a database function. `rpc('search_notes', { q })` is `select * from search_notes('q')`.
 * The function lives in migration 2 (websearch_to_tsquery + ts_rank + ts_headline). It runs as the caller, so RLS still
 * hides other people's private notes.
 */
export async function searchNotes(client, q) {
  const { data, error } = await client.rpc('search_notes', { q });
  return { data: data ?? [], error };
}

/**
 * The search snippet marks matches with [[ and ]] (not HTML) so we never have to trust the text.
 * "meet [[ada]] today" -> [{ text: 'meet ', match: false }, { text: 'ada', match: true }, { text: ' today', match: false }]
 * The page renders these as React text and <mark>, never as HTML, so a note containing <script> stays plain text.
 */
export function splitSnippet(snippet) {
  const parts = [];
  const pattern = /\[\[(.*?)\]\]/gs;
  let last = 0;
  let found;
  while ((found = pattern.exec(snippet ?? '')) !== null) {
    if (found.index > last) parts.push({ text: snippet.slice(last, found.index), match: false });
    parts.push({ text: found[1], match: true });
    last = found.index + found[0].length;
  }
  if (last < (snippet ?? '').length) parts.push({ text: snippet.slice(last), match: false });
  return parts;
}

let channelCounter = 0;

/**
 * REALTIME: Postgres writes every change to its write-ahead log; Realtime reads that log and pushes changes to browsers
 * over a websocket. It works for a table only if the table is in the `supabase_realtime` publication (migration 6 does that
 * for `notes`), and each change is checked against the SELECT policy first: a teammate's PRIVATE note never reaches me.
 * Returns a function that unsubscribes (call it in the effect cleanup).
 */
export function subscribeToNotes(client, { onChange, onStatus }) {
  channelCounter += 1; // a fresh name each time keeps React StrictMode's mount-unmount-mount from reusing a channel being closed
  const channel = client
    .channel(`notes-live-${channelCounter}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, onChange)
    .subscribe((status) => onStatus?.(status));
  return () => client.removeChannel(channel);
}
