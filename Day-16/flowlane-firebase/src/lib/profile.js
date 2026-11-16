import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/** Save the signed-in user's public profile so teammates can find them by email */
export async function saveUserProfile(firebaseUser) {
  try {
    await setDoc(
      doc(db, 'users', firebaseUser.uid),
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.photoURL || null,
        lastSeen: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Firestore error (did you enable it in the console?):', error);
  }
}
