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
 * The storage path inside a download URL: .../o/avatars%2Fuid%2Ffile.png?alt=media&token=... -> avatars/uid/file.png.
 * Only a file in this user's own avatar folder counts, so a photo URL from elsewhere (a Google account's) gives null.
 */
export function pathFromPhotoUrl(url, uid) {
  try {
    const encoded = new URL(url).pathname.match(/\/o\/([^/]+)$/)?.[1];
    const path = encoded ? decodeURIComponent(encoded) : null;
    return path?.startsWith(`avatars/${uid}/`) ? path : null;
  } catch {
    return null;
  }
}

/**
 * The storage path of the current photo. The URL on the Auth profile already holds it, which needs no network and
 * cannot be stale. The Firestore copy (`photoPath`) is only a fallback, read from the SERVER because right after a page
 * load the local cache holds just what this browser wrote during sign-in. A failed read throws.
 */
async function storedPath(current) {
  const fromUrl = pathFromPhotoUrl(current.photoURL, current.uid);
  if (fromUrl) return fromUrl;
  return (await getDocFromServer(profileRef(current.uid))).data()?.photoPath ?? null;
}

/** Upload `file` as the signed-in user's photo. Resolves to the new download URL. */
export async function setProfilePhoto(file, onProgress) {
  const current = auth?.currentUser;
  if (!current) throw Object.assign(new Error('Not signed in'), { code: 'storage/unauthenticated' });
  // Not knowing the old file only means it stays behind as an orphan: the new photo must not fail because of it
  const before = await storedPath(current).catch(() => null);
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
  const path = await storedPath(current);
  if (path) await deleteFile(path);
  // An empty string clears it. (`null` is documented to do the same, but the Auth backend rejects it as "photoUrl must be a string".)
  await updateProfile(current, { photoURL: '' });
  await setDoc(profileRef(current.uid), { photoURL: null, photoPath: null }, { merge: true });
}
