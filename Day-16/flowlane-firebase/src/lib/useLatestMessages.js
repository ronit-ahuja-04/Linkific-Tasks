import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { docToPlain } from './serialize';

/**
 * The newest `count` chat messages of a project, kept live. This is the Firestore query toolkit in one place:
 *   orderBy('createdAt', 'desc')  newest first
 *   limit(count)                  only that many are downloaded (and billed), however long the chat is
 *   onSnapshot                    a new message arrives by itself
 * Resolves to { messages, ready }: `ready` is false until the first snapshot.
 */
export function useLatestMessages(projectId, count = 5) {
  const [state, setState] = useState({ projectId: null, messages: [] });
  useEffect(() => {
    if (!projectId || !isFirebaseConfigured) return undefined;
    const q = query(collection(db, 'projects', projectId, 'messages'), orderBy('createdAt', 'desc'), limit(count));
    return onSnapshot(
      q,
      (snapshot) => setState({ projectId, messages: snapshot.docs.map(docToPlain) }),
      (err) => { if (err?.code !== 'permission-denied') console.error(`messages listener error: ${err?.code}: ${err?.message}`); }
    );
  }, [projectId, count]);
  // Messages of a project we have since left are not shown while the next one loads
  const ready = state.projectId === projectId;
  return { messages: ready ? state.messages : [], ready };
}
