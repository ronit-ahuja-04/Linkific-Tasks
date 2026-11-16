import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/** Write one notification document for a user. Errors are logged, never thrown. */
export async function sendNotification(uid, { message, projectId }) {
  try {
    await setDoc(doc(collection(db, 'users', uid, 'notifications')), {
      message,
      createdAt: serverTimestamp(),
      projectId: projectId ?? null,
      read: false,
    });
  } catch (err) {
    console.error('Failed to notify user', uid, err);
  }
}

/** Notify every member except `excludeUid` */
export async function notifyMembers(members, { message, projectId, excludeUid }) {
  for (const uid of members ?? []) {
    if (uid !== excludeUid) await sendNotification(uid, { message, projectId });
  }
}
