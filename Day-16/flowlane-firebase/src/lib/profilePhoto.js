import { updateProfile } from 'firebase/auth';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { avatarPath, deleteFile, uploadFile } from './storage';

/**
 * The profile photo lives in three places that must agree:
 *   Cloud Storage       the image file, at avatars/{uid}/...
 *   Firebase Auth       user.photoURL: what this browser (and every future sign-in) sees
 *   Firestore users/{uid}   photoURL and photoPath: what teammates see (avatars, assignees, chat)
 * `photoPath` is kept only so the old file can be deleted when the photo changes.
 */
const profileRef = (uid) => doc(db, 'users', uid);

/**
 * The storage path of the current photo. It is read from the SERVER on purpose: right after a page load the local cache
 * holds only what this browser wrote during sign-in (no photoPath), and a plain getDoc can answer from that
 * half-empty copy, which would leave the old file behind. When the server cannot be reached this throws.
 */
async function storedPath(uid) {
  return (await getDocFromServer(profileRef(uid))).data()?.photoPath ?? null;
}
/** Upload `file` as the signed-in user's photo. Resolves to the new download URL. */
export async function setProfilePhoto(file, onProgress) {
  const current = auth?.currentUser;
  if (!current) throw Object.assign(new Error('Not signed in'), { code: 'storage/unauthenticated' });
  // Not knowing the old file only means it stays behind as an orphan: the new photo must not fail because of it
  const before = await storedPath(current.uid).catch(() => null);
  const uploaded = await uploadFile(avatarPath(current.uid, file.name), file, onProgress);
  await updateProfile(current, { photoURL: uploaded.url });
  await setDoc(profileRef(current.uid), { photoURL: uploaded.url, photoPath: uploaded.path }, { merge: true });
  // The new photo is in place; only now is it safe to remove the old file (a failure here is harmless)
  if (before && before !== uploaded.path) deleteFile(before).catch(() => {});
  return uploaded.url;
}

/** Remove the photo: delete the file and fall back to the generated letter avatar everywhere */
export async function removeProfilePhoto() {
  const current = auth?.currentUser;
  if (!current) throw Object.assign(new Error('Not signed in'), { code: 'storage/unauthenticated' });
  // Strict: if the path cannot be read the removal fails (and can be retried) instead of leaving the file in Storage
  const path = await storedPath(current.uid);
  if (path) await deleteFile(path);
  // An empty string clears it. (`null` is documented to do the same, but the Auth backend rejects it as "photoUrl must be a string".)
  await updateProfile(current, { photoURL: '' });
  await setDoc(profileRef(current.uid), { photoURL: null, photoPath: null }, { merge: true });
}
