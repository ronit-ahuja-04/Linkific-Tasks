// A tiny repository over plain arrays, optionally persisted to a JSON file.
// Everything is synchronous on purpose: Node is single-threaded, so there are no races
// between "read" and "write" inside one handler. Swap this file for a real DB later.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COLLECTIONS = ['users', 'sessions', 'resetTokens', 'verifyTokens', 'projects', 'tasks', 'outbox'];

export function createStore({ dbFile = ':memory:' } = {}) {
  const persistent = dbFile !== ':memory:';
  const data = Object.fromEntries(COLLECTIONS.map((c) => [c, []]));

  if (persistent && fs.existsSync(dbFile)) {
    const loaded = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    for (const c of COLLECTIONS) if (Array.isArray(loaded[c])) data[c] = loaded[c];
  }

  // Atomic write: write a temp file, then rename it over the real one. A crash mid-write
  // leaves the old file intact instead of a half-written (corrupt) one.
  function persist() {
    if (!persistent) return;
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    const tmp = `${dbFile}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 });
    fs.renameSync(tmp, dbFile);
  }

  function collection(name) {
    const rows = () => data[name];
    return {
      all: () => [...rows()],
      find: (pred) => rows().find(pred),
      filter: (pred) => rows().filter(pred),
      byId: (id) => rows().find((r) => r.id === id),
      insert(doc) {
        const row = { id: crypto.randomUUID(), ...doc };
        rows().push(row);
        persist();
        return row;
      },
      update(id, patch) {
        const row = rows().find((r) => r.id === id);
        if (!row) return undefined;
        Object.assign(row, patch);
        persist();
        return row;
      },
      remove(id) {
        const i = rows().findIndex((r) => r.id === id);
        if (i === -1) return false;
        rows().splice(i, 1);
        persist();
        return true;
      },
      removeWhere(pred) {
        const before = rows().length;
        data[name] = rows().filter((r) => !pred(r));
        persist();
        return before - data[name].length;
      },
    };
  }

  return {
    users: collection('users'),
    sessions: collection('sessions'),
    resetTokens: collection('resetTokens'),
    verifyTokens: collection('verifyTokens'),
    projects: collection('projects'),
    tasks: collection('tasks'),
    outbox: collection('outbox'),
    persist,
  };
}
