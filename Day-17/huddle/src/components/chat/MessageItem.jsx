import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Avatar from '../Avatar';
import Attachment from './Attachment';
import { MAX_BODY, splitMentions } from '../../lib/chat';

function Body({ text }) {
  // text only: a message is data from other users, so it is never put into the page as HTML
  return (
    <p className="chat-body">
      {splitMentions(text).map((part, i) => (part.mention ? <mark key={i} className="chat-mention">{part.text}</mark> : <span key={i}>{part.text}</span>))}
    </p>
  );
}

export default function MessageItem({ message, mine, onEdit, onDelete }) {
  const [mode, setMode] = useState('view'); // view | edit | confirm
  const [draft, setDraft] = useState(message.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editRef = useRef(null);
  const name = message.author?.username ?? 'someone';
  const time = new Date(message.created_at);

  useEffect(() => {
    if (mode === 'edit') editRef.current?.focus();
  }, [mode]);

  const save = async (event) => {
    event.preventDefault();
    if (!draft.trim() || draft.trim() === message.body) return setMode('view');
    setBusy(true);
    setError('');
    const failure = await onEdit(message.id, draft);
    setBusy(false);
    if (failure) setError(failure);
    else setMode('view');
  };

  const remove = async () => {
    setBusy(true);
    const failure = await onDelete(message.id);
    if (failure) {
      setBusy(false);
      setError(failure);
    }
  };

  return (
    <li className="chat-message" data-mine={mine || undefined}>
      <Avatar profile={message.author} size={32} />
      <div className="chat-message-main">
        <div className="chat-message-head">
          <strong>{message.author?.full_name || name}</strong>
          <span className="muted">@{name}</span>
          <time className="muted" dateTime={message.created_at}>{time.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</time>
          {message.edited_at ? <span className="badge">edited</span> : null}
        </div>
        {mode === 'edit' ? (
          <form className="chat-edit" onSubmit={save}>
            <label className="sr-only" htmlFor={`edit-${message.id}`}>Edit message</label>
            <textarea id={`edit-${message.id}`} ref={editRef} rows={2} maxLength={MAX_BODY} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setMode('view'); }} />
            <div className="chat-row">
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !draft.trim()}>{busy ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-sm" onClick={() => { setMode('view'); setDraft(message.body); setError(''); }} disabled={busy}>Cancel</button>
            </div>
          </form>
        ) : (
          <Body text={message.body} />
        )}
        {message.attachment ? <Attachment file={message.attachment} /> : null}
        {error ? <p role="alert" className="field-error">{error}</p> : null}
        {mine && mode === 'view' ? (
          <div className="chat-actions">
            <button type="button" className="icon-btn chat-icon" aria-label={`Edit your message from ${time.toLocaleTimeString()}`} onClick={() => { setDraft(message.body); setMode('edit'); }}>
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn chat-icon" aria-label={`Delete your message from ${time.toLocaleTimeString()}`} onClick={() => setMode('confirm')}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {mode === 'confirm' ? (
          <div className="chat-row" role="group" aria-label="Confirm delete">
            <span>Delete this message?</span>
            <button type="button" className="btn btn-danger btn-sm" onClick={remove} disabled={busy}>{busy ? 'Deleting...' : 'Yes, delete'}</button>
            <button type="button" className="btn btn-sm" onClick={() => setMode('view')} disabled={busy}>Keep</button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
