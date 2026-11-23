import { useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../Avatar';
import { AVATAR_MAX_BYTES, friendlyProfileError, removeAvatar, uploadAvatar, validateAvatarFile } from '../../lib/profiles';

/**
 * AVATAR: the picture is a FILE in Storage (public bucket 'avatars', path <my id>/avatar-<time>.<ext>) and the
 * profile row only remembers the path. Because the bucket is public, getPublicUrl(path) is just a URL string
 * built locally: no request, no signature, anyone with the link can load the image.
 */
export default function AvatarEditor() {
  const { client, user, profile, refreshProfile, recheckSession } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onPick(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // so picking the same file again still fires onChange
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    const { error: uploadError } = await uploadAvatar(client, { userId: user.id, file, oldPath: profile?.avatar_path, stamp: Date.now() });
    if (uploadError) {
      setBusy(false);
      if (uploadError.code === 'PGRST116') recheckSession?.(); // no profile row: is this session still a real user?
      return setError(friendlyProfileError(uploadError) || 'Could not upload the picture.');
    }
    await refreshProfile();
    setBusy(false);
    toast.success('Profile picture updated');
  }

  async function onRemove() {
    setError('');
    setBusy(true);
    const { error: removeError } = await removeAvatar(client, { userId: user.id, path: profile?.avatar_path });
    if (removeError) {
      setBusy(false);
      if (removeError.code === 'PGRST116') recheckSession?.();
      return setError(friendlyProfileError(removeError) || 'Could not remove the picture.');
    }
    await refreshProfile();
    setBusy(false);
    toast.success('Profile picture removed');
  }

  return (
    <section className="profile-avatar" aria-labelledby="profile-avatar-title">
      <h2 id="profile-avatar-title" className="profile-h2">Profile picture</h2>
      <div className="profile-avatar-row">
        <Avatar profile={profile} size={96} />
        <div className="profile-avatar-actions">
          <input ref={inputRef} id="avatar-file" type="file" className="sr-only" tabIndex={-1} aria-hidden="true" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onPick} disabled={busy} aria-label="Choose a profile picture" />
          <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Working…' : 'Choose picture'}</button>
          {profile?.avatar_path && <button type="button" className="btn btn-danger" onClick={onRemove} disabled={busy}>Remove picture</button>}
          <p className="field-hint">PNG, JPEG, WebP or GIF, up to {AVATAR_MAX_BYTES / (1024 * 1024)} MiB.</p>
        </div>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
    </section>
  );
}
