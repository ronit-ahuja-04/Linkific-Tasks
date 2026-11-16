import { useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { removeProfilePhoto, setProfilePhoto } from '../lib/profilePhoto';
import { MAX_AVATAR_BYTES, formatBytes, storageErrorKey, validateImage, validationErrorKey } from '../lib/storage';
import '../styles/storage.css';

/**
 * Profile photo: pick an image, watch the upload, see the new photo at once. The file goes to Cloud
 * Storage, its download URL to the Firebase Auth profile and to the Firestore user document (see
 * lib/profilePhoto.js), so teammates see it live too. A failed upload changes nothing.
 */
export default function AvatarUploader() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const input = useRef(null);
  // idle | uploading | removing
  const [phase, setPhase] = useState('idle');
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');

  const busy = phase !== 'idle';
  const max = formatBytes(MAX_AVATAR_BYTES);

  const fail = (key) => {
    // The inline message is announced once (role="alert"); a toast as well would be read out twice
    setError(t(key, { max }));
  };

  async function onPick(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // picking the same file again must fire a change again
    if (!file) return;
    setError('');
    const problem = validateImage(file, MAX_AVATAR_BYTES);
    if (problem) return fail(validationErrorKey(problem));
    setPhase('uploading');
    setPercent(0);
    try {
      await setProfilePhoto(file, setPercent);
      await refreshUser();
      toast.success(t('storage.avatar.done'));
    } catch (err) {
      fail(storageErrorKey(err));
    } finally {
      setPhase('idle');
    }
  }

  async function onRemove() {
    setError('');
    setPhase('removing');
    try {
      await removeProfilePhoto();
      await refreshUser();
      toast.success(t('storage.avatar.removed'));
    } catch (err) {
      fail(storageErrorKey(err));
    } finally {
      setPhase('idle');
    }
  }

  const status =
    phase === 'uploading' ? t('storage.avatar.uploading', { percent }) : phase === 'removing' ? t('storage.avatar.removing') : '';

  return (
    <div className="avatar-uploader">
      <div className="avatar-uploader-frame" data-busy={busy} data-testid="avatar-frame">
        {user?.photoURL ? (
          <img src={user.photoURL} alt={t('storage.avatar.alt')} referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true">{user?.email?.[0]?.toUpperCase()}</span>
        )}
      </div>

      <div className="avatar-uploader-actions">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="visually-hidden"
          aria-label={t('storage.avatar.input')}
          tabIndex={-1}
          onChange={onPick}
          disabled={busy}
        />
        <button type="button" className="upload-btn" onClick={() => input.current?.click()} disabled={busy}>
          <Camera size={16} aria-hidden="true" /> {user?.photoURL ? t('storage.avatar.change') : t('storage.avatar.upload')}
        </button>
        {user?.photoURL && (
          <button type="button" className="upload-btn secondary" onClick={onRemove} disabled={busy}>
            <Trash2 size={16} aria-hidden="true" /> {t('storage.avatar.remove')}
          </button>
        )}
      </div>

      {phase === 'uploading' && (
        <div className="upload-progress" role="progressbar" aria-label={t('storage.progress.label')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div style={{ width: `${percent}%` }} />
        </div>
      )}
      <p className="upload-status" role="status">{status}</p>
      <p className="upload-hint">{t('storage.avatar.hint', { max })}</p>
      {error && <p className="upload-error" role="alert">{error}</p>}
    </div>
  );
}
