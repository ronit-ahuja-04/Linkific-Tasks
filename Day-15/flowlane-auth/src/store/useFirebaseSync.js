import { useEffect } from 'react';
import { useStore } from 'react-redux';
import { isFirebaseConfigured } from '../lib/firebase';
import { startProjectListener, startUserListeners } from './listeners';

/** Start the signed-in user's Firestore listeners; they stop when the user changes or leaves */
export function useUserSync(user) {
  const store = useStore();
  const uid = user?.uid;
  const email = user?.email;
  useEffect(() => {
    if (!uid || !isFirebaseConfigured) return undefined;
    return startUserListeners(store, { uid, email });
  }, [store, uid, email]);
}

/** Start the listeners for the open project; they restart when another project is opened */
export function useProjectSync(projectId, uid) {
  const store = useStore();
  useEffect(() => {
    if (!projectId || !uid || !isFirebaseConfigured) return undefined;
    return startProjectListener(store, projectId, uid);
  }, [store, projectId, uid]);
}
