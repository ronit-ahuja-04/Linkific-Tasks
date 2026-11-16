import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImagePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { deleteFile } from '../lib/storage';
import { makeAttachment, safeImageUrl } from '../lib/attachments';
import {
  MAX_ATTACHMENTS_PER_TASK, MAX_ATTACHMENT_BYTES, attachmentPath, formatBytes, storageErrorKey, uploadFile, validateImage, validationErrorKey,
} from '../lib/storage';
import { addAttachment, removeAttachment } from '../store/slices/boardSlice';
import '../styles/storage.css';

const NONE = [];

/**
 * The images of one task. The list is read from the board in the Redux store, which a Firestore listener keeps
 * live, so an image a teammate adds or removes appears here without a refresh. Only the project owner can change
 * the list (the same people who can edit the task, and what storage.rules allows).
 */
export default function TaskAttachments({ task, projectId, canEdit }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const input = useRef(null);
  const attachments = useSelector((state) => state.board.tasks[task.id]?.attachments) ?? NONE;
  // Uploads in flight: { key, name, percent }
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState('');

  const max = formatBytes(MAX_ATTACHMENT_BYTES);
  const full = attachments.length + uploads.length >= MAX_ATTACHMENTS_PER_TASK;

  const progress = (key, percent) => setUploads((list) => list.map((u) => (u.key === key ? { ...u, percent } : u)));

  async function uploadOne(file, key) {
    let uploaded = null;
    try {
      uploaded = await uploadFile(attachmentPath(projectId, task.id, file.name), file, (p) => progress(key, p));
      await dispatch(addAttachment({ taskId: task.id, attachment: makeAttachment(uploaded, user?.uid) })).unwrap();
      toast.success(t('storage.attach.added'));
    } catch (err) {
      // The file is in Storage but the task entry was not saved: do not leave the file behind
      if (uploaded) deleteFile(uploaded.path).catch(() => {});
      setError(t(storageErrorKey(err), { max }));
    } finally {
      setUploads((list) => list.filter((u) => u.key !== key));
    }
  }

  async function onPick(event) {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    setError('');
    const room = MAX_ATTACHMENTS_PER_TASK - attachments.length - uploads.length;
    if (files.length > room) setError(t('storage.attach.full', { count: MAX_ATTACHMENTS_PER_TASK }));
    const accepted = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      const problem = validateImage(file, MAX_ATTACHMENT_BYTES);
      if (problem) setError(t(validationErrorKey(problem), { max }));
      else accepted.push({ file, key: `${Date.now()}-${accepted.length}-${file.name}` });
    }
    setUploads((list) => [...list, ...accepted.map(({ file, key }) => ({ key, name: file.name, percent: 0 }))]);
    await Promise.all(accepted.map(({ file, key }) => uploadOne(file, key)));
  }

  async function onRemove(attachment) {
    setError('');
    try {
      await dispatch(removeAttachment({ taskId: task.id, attachment })).unwrap();
      toast.success(t('storage.attach.removed'));
    } catch (err) {
      setError(t(storageErrorKey(err)));
    }
  }

  return (
    <section className="task-section" aria-labelledby={`attach-${task.id}`} style={{ marginTop: 24 }}>
      <h4 id={`attach-${task.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        <ImagePlus size={16} aria-hidden="true" /> {t('storage.attach.title')}
        {attachments.length > 0 && <span style={{ fontWeight: 400 }}>({attachments.length})</span>}
      </h4>

      {task._isDraft ? (
        <p className="upload-hint" style={{ textAlign: 'left' }}>{t('storage.attach.draft')}</p>
      ) : (
        <>
          {attachments.length === 0 && uploads.length === 0 && <p className="upload-hint" style={{ textAlign: 'left' }}>{t('storage.attach.empty')}</p>}

          <ul className="attachments-grid" aria-label={t('storage.attach.title')}>
            {attachments.map((a) => {
              const url = safeImageUrl(a.url);
              return (
                <li key={a.id} className="attachment" data-testid="attachment">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t('storage.attach.open', { name: a.name })}>
                      <img src={url} alt={t('storage.attach.alt', { name: a.name })} loading="lazy" />
                    </a>
                  ) : null}
                  <div className="attachment-meta">
                    <span className="attachment-name" title={a.name}>{a.name}</span>
                    <span className="attachment-size">{formatBytes(a.size)}</span>
                  </div>
                  {canEdit && (
                    <button type="button" className="attachment-remove" onClick={() => onRemove(a)} aria-label={t('storage.attach.remove', { name: a.name })}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
            {uploads.map((u) => (
              <li key={u.key} className="attachment attachment-uploading">
                <span role="status">{t('storage.attach.uploading', { name: u.name, percent: u.percent })}</span>
                <div className="upload-progress" role="progressbar" aria-label={t('storage.progress.label')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.percent}>
                  <div style={{ width: `${u.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>

          {canEdit && (
            <>
              <input
                ref={input}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="visually-hidden"
                aria-label={t('storage.attach.input')}
                tabIndex={-1}
                onChange={onPick}
              />
              <button type="button" className="upload-btn secondary" onClick={() => input.current?.click()} disabled={full}>
                <ImagePlus size={16} aria-hidden="true" /> {t('storage.attach.add')}
              </button>
              <p className="upload-hint" style={{ textAlign: 'left', marginTop: 8 }}>
                {t('storage.attach.hint', { max, count: MAX_ATTACHMENTS_PER_TASK })}
              </p>
            </>
          )}
          {error && <p className="upload-error" role="alert" style={{ textAlign: 'left' }}>{error}</p>}
        </>
      )}
    </section>
  );
}
