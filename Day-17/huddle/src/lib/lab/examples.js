/**
 * THE QUERY LAB CATALOGUE: runnable supabase-js examples.
 *
 * Every example has:  code (what you would write)  ·  sql (what PostgREST runs for it)  ·  run(ctx) (the same call, for real).
 * `ctx` is { client, userId }. run() returns { data, error, count } like supabase-js does (or { skipped: 'why' }).
 *
 * SAFETY: examples only touch rows of the signed-in user, titled "lab-scratch-...", and delete them again.
 * `expect` says what a correct run looks like: 'rows' (default), 'empty' (RLS filtered everything out: no error!) or 'error'.
 */

export const SCRATCH_PREFIX = 'lab-scratch-';
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export const GROUPS = [
  { id: 'select', label: 'Select and filter' },
  { id: 'order', label: 'Order and pages' },
  { id: 'relations', label: 'Relations' },
  { id: 'write', label: 'Insert, update, delete' },
  { id: 'rpc', label: 'Functions (rpc)' },
  { id: 'rls', label: 'Row Level Security demos' },
  { id: 'realtime', label: 'Realtime' },
];

/** A scratch note title, unique enough to find it again */
const scratchTitle = (label) => `${SCRATCH_PREFIX}${label}-${Date.now()}`;

/** Remove every scratch note of mine (used as cleanup after each write example, and by the "Clean up" button) */
export function cleanupScratch(client, userId) {
  return client.from('notes').delete().eq('owner_id', userId).like('title', `${SCRATCH_PREFIX}%`);
}

/** Another person's team note, if there is one: needed to demo "you cannot change it". */
async function findTeamNoteOfSomeoneElse({ client, userId }) {
  const { data, error } = await client.from('notes').select('id, title, pinned, owner_id').eq('visibility', 'team').neq('owner_id', userId).limit(1);
  return { note: data?.[0] ?? null, error };
}

/** Run a write example against a scratch note and always clean up, even when the call fails */
async function withScratch(ctx, label, work) {
  try {
    return await work(scratchTitle(label));
  } finally {
    await cleanupScratch(ctx.client, ctx.userId);
  }
}

