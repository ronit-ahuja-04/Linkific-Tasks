/**
 * Redux state must be plain data. Firestore returns Timestamp objects (with toMillis), so every
 * snapshot is converted before it is dispatched.
 */
export function toPlain(value) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

export const docToPlain = (snapshotDoc) => ({ id: snapshotDoc.id, ...toPlain(snapshotDoc.data()) });

export const userLabel = (user) => user?.displayName || user?.email || 'Someone';

/** `unwrap()` throws the rejectWithValue string when there is one, otherwise an error object */
export const errorMessageOf = (err, fallback = 'Something went wrong.') =>
  typeof err === 'string' ? err : err?.message || fallback;
