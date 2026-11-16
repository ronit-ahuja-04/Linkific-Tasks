import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  currentUser: { uid: 'u1' },
  updateProfile: vi.fn(),
  getDocFromServer: vi.fn(),
  setDoc: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}));
vi.mock('firebase/auth', () => ({ updateProfile: (...a) => h.updateProfile(...a) }));
vi.mock('firebase/firestore', () => ({
  doc: (_db, ...path) => ({ path: path.join('/') }),
  getDocFromServer: (...a) => h.getDocFromServer(...a),
  setDoc: (...a) => h.setDoc(...a),
}));
vi.mock('../src/lib/firebase.js', () => ({ get auth() { return { currentUser: h.currentUser }; }, db: {} }));
vi.mock('../src/lib/storage.js', () => ({
  avatarPath: (uid, name) => `avatars/${uid}/new-${name}`,
  uploadFile: (...a) => h.uploadFile(...a),
  deleteFile: (...a) => h.deleteFile(...a),
}));

const { setProfilePhoto, removeProfilePhoto, pathFromPhotoUrl } = await import('../src/lib/profilePhoto.js');
const stored = (photoPath) => h.getDocFromServer.mockResolvedValue({ data: () => (photoPath ? { photoPath } : {}) });

beforeEach(() => {
  vi.clearAllMocks();
  h.currentUser = { uid: 'u1' };
  h.uploadFile.mockResolvedValue({ url: 'https://files/new', path: 'avatars/u1/new-me.png' });
  h.deleteFile.mockResolvedValue();
  stored('avatars/u1/old.png');
});

describe('setProfilePhoto', () => {
  it('uploads, then updates Auth and the Firestore profile with the same URL, then deletes the old file', async () => {
    const progress = vi.fn();
    const file = { name: 'me.png' };
    const url = await setProfilePhoto(file, progress);
    expect(url).toBe('https://files/new');
    expect(h.uploadFile).toHaveBeenCalledWith('avatars/u1/new-me.png', file, progress);
    expect(h.updateProfile).toHaveBeenCalledWith(h.currentUser, { photoURL: 'https://files/new' });
    expect(h.setDoc).toHaveBeenCalledWith({ path: 'users/u1' }, { photoURL: 'https://files/new', photoPath: 'avatars/u1/new-me.png' }, { merge: true });
    expect(h.deleteFile).toHaveBeenCalledWith('avatars/u1/old.png');
  });

  it('does not touch the profile or the old file when the upload fails', async () => {
    h.uploadFile.mockRejectedValue({ code: 'storage/unauthorized' });
    await expect(setProfilePhoto({ name: 'me.png' })).rejects.toMatchObject({ code: 'storage/unauthorized' });
    expect(h.updateProfile).not.toHaveBeenCalled();
    expect(h.setDoc).not.toHaveBeenCalled();
    expect(h.deleteFile).not.toHaveBeenCalled();
  });

  it('succeeds even if the old file cannot be deleted', async () => {
    h.deleteFile.mockRejectedValue(new Error('gone wrong'));
    await expect(setProfilePhoto({ name: 'me.png' })).resolves.toBe('https://files/new');
  });

  it('has no old file to delete the first time', async () => {
    stored(null);
    await setProfilePhoto({ name: 'me.png' });
    expect(h.deleteFile).not.toHaveBeenCalled();
  });

  it('still uploads when the old path cannot be read (the old file is just left behind)', async () => {
    h.getDocFromServer.mockRejectedValue({ code: 'unavailable' });
    await expect(setProfilePhoto({ name: 'me.png' })).resolves.toBe('https://files/new');
    expect(h.deleteFile).not.toHaveBeenCalled();
  });

  it('refuses when nobody is signed in', async () => {
    h.currentUser = null;
    await expect(setProfilePhoto({ name: 'me.png' })).rejects.toMatchObject({ code: 'storage/unauthenticated' });
  });
});

describe('removeProfilePhoto: path from the photo URL', () => {
  it('deletes the file named in the Auth photo URL without asking Firestore', async () => {
    h.currentUser = { uid: 'u1', photoURL: 'https://x/v0/b/b/o/avatars%2Fu1%2Fcur.png?alt=media' };
    await removeProfilePhoto();
    expect(h.deleteFile).toHaveBeenCalledWith('avatars/u1/cur.png');
    expect(h.getDocFromServer).not.toHaveBeenCalled();
  });
});

describe('removeProfilePhoto', () => {
  it('deletes the file and clears the photo in Auth and Firestore', async () => {
    await removeProfilePhoto();
    expect(h.deleteFile).toHaveBeenCalledWith('avatars/u1/old.png');
    expect(h.updateProfile).toHaveBeenCalledWith(h.currentUser, { photoURL: '' }); // null is rejected by the Auth backend
    expect(h.setDoc).toHaveBeenCalledWith({ path: 'users/u1' }, { photoURL: null, photoPath: null }, { merge: true });
  });

  it('fails, and changes nothing, when the stored path cannot be read', async () => {
    h.getDocFromServer.mockRejectedValue({ code: 'unavailable' });
    await expect(removeProfilePhoto()).rejects.toMatchObject({ code: 'unavailable' });
    expect(h.deleteFile).not.toHaveBeenCalled();
    expect(h.updateProfile).not.toHaveBeenCalled();
    expect(h.setDoc).not.toHaveBeenCalled();
  });

  it('still clears a photo that has no stored file (a Google photo)', async () => {
    stored(null);
    await removeProfilePhoto();
    expect(h.deleteFile).not.toHaveBeenCalled();
    expect(h.updateProfile).toHaveBeenCalledOnce();
  });
});

describe('pathFromPhotoUrl', () => {
  const url = (path) => `https://firebasestorage.googleapis.com/v0/b/app.appspot.com/o/${encodeURIComponent(path)}?alt=media&token=t`;
  it('reads the storage path out of a download URL', () => {
    expect(pathFromPhotoUrl(url('avatars/u1/ab-me.png'), 'u1')).toBe('avatars/u1/ab-me.png');
    expect(pathFromPhotoUrl('http://127.0.0.1:9299/v0/b/x/o/avatars%2Fu1%2Fa.png?alt=media', 'u1')).toBe('avatars/u1/a.png');
  });
  it('ignores anything that is not this user\'s own avatar file', () => {
    expect(pathFromPhotoUrl(url('avatars/u2/a.png'), 'u1')).toBeNull();
    expect(pathFromPhotoUrl(url('projects/p/tasks/t/a.png'), 'u1')).toBeNull();
    expect(pathFromPhotoUrl('https://lh3.googleusercontent.com/a/photo=s96-c', 'u1')).toBeNull();
    expect(pathFromPhotoUrl(null, 'u1')).toBeNull();
    expect(pathFromPhotoUrl('not a url', 'u1')).toBeNull();
  });
});

describe('toPlainUser', () => {
  it('treats a cleared photo (an empty string) as no photo', async () => {
    const { toPlainUser } = await import('../src/lib/session.js');
    expect(toPlainUser({ uid: 'u1', email: 'a@x.com', photoURL: '' }).photoURL).toBeNull();
    expect(toPlainUser({ uid: 'u1', email: 'a@x.com', photoURL: undefined }).photoURL).toBeNull();
    expect(toPlainUser({ uid: 'u1', email: 'a@x.com', photoURL: 'https://f/x' }).photoURL).toBe('https://f/x');
  });
});
