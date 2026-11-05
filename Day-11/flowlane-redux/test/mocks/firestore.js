import { vi } from 'vitest';

let autoId = 0;
const refPath = (base, path) =>
  base?.type === 'collection' ? [base.path, ...path].join('/') : path.join('/');

/** A tiny stand-in for 'firebase/firestore': refs are plain objects, writes are vi.fn spies */
export const firestoreMock = {
  collection: vi.fn((base, ...path) => ({ type: 'collection', path: refPath(base, path) })),
  doc: vi.fn((base, ...path) => {
    if (base?.type === 'collection' && path.length === 0) {
      const id = `auto-${++autoId}`;
      return { type: 'doc', id, path: `${base.path}/${id}` };
    }
    const full = refPath(base, path);
    return { type: 'doc', id: full.split('/').pop(), path: full };
  }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn((...args) => ({ type: 'query', args })),
  where: vi.fn((...args) => ({ where: args })),
  orderBy: vi.fn((...args) => ({ orderBy: args })),
  limit: vi.fn((n) => ({ limit: n })),
  onSnapshot: vi.fn(),
  arrayUnion: vi.fn((...values) => ({ arrayUnion: values })),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
};

export const resetFirestoreMock = () => {
  for (const fn of Object.values(firestoreMock)) fn.mockClear?.();
  for (const name of ['setDoc', 'updateDoc', 'deleteDoc']) {
    firestoreMock[name].mockReset();
    firestoreMock[name].mockResolvedValue(undefined);
  }
  firestoreMock.getDocs.mockReset();
  firestoreMock.getDoc.mockReset();
  firestoreMock.onSnapshot.mockReset();
};
