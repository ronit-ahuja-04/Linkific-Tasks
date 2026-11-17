import { vi } from 'vitest';

/**
 * A tiny fake of the supabase client for the Notes and Lab tests.
 *   fake.from('notes').select('*').eq('a', 1)  records [['select', ...], ['eq', 'a', 1]] and resolves to respond(call)
 *   fake.rpc(name, args)                       resolves to respond({ rpc: name, args })
 *   fake.channel(name).on(type, filter, cb).subscribe(cb)   captures the callbacks so a test can feed events in
 * `respond` is replaced by each test; the default answers with an empty successful result.
 */
export function createFakeClient() {
  const fake = {
    calls: [],
    channels: [],
    removed: [],
    respond: () => ({ data: [], error: null, count: 0 }),
  };

  const builder = (table) => {
    const call = { table, ops: [] };
    fake.calls.push(call);
    const proxy = new Proxy({}, {
      get(_target, name) {
        if (name === 'then') return (resolve, reject) => Promise.resolve(fake.respond(call)).then(resolve, reject);
        return (...args) => { call.ops.push([name, ...args]); return proxy; };
      },
    });
    return proxy;
  };

  fake.from = (table) => builder(table);
  fake.rpc = (name, args) => {
    const call = { rpc: name, args, ops: [] };
    fake.calls.push(call);
    return Promise.resolve(fake.respond(call));
  };
  fake.channel = (name) => {
    const channel = { name, handlers: [], statusCallback: null };
    channel.on = (type, filter, callback) => { channel.handlers.push({ type, filter, callback }); return channel; };
    channel.subscribe = (callback) => { channel.statusCallback = callback; return channel; };
    fake.channels.push(channel);
    return channel;
  };
  fake.removeChannel = vi.fn(async (channel) => { fake.removed.push(channel); });

  /** Calls recorded for a table, as plain objects */
  fake.callsFor = (table) => fake.calls.filter((call) => call.table === table);
  /** The first argument list of an operation in a call: op(call, 'eq') -> ['visibility', 'team'] */
  fake.op = (call, name) => call.ops.find((entry) => entry[0] === name)?.slice(1);
  fake.hasOp = (call, name) => call.ops.some((entry) => entry[0] === name);
  return fake;
}
