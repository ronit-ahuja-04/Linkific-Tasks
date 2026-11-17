import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS, NOTE_SELECT, createNote, deleteNote, escapeLike, flattenTags, listNotes, mapNoteError, parseTagInput,
  searchNotes, setNoteTags, splitSnippet, subscribeToNotes, updateNote,
} from '../src/lib/notes';
import { createFakeClient } from './helpers/notes-fake';

const filters = (patch) => ({ ...DEFAULT_FILTERS, ...patch });

describe('listNotes', () => {
  it('selects notes with the embedded owner and tags, counts exactly, orders and ranges', async () => {
    const fake = createFakeClient();
    await listNotes(fake, { userId: 'u1', page: 0 });
    const call = fake.callsFor('notes')[0];
    expect(fake.op(call, 'select')).toEqual([NOTE_SELECT, { count: 'exact' }]);
    expect(call.ops.filter((o) => o[0] === 'order')).toEqual([['order', 'pinned', { ascending: false }], ['order', 'updated_at', { ascending: false }]]);
    expect(fake.op(call, 'range')).toEqual([0, 5]);
  });

  it('computes the range of later pages', async () => {
    const fake = createFakeClient();
    await listNotes(fake, { userId: 'u1', page: 2 });
    expect(fake.op(fake.callsFor('notes')[0], 'range')).toEqual([12, 17]);
  });

  it('adds one filter call per choice', async () => {
    const fake = createFakeClient();
    await listNotes(fake, {
      userId: 'u1',
      filters: filters({ scope: 'mine', title: 'plan', priorityAbove: '1', priorityBelow: '5', pinnedOnly: true, since: '2026-01-02' }),
    });
    const call = fake.callsFor('notes')[0];
    const names = call.ops.map((o) => o[0]);
    expect(call.ops).toContainEqual(['eq', 'owner_id', 'u1']);
    expect(call.ops).toContainEqual(['ilike', 'title', '%plan%']);
    expect(call.ops).toContainEqual(['gt', 'priority', 1]);
    expect(call.ops).toContainEqual(['lt', 'priority', 5]);
    expect(call.ops).toContainEqual(['eq', 'pinned', true]);
    expect(names).toContain('gte');
    expect(fake.op(call, 'gte')[0]).toBe('created_at');
  });

  it('filters by visibility for the team and private scopes', async () => {
    const fake = createFakeClient();
    await listNotes(fake, { userId: 'u1', filters: filters({ scope: 'team' }) });
    await listNotes(fake, { userId: 'u1', filters: filters({ scope: 'private' }) });
    expect(fake.callsFor('notes')[0].ops).toContainEqual(['eq', 'visibility', 'team']);
    expect(fake.callsFor('notes')[1].ops).toContainEqual(['eq', 'visibility', 'private']);
  });

  it('sends no filter at all for the default filters', async () => {
    const fake = createFakeClient();
    await listNotes(fake, { userId: 'u1' });
    const names = fake.callsFor('notes')[0].ops.map((o) => o[0]);
    expect(names).toEqual(['select', 'order', 'order', 'range']);
  });

  it('filters by a tag through note_tags and .in()', async () => {
    const fake = createFakeClient();
    fake.respond = (call) => (call.table === 'note_tags' ? { data: [{ note_id: 'n1' }, { note_id: 'n2' }], error: null } : { data: [], error: null, count: 0 });
    await listNotes(fake, { userId: 'u1', filters: filters({ tagId: 't1' }) });
    expect(fake.callsFor('note_tags')[0].ops).toContainEqual(['eq', 'tag_id', 't1']);
    expect(fake.callsFor('notes')[0].ops).toContainEqual(['in', 'id', ['n1', 'n2']]);
  });

  it('returns an empty page without querying notes when the tag has no notes', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: [], error: null });
    const result = await listNotes(fake, { userId: 'u1', filters: filters({ tagId: 't1' }) });
    expect(result).toEqual({ data: [], count: 0, error: null });
    expect(fake.callsFor('notes')).toHaveLength(0);
  });

  it('passes the error through', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: null, error: { code: '42501', message: 'no' }, count: null });
    const result = await listNotes(fake, { userId: 'u1' });
    expect(result.error.code).toBe('42501');
    expect(result.data).toEqual([]);
  });
});

describe('writes', () => {
  it('createNote inserts one row and asks for it back', async () => {
    const fake = createFakeClient();
    await createNote(fake, 'u1', { title: '  Hello ', body: 'b', visibility: 'team', pinned: true, priority: '3' });
    const call = fake.callsFor('notes')[0];
    expect(fake.op(call, 'insert')).toEqual([[{ owner_id: 'u1', title: 'Hello', body: 'b', visibility: 'team', pinned: true, priority: 3 }]]);
    expect(fake.hasOp(call, 'select')).toBe(true);
    expect(fake.hasOp(call, 'single')).toBe(true);
  });

  it('updateNote filters by id', async () => {
    const fake = createFakeClient();
    await updateNote(fake, 'n1', { title: 'T', body: '', visibility: 'private', pinned: false, priority: 1 });
    const call = fake.callsFor('notes')[0];
    expect(fake.op(call, 'update')[0].title).toBe('T');
    expect(fake.op(call, 'eq')).toEqual(['id', 'n1']);
  });

  it('deleteNote filters by id', async () => {
    const fake = createFakeClient();
    await deleteNote(fake, 'n1');
    const call = fake.callsFor('notes')[0];
    expect(fake.hasOp(call, 'delete')).toBe(true);
    expect(fake.op(call, 'eq')).toEqual(['id', 'n1']);
  });
});