export const EXAMPLES = [
  // ---------------------------------------------------------------- select and filter
  {
    id: 'select-columns', group: 'select', title: 'Choose columns',
    explain: 'select() with a list of columns returns only those. select("*") returns all of them. Fewer columns means less data over the network.',
    code: "await supabase\n  .from('notes')\n  .select('id, title, priority')\n  .limit(5)",
    sql: 'select id, title, priority\nfrom notes\n-- RLS adds: where owner_id = auth.uid() or visibility = \'team\'\nlimit 5',
    run: ({ client }) => client.from('notes').select('id, title, priority').limit(5),
  },
  {
    id: 'eq', group: 'select', title: '.eq(): equals',
    explain: 'eq(column, value) is "column = value". Use it for exact matches such as a status or an id.',
    code: "await supabase\n  .from('notes')\n  .select('title, visibility')\n  .eq('visibility', 'team')",
    sql: "select title, visibility\nfrom notes\nwhere visibility = 'team'",
    run: ({ client }) => client.from('notes').select('title, visibility').eq('visibility', 'team'),
  },
  {
    id: 'gt-lt', group: 'select', title: '.gt() and .lt(): ranges',
    explain: 'gt is ">", lt is "<" (gte and lte include the value). Chaining two filters joins them with AND.',
    code: "await supabase\n  .from('notes')\n  .select('title, priority')\n  .gt('priority', 0)\n  .lt('priority', 5)",
    sql: 'select title, priority\nfrom notes\nwhere priority > 0 and priority < 5',
    run: ({ client }) => client.from('notes').select('title, priority').gt('priority', 0).lt('priority', 5),
  },
  {
    id: 'in', group: 'select', title: '.in(): one of a list',
    explain: 'in(column, [a, b, c]) is "column in (a, b, c)". Handy when you already hold a list of ids.',
    code: "await supabase\n  .from('notes')\n  .select('title, priority')\n  .in('priority', [3, 4, 5])",
    sql: 'select title, priority\nfrom notes\nwhere priority in (3, 4, 5)',
    run: ({ client }) => client.from('notes').select('title, priority').in('priority', [3, 4, 5]),
  },
  {
    id: 'ilike', group: 'select', title: '.ilike(): case-insensitive search',
    explain: 'ilike is LIKE that ignores upper and lower case. % matches any text. It reads the whole column; for real search use full-text search (see search_notes below).',
    code: "await supabase\n  .from('notes')\n  .select('title')\n  .ilike('title', '%a%')",
    sql: "select title\nfrom notes\nwhere title ilike '%a%'",
    run: ({ client }) => client.from('notes').select('title').ilike('title', '%a%'),
  },
  {
    id: 'or', group: 'select', title: '.or(): either condition',
    explain: 'Filters are ANDed by default. or() takes one string of conditions joined with OR, written as column.operator.value.',
    code: "await supabase\n  .from('notes')\n  .select('title, priority, pinned')\n  .or('priority.gte.4,pinned.eq.true')",
    sql: 'select title, priority, pinned\nfrom notes\nwhere priority >= 4 or pinned = true',
    run: ({ client }) => client.from('notes').select('title, priority, pinned').or('priority.gte.4,pinned.eq.true'),
  },
  {
    id: 'maybe-single', group: 'select', title: '.maybeSingle(): at most one row',
    explain: 'single() demands exactly one row and gives an error otherwise. maybeSingle() accepts zero or one and returns an object (or null) instead of an array.',
    code: "await supabase\n  .from('profiles')\n  .select('username, bio')\n  .eq('id', userId)\n  .maybeSingle()",
    sql: "select username, bio\nfrom profiles\nwhere id = '<my user id>'\nlimit 1",
    run: ({ client, userId }) => client.from('profiles').select('username, bio').eq('id', userId).maybeSingle(),
  },
  // ---------------------------------------------------------------- order and pages
  {
    id: 'order-limit', group: 'order', title: '.order() and .limit()',
    explain: 'order() can be chained: the second one breaks ties of the first. limit(n) keeps the first n rows.',
    code: "await supabase\n  .from('notes')\n  .select('title, pinned, updated_at')\n  .order('pinned', { ascending: false })\n  .order('updated_at', { ascending: false })\n  .limit(3)",
    sql: 'select title, pinned, updated_at\nfrom notes\norder by pinned desc, updated_at desc\nlimit 3',
    run: ({ client }) => client.from('notes').select('title, pinned, updated_at').order('pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(3),
  },
  {
    id: 'range', group: 'order', title: '.range(): pagination',
    explain: 'range(from, to) is inclusive and counts from 0, so range(0, 1) is the first page of 2 and range(2, 3) the second. Always order first, or pages are not stable.',
    code: "await supabase\n  .from('notes')\n  .select('title')\n  .order('created_at', { ascending: false })\n  .range(0, 1)",
    sql: 'select title\nfrom notes\norder by created_at desc\nlimit 2 offset 0',
    run: ({ client }) => client.from('notes').select('title').order('created_at', { ascending: false }).range(0, 1),
  },
  {
    id: 'count', group: 'order', title: 'count: "exact"',
    explain: 'Ask for a count next to the rows. The count ignores range/limit, which is what a "page 1 of 5" label needs. It is shown below as "count".',
    code: "await supabase\n  .from('notes')\n  .select('title', { count: 'exact' })\n  .range(0, 1)",
    sql: 'select title from notes limit 2 offset 0;\n-- and, for the count:\nselect count(*) from notes',
    run: ({ client }) => client.from('notes').select('title', { count: 'exact' }).range(0, 1),
  },
  {
    id: 'head', group: 'order', title: 'head: true (count only)',
    explain: 'head: true sends a HEAD request: no rows come back, only the count. The cheapest way to ask "how many?" (the notification bell does this).',
    code: "await supabase\n  .from('notes')\n  .select('*', { count: 'exact', head: true })\n  .eq('visibility', 'team')",
    sql: "select count(*)\nfrom notes\nwhere visibility = 'team'",
    run: ({ client }) => client.from('notes').select('*', { count: 'exact', head: true }).eq('visibility', 'team'),
  },
  // ---------------------------------------------------------------- relations
  {
    id: 'profiles-notes', group: 'relations', title: 'Embedded select: profiles -> notes (one to many)',
    explain: 'Because notes.owner_id references profiles.id, PostgREST knows the relationship. "notes(...)" inside the select nests each person\'s notes as an array. RLS still applies to the nested rows: other people\'s private notes are not in the arrays.',
    code: "await supabase\n  .from('profiles')\n  .select('username, notes(id, title, visibility)')\n  .limit(3)",
    sql: 'select p.username,\n       (select json_agg(n) from notes n where n.owner_id = p.id) as notes\nfrom profiles p\nlimit 3',
    run: ({ client }) => client.from('profiles').select('username, notes(id, title, visibility)').limit(3),
  },
  {
    id: 'rooms-messages', group: 'relations', title: 'Embedded select: rooms -> messages',
    explain: 'The same idea for rooms and messages. limit(2, { referencedTable }) limits the NESTED rows (two messages per room) instead of the rooms.',
    code: "await supabase\n  .from('rooms')\n  .select('name, messages(id, body)')\n  .limit(2, { referencedTable: 'messages' })\n  .limit(3)",
    sql: 'select r.name,\n       (select json_agg(m) from (select id, body from messages where room_id = r.id limit 2) m) as messages\nfrom rooms r\nlimit 3',
    run: ({ client }) => client.from('rooms').select('name, messages(id, body)').limit(2, { referencedTable: 'messages' }).limit(3),
  },
  {
    id: 'many-to-many', group: 'relations', title: 'Many to many: notes -> note_tags -> tags',
    explain: 'A note has many tags and a tag has many notes, joined by the table note_tags. Nest the join table and then the tags: note_tags(tags(name)).',
    code: "await supabase\n  .from('notes')\n  .select('title, note_tags(tags(name))')\n  .eq('owner_id', userId)\n  .limit(5)",
    sql: "select n.title, ...\nfrom notes n\nleft join note_tags nt on nt.note_id = n.id\nleft join tags t on t.id = nt.tag_id\nwhere n.owner_id = '<me>'",
    run: ({ client, userId }) => client.from('notes').select('title, note_tags(tags(name))').eq('owner_id', userId).limit(5),
  },
  {
    id: 'embed-count', group: 'relations', title: 'Count of related rows',
    explain: 'messages(count) nests only the number of messages per room, not the messages themselves.',
    code: "await supabase\n  .from('rooms')\n  .select('name, messages(count)')",
    sql: 'select r.name, (select count(*) from messages m where m.room_id = r.id) as messages\nfrom rooms r',
    run: ({ client }) => client.from('rooms').select('name, messages(count)'),
  },
  // ---------------------------------------------------------------- write
  {
    id: 'insert', group: 'write', mutates: true, title: 'insert() then select().single()',
    explain: 'insert([...]) writes rows. By default nothing comes back; add select() to get the new row (Postgres "returning"), and single() to get an object instead of an array. The scratch note is deleted afterwards.',
    code: "const { data } = await supabase\n  .from('notes')\n  .insert([{ owner_id: userId, title: 'lab-scratch-insert' }])\n  .select()\n  .single()\n// ...then cleaned up with .delete().eq('id', data.id)",
    sql: "insert into notes (owner_id, title)\nvalues ('<me>', 'lab-scratch-insert')\nreturning *",
    run: (ctx) => withScratch(ctx, 'insert', (title) => ctx.client.from('notes').insert([{ owner_id: ctx.userId, title }]).select().single()),
  },
  {
    id: 'update', group: 'write', mutates: true, title: 'update().eq()',
    explain: 'update() sets columns on every row matching the filters. ALWAYS add a filter: without one it targets every row you can update. This example inserts a scratch note, updates it, and cleans up.',
    code: "await supabase\n  .from('notes')\n  .update({ priority: 5, pinned: true })\n  .eq('id', scratchId)\n  .select()",
    sql: "update notes\nset priority = 5, pinned = true\nwhere id = '<scratch id>'\nreturning *",
    run: (ctx) => withScratch(ctx, 'update', async (title) => {
      const made = await ctx.client.from('notes').insert([{ owner_id: ctx.userId, title }]).select().single();
      if (made.error) return made;
      return ctx.client.from('notes').update({ priority: 5, pinned: true }).eq('id', made.data.id).select();
    }),
  },
  {
    id: 'upsert', group: 'write', mutates: true, title: 'upsert(): insert or update',
    explain: 'upsert inserts, or updates when the row already exists. onConflict names the unique columns that decide "already exists" (tags are unique per owner and name). Running it twice never fails.',
    code: "await supabase\n  .from('tags')\n  .upsert({ owner_id: userId, name: 'lab-scratch-tag' },\n          { onConflict: 'owner_id,name' })\n  .select()",
    sql: "insert into tags (owner_id, name)\nvalues ('<me>', 'lab-scratch-tag')\non conflict (owner_id, name) do update set name = excluded.name\nreturning *",
    run: async (ctx) => {
      const row = { owner_id: ctx.userId, name: `${SCRATCH_PREFIX}tag` };
      await ctx.client.from('tags').upsert(row, { onConflict: 'owner_id,name' });
      try {
        return await ctx.client.from('tags').upsert(row, { onConflict: 'owner_id,name' }).select();
      } finally {
        await ctx.client.from('tags').delete().eq('owner_id', ctx.userId).eq('name', row.name);
      }
    },
  },
  {
    id: 'delete', group: 'write', mutates: true, title: 'delete().eq()',
    explain: 'delete() removes rows matching the filters (again: always filter). Add select() to see which rows were deleted; an empty array means nothing matched, or RLS hid the row.',
    code: "await supabase\n  .from('notes')\n  .delete()\n  .eq('id', scratchId)\n  .select()",
    sql: "delete from notes\nwhere id = '<scratch id>'\nreturning *",
    run: (ctx) => withScratch(ctx, 'delete', async (title) => {
      const made = await ctx.client.from('notes').insert([{ owner_id: ctx.userId, title }]).select().single();
      if (made.error) return made;
      return ctx.client.from('notes').delete().eq('id', made.data.id).select();
    }),
  },
  // ---------------------------------------------------------------- rpc
  {
    id: 'rpc-stats', group: 'rpc', title: "rpc('workspace_stats')",
    explain: 'rpc() calls a Postgres function you wrote. This one returns a JSON object with five numbers in a single round trip (the dashboard uses it). It runs as you, so the counts respect RLS.',
    code: "await supabase.rpc('workspace_stats')",
    sql: 'select workspace_stats()',
    run: ({ client }) => client.rpc('workspace_stats'),
  },
  {
    id: 'rpc-search', group: 'rpc', title: "rpc('search_notes', { q })",
    explain: 'Full-text search: the function turns the text into a tsquery (websearch syntax: "quoted phrases", -excluded, or), matches the generated tsvector column through a GIN index, and ranks results. The snippet marks matches with [[ ]].',
    code: "await supabase.rpc('search_notes', { q: 'note' })",
    sql: "select * from search_notes('note')",
    run: ({ client }) => client.rpc('search_notes', { q: 'note' }),
  },
  // ---------------------------------------------------------------- RLS
  {
    id: 'rls-read', group: 'rls', expect: 'empty', title: "Read someone else's private note",
    explain: 'We ask for private notes that belong to other people.',
    rls: 'The select policy only lets you read rows where owner_id is you OR visibility is team. Everything else is filtered out silently: you get an empty list and NO error, as if those rows did not exist. That is on purpose: an error would reveal that a secret note exists.',
    code: "await supabase\n  .from('notes')\n  .select('id, title')\n  .eq('visibility', 'private')\n  .neq('owner_id', userId)",
    sql: "select id, title from notes\nwhere visibility = 'private' and owner_id <> '<me>'\n-- RLS adds: and (owner_id = '<me>' or visibility = 'team')  => nothing can match",
    run: ({ client, userId }) => client.from('notes').select('id, title').eq('visibility', 'private').neq('owner_id', userId),
  },
  {
    id: 'rls-update', group: 'rls', expect: 'empty', title: "Update someone else's note",
    explain: "We find a team note written by another user (you may read it) and try to change it. The change is harmless on purpose: it sets 'pinned' to the value it already has.",
    rls: 'The update policy only targets rows where owner_id is you. For this row the USING condition is false, so the UPDATE matches 0 rows: no error, nothing changed. Reading a row does not give you the right to change it.',
    code: "await supabase\n  .from('notes')\n  .update({ pinned: theirNote.pinned })\n  .eq('id', theirNote.id)\n  .select()",
    sql: "update notes set pinned = <same value>\nwhere id = '<their note>'\n-- RLS adds: and owner_id = '<me>'  => 0 rows\nreturning *",
    run: async (ctx) => {
      const { note, error } = await findTeamNoteOfSomeoneElse(ctx);
      if (error) return { data: null, error };
      if (!note) return { skipped: "No team note by another user exists yet. Sign in as a second user, create a note with 'Team' visibility, then come back." };
      return ctx.client.from('notes').update({ pinned: note.pinned }).eq('id', note.id).select();
    },
  },
  {
    id: 'rls-delete', group: 'rls', expect: 'empty', title: "Delete someone else's note",
    explain: 'The same discovery, then a delete. Nothing is deleted.',
    rls: 'The delete policy is "owner_id = me". The row is not in the set of rows you may delete, so the DELETE matches 0 rows and returns an empty array.',
    code: "await supabase\n  .from('notes')\n  .delete()\n  .eq('id', theirNote.id)\n  .select()",
    sql: "delete from notes where id = '<their note>'\n-- RLS adds: and owner_id = '<me>'  => 0 rows\nreturning *",
    run: async (ctx) => {
      const { note, error } = await findTeamNoteOfSomeoneElse(ctx);
      if (error) return { data: null, error };
      if (!note) return { skipped: 'No team note by another user exists yet, so there is nothing to try to delete.' };
      return ctx.client.from('notes').delete().eq('id', note.id).select();
    },
  },
  {
    id: 'rls-insert-as', group: 'rls', expect: 'error', title: 'Insert a note as someone else',
    explain: 'We try to write a note whose owner_id is another user (or a made-up id when there is no other user).',
    rls: 'Inserts are checked by WITH CHECK (owner_id = auth.uid()). The new row fails it, so Postgres rejects the whole statement with error 42501 "new row violates row-level security policy". Unlike reads, a forbidden WRITE is an error.',
    code: "await supabase\n  .from('notes')\n  .insert([{ owner_id: someoneElse, title: 'lab-scratch-forged' }])",
    sql: "insert into notes (owner_id, title)\nvalues ('<someone else>', 'lab-scratch-forged')\n-- RLS: with check (owner_id = '<me>') fails => error 42501",
    run: async ({ client, userId }) => {
      const { data } = await client.from('profiles').select('id').neq('id', userId).limit(1);
      const someoneElse = data?.[0]?.id ?? ZERO_UUID;
      const result = await client.from('notes').insert([{ owner_id: someoneElse, title: `${SCRATCH_PREFIX}forged` }]);
      if (!result.error) await cleanupScratch(client, someoneElse); // would only run if the policy were missing
      return result;
    },
  },
  {
    id: 'rls-notification', group: 'rls', expect: 'error', title: 'Insert a notification yourself',
    explain: 'Notifications are created by a database trigger when someone is @mentioned. We try to insert one directly.',
    rls: 'Here it is not a row policy but a COLUMN/TABLE privilege: INSERT on notifications was revoked from signed-in users (migration 4). Postgres answers 42501 "permission denied for table notifications". Only the trusted trigger can write notifications, which is why you can believe them.',
    code: "await supabase.from('notifications').insert([{\n  user_id: userId, type: 'mention',\n  room_id: someRoomId, message_id: 1, message: 'fake'\n}])",
    sql: "insert into notifications (user_id, type, room_id, message_id, message)\nvalues ('<me>', 'mention', '<room>', 1, 'fake')\n-- privilege check first => error 42501",
    run: ({ client, userId }) => client.from('notifications').insert([{ user_id: userId, type: 'mention', room_id: ZERO_UUID, message_id: 1, message: 'fake' }]),
  },
  // ---------------------------------------------------------------- realtime (handled by runRealtimeDemo)
  {
    id: 'realtime', group: 'realtime', kind: 'realtime', mutates: true, title: 'Realtime: watch a table change',
    explain: 'Subscribe to changes on notes, then insert, update and delete a scratch note. Each change arrives in the browser over a websocket as an event. It works because migration 6 added notes to the supabase_realtime publication; Realtime also checks RLS before sending each change.',
    code: "const channel = supabase\n  .channel('lab-demo')\n  .on('postgres_changes',\n      { event: '*', schema: 'public', table: 'notes' },\n      (payload) => console.log(payload.eventType, payload.new))\n  .subscribe()\n// ...insert / update / delete a note, then:\nsupabase.removeChannel(channel)",
    sql: "-- no query: Postgres streams its write-ahead log.\n-- alter publication supabase_realtime add table notes;",
  },
];

/**
 * Run one example and describe the outcome in a uniform shape:
 *   { status: 'rows' | 'empty' | 'error' | 'skipped', data, count, error, ok }
 * `ok` is true when the outcome is what the example is meant to show (an RLS demo that is denied is a success).
 */
export async function runExample(example, ctx) {
  let raw;
  try {
    raw = await example.run(ctx);
  } catch (thrown) {
    raw = { data: null, error: { message: thrown?.message ?? String(thrown) } };
  }
  if (raw.skipped) return { status: 'skipped', data: null, count: null, error: null, message: raw.skipped, ok: false };
  const { data = null, error = null, count = null } = raw;
  let status = 'rows';
  if (error) status = 'error';
  else if (data === null || (Array.isArray(data) && data.length === 0)) status = 'empty';
  // a head-only count has no rows by design
  if (!error && status === 'empty' && count !== null && count !== undefined && data === null) status = 'rows';
  const expected = example.expect ?? 'rows';
  return { status, data, count, error, message: '', ok: status === expected || (expected === 'rows' && status === 'empty' && !error) };
}

/**
 * The Realtime demo: subscribe -> insert -> update -> delete a scratch note, collecting the events that arrive.
 * Resolves with { events, error }. Always removes the channel and the scratch note.
 */
export async function runRealtimeDemo({ client, userId }, { timeoutMs = 6000, onEvent } = {}) {
  const events = [];
  const waiters = [];
  const notify = () => waiters.splice(0).forEach((wake) => wake());
  const until = (check) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for the event. Is the realtime service running?')), timeoutMs);
    const test = () => {
      if (check()) { clearTimeout(timer); resolve(); } else waiters.push(test);
    };
    test();
  });

  let subscribed = false;
  const channel = client
    .channel(`lab-demo-${userId}-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
      const row = payload.new?.id ? payload.new : payload.old;
      if (!String(row?.title ?? '').startsWith(SCRATCH_PREFIX) && payload.eventType !== 'DELETE') return;
      const entry = { type: payload.eventType, title: payload.new?.title ?? payload.old?.title ?? null, id: row?.id ?? null };
      events.push(entry);
      onEvent?.(entry);
      notify();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') { subscribed = true; notify(); }
    });

  try {
    await until(() => subscribed);
    const made = await client.from('notes').insert([{ owner_id: userId, title: scratchTitle('realtime') }]).select().single();
    if (made.error) return { events, error: made.error };
    await until(() => events.some((e) => e.type === 'INSERT'));
    const updated = await client.from('notes').update({ priority: 3 }).eq('id', made.data.id);
    if (updated.error) return { events, error: updated.error };
    await until(() => events.some((e) => e.type === 'UPDATE'));
    const removed = await client.from('notes').delete().eq('id', made.data.id);
    if (removed.error) return { events, error: removed.error };
    await until(() => events.some((e) => e.type === 'DELETE'));
    return { events, error: null };
  } catch (thrown) {
    return { events, error: { message: thrown.message } };
  } finally {
    await client.removeChannel(channel);
    await cleanupScratch(client, userId);
  }
}
