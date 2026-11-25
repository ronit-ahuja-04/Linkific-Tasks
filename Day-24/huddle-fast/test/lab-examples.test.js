import { describe, expect, it } from 'vitest';
import { EXAMPLES, GROUPS, SCRATCH_PREFIX, cleanupScratch, runExample, runRealtimeDemo } from '../src/lib/lab/examples';
import { createFakeClient } from './helpers/notes-fake';

const byId = (id) => EXAMPLES.find((example) => example.id === id);
const ctx = (fake) => ({ client: fake, userId: 'me' });

describe('the catalogue', () => {
  it('has about 20 or more examples with unique ids', () => {
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length);
  });

  it('gives every example a title, explanation, code and SQL, and a known group', () => {
    const groups = GROUPS.map((g) => g.id);
    EXAMPLES.forEach((e) => {
      expect(e.title && e.explain && e.code && e.sql, e.id).toBeTruthy();
      expect(groups).toContain(e.group);
    });
  });

  it('explains what RLS did in every RLS demo', () => {
    const demos = EXAMPLES.filter((e) => e.group === 'rls');
    expect(demos.length).toBeGreaterThanOrEqual(4);
    demos.forEach((e) => expect(e.rls, e.id).toBeTruthy());
  });

  it('covers every operator the contract asks for', () => {
    const code = EXAMPLES.map((e) => e.code).join('\n');
    ['.eq(', '.gt(', '.lt(', '.in(', '.ilike(', '.order(', '.limit(', '.range(', 'head: true', 'upsert(', "rpc('workspace_stats')", "rpc('search_notes'", 'postgres_changes'].forEach((needle) => expect(code).toContain(needle));
  });
});

describe('runExample', () => {
  it('runs the same call the code shows', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: [{ id: 1 }], error: null });
    const outcome = await runExample(byId('eq'), ctx(fake));
    expect(fake.calls[0].table).toBe('notes');
    expect(fake.calls[0].ops).toContainEqual(['eq', 'visibility', 'team']);
    expect(outcome).toMatchObject({ status: 'rows', ok: true });
  });

  it('reports an error', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: null, error: { code: 'X', message: 'bad' } });
    expect(await runExample(byId('eq'), ctx(fake))).toMatchObject({ status: 'error', ok: false });
  });

  it('turns a thrown exception into an error result', async () => {
    const outcome = await runExample({ run: () => { throw new Error('boom'); } }, ctx(createFakeClient()));
    expect(outcome.status).toBe('error');
    expect(outcome.error.message).toBe('boom');
  });

  it('counts a head-only request as rows', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: null, error: null, count: 4 });
    expect(await runExample(byId('head'), ctx(fake))).toMatchObject({ status: 'rows', count: 4, ok: true });
  });

  it('treats an empty RLS read as the expected result', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: [], error: null });
    expect(await runExample(byId('rls-read'), ctx(fake))).toMatchObject({ status: 'empty', ok: true });
  });

  it('treats an RLS write denial as the expected result', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: null, error: { code: '42501', message: 'new row violates row-level security policy' } });
    expect(await runExample(byId('rls-insert-as'), ctx(fake))).toMatchObject({ status: 'error', ok: true });
    expect(await runExample(byId('rls-notification'), ctx(fake))).toMatchObject({ status: 'error', ok: true });
  });

  it('flags a broken policy: the forged insert succeeding is NOT ok', async () => {
    const fake = createFakeClient();
    fake.respond = () => ({ data: null, error: null });
    expect((await runExample(byId('rls-insert-as'), ctx(fake))).ok).toBe(false);
  });

  it('the update demo targets another user\'s team note and changes nothing', async () => {
    const fake = createFakeClient();
    fake.respond = (call) => (fake.hasOp(call, 'update') ? { data: [], error: null } : { data: [{ id: 'theirs', pinned: false, owner_id: 'other' }], error: null });
    const outcome = await runExample(byId('rls-update'), ctx(fake));
    const find = fake.calls[0];
    expect(find.ops).toContainEqual(['neq', 'owner_id', 'me']);
    expect(fake.op(fake.calls[1], 'update')).toEqual([{ pinned: false }]);
    expect(outcome).toMatchObject({ status: 'empty', ok: true });
  });

  it('skips with an explanation when there is no other user\'s note', async () => {
    const fake = createFakeClient();
    const outcome = await runExample(byId('rls-update'), ctx(fake));
    expect(outcome.status).toBe('skipped');
    expect(outcome.message).toMatch(/second user/);
    expect(fake.calls).toHaveLength(1);
  });

  it('write examples insert a scratch note and always clean up, even on failure', async () => {
    const fake = createFakeClient();
    fake.respond = (call) => (fake.hasOp(call, 'insert') ? { data: null, error: { code: '23514', message: 'nope' } } : { data: [], error: null });
    const outcome = await runExample(byId('update'), ctx(fake));
    expect(outcome.status).toBe('error');
    const insert = fake.calls.find((c) => fake.hasOp(c, 'insert'));
    expect(fake.op(insert, 'insert')[0][0].title.startsWith(SCRATCH_PREFIX)).toBe(true);
    const cleanup = fake.calls.at(-1);
    expect(cleanup.ops).toContainEqual(['like', 'title', `${SCRATCH_PREFIX}%`]);
    expect(cleanup.ops).toContainEqual(['eq', 'owner_id', 'me']);
  });

  it('cleanupScratch only deletes my lab-scratch notes', async () => {
    const fake = createFakeClient();
    await cleanupScratch(fake, 'me');
    expect(fake.calls[0].ops).toEqual([['delete'], ['eq', 'owner_id', 'me'], ['like', 'title', 'lab-scratch-%']]);
  });
});

describe('runRealtimeDemo', () => {
  it('subscribes, writes a scratch note, collects INSERT, UPDATE and DELETE, then removes the channel', async () => {
    const fake = createFakeClient();
    const row = { id: 'r1', title: `${SCRATCH_PREFIX}realtime-1` };
    const fire = (eventType, extra) => fake.channels[0].handlers[0].callback({ eventType, new: extra.new ?? {}, old: extra.old ?? {} });
    fake.respond = (call) => {
      if (fake.hasOp(call, 'insert')) { queueMicrotask(() => fire('INSERT', { new: row })); return { data: { id: 'r1' }, error: null }; }
      if (fake.hasOp(call, 'update')) { queueMicrotask(() => fire('UPDATE', { new: row })); return { data: null, error: null }; }
      if (fake.hasOp(call, 'delete') && fake.hasOp(call, 'eq') && fake.op(call, 'eq')[0] === 'id') { queueMicrotask(() => fire('DELETE', { old: row })); return { data: null, error: null }; }
      return { data: null, error: null };
    };
    const promise = runRealtimeDemo(ctx(fake), { timeoutMs: 1000 });
    await Promise.resolve();
    fake.channels[0].statusCallback('SUBSCRIBED');
    const { events, error } = await promise;
    expect(error).toBeNull();
    expect(events.map((e) => e.type)).toEqual(['INSERT', 'UPDATE', 'DELETE']);
    expect(fake.removed).toHaveLength(1);
    expect(fake.calls.at(-1).ops).toContainEqual(['like', 'title', 'lab-scratch-%']);
  });

  it('reports an error and still cleans up when the subscription never opens', async () => {
    const fake = createFakeClient();
    const { error } = await runRealtimeDemo(ctx(fake), { timeoutMs: 20 });
    expect(error.message).toMatch(/Timed out/);
    expect(fake.removed).toHaveLength(1);
  });
});