describe('tags', () => {
  it('parseTagInput lowercases, trims, de-duplicates and limits length', () => {
    expect(parseTagInput(' Work, ideas ,WORK,, ')).toEqual(['work', 'ideas']);
    expect(parseTagInput('x'.repeat(40))[0]).toHaveLength(30);
    expect(parseTagInput('')).toEqual([]);
  });

  it('flattenTags hides the join table and sorts', () => {
    const note = { note_tags: [{ tags: { id: '2', name: 'zeta' } }, { tags: { id: '1', name: 'alpha' } }, { tags: null }] };
    expect(flattenTags(note)).toEqual([{ id: '1', name: 'alpha' }, { id: '2', name: 'zeta' }]);
    expect(flattenTags({})).toEqual([]);
  });

  it('setNoteTags finds or creates tags, then links them, and unlinks removed ones', async () => {
    const fake = createFakeClient();
    fake.respond = (call) => {
      if (call.table === 'tags' && fake.hasOp(call, 'insert')) return { data: [{ id: 't-new', name: 'fresh' }], error: null };
      if (call.table === 'tags') return { data: [{ id: 't-old', name: 'known' }], error: null };
      return { data: null, error: null };
    };
    const { error } = await setNoteTags(fake, 'u1', 'n1', ['known', 'fresh'], [{ id: 't-gone', name: 'gone' }]);
    expect(error).toBeNull();
    const links = fake.callsFor('note_tags');
    expect(links[0].ops).toContainEqual(['in', 'tag_id', ['t-gone']]);
    expect(fake.op(fake.callsFor('tags')[1], 'insert')).toEqual([[{ owner_id: 'u1', name: 'fresh' }]]);
    expect(fake.op(links[1], 'insert')).toEqual([[{ note_id: 'n1', tag_id: 't-old' }, { note_id: 'n1', tag_id: 't-new' }]]);
  });

  it('setNoteTags does nothing when the tags did not change', async () => {
    const fake = createFakeClient();
    await setNoteTags(fake, 'u1', 'n1', ['a'], [{ id: 't', name: 'a' }]);
    expect(fake.calls).toHaveLength(0);
  });

  it('setNoteTags returns the first error', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: null, error: { code: '42501', message: 'denied' } });
    const { error } = await setNoteTags(fake, 'u1', 'n1', ['a'], []);
    expect(error.code).toBe('42501');
  });
});

describe('search and helpers', () => {
  it('searchNotes calls the rpc with q', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: [{ id: '1' }], error: null });
    const { data } = await searchNotes(fake, 'launch');
    expect(fake.calls[0]).toMatchObject({ rpc: 'search_notes', args: { q: 'launch' } });
    expect(data).toHaveLength(1);
  });

  it('splitSnippet splits on [[ ]] and keeps HTML as plain text', () => {
    expect(splitSnippet('meet [[ada]] <b>today</b>')).toEqual([
      { text: 'meet ', match: false }, { text: 'ada', match: true }, { text: ' <b>today</b>', match: false },
    ]);
    expect(splitSnippet('')).toEqual([]);
    expect(splitSnippet('[[a]][[b]]')).toHaveLength(2);
  });

  it('escapeLike escapes ILIKE wildcards', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('mapNoteError gives readable messages', () => {
    expect(mapNoteError(null)).toBe('');
    expect(mapNoteError({ code: '42501' })).toMatch(/not allowed/);
    expect(mapNoteError({ code: 'PGRST116' })).toMatch(/no longer exists/);
    expect(mapNoteError({ message: 'TypeError: Failed to fetch' })).toMatch(/Could not reach/);
    expect(mapNoteError({ message: 'boom' })).toBe('boom');
  });
});

describe('subscribeToNotes', () => {
  it('subscribes to all events on notes and removes the channel on cleanup', () => {
    const fake = createFakeClient();
    const stop = subscribeToNotes(fake, { onChange: () => {} });
    expect(fake.channels[0].handlers[0]).toMatchObject({ type: 'postgres_changes', filter: { event: '*', schema: 'public', table: 'notes' } });
    stop();
    expect(fake.removed).toEqual([fake.channels[0]]);
  });

  it('uses a different channel name each time (StrictMode safe)', () => {
    const fake = createFakeClient();
    subscribeToNotes(fake, { onChange: () => {} })();
    subscribeToNotes(fake, { onChange: () => {} })();
    expect(fake.channels[0].name).not.toBe(fake.channels[1].name);
  });
});
