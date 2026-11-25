import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { createRoom, friendlyError } from '../../lib/chat';

/** The "Create a room" form. The Chat page shows it when "New room" is pressed; focus goes straight to the name. */
export default function NewRoomForm({ onCreated, onCancel }) {
  const { client } = useAuth();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef(null);
  const errorId = useId();

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('A room name needs at least 2 characters.');
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    setError('');
    const { data, error: failure } = await createRoom(client, { name, topic, isPrivate });
    setBusy(false);
    if (failure) {
      // 23505 = unique violation: the generated slug of the name already exists
      setError(failure.code === '23505' ? 'A room with that name already exists.' : friendlyError(failure));
      return;
    }
    setName('');
    setTopic('');
    setPrivate(false);
    onCreated(data);
  };

  return (
    <form className="form chat-new-form" onSubmit={submit} noValidate>
      <div className="chat-new-fields">
        <div className="field">
          <label htmlFor="room-name">Room name</label>
          <input id="room-name" ref={nameRef} className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(error) || undefined} aria-describedby={error ? errorId : undefined} />
        </div>
        <div className="field">
          <label htmlFor="room-topic">Topic <span className="field-optional">(optional)</span></label>
          <input id="room-topic" className="input" value={topic} maxLength={160} onChange={(e) => setTopic(e.target.value)} />
        </div>
      </div>
      <label className="checkbox"><input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} /> Private (only invited members see it)</label>
      {error ? <p id={errorId} role="alert" className="field-error">{error}</p> : null}
      <div className="cluster">
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create room'}</button>
        {onCancel ? <button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button> : null}
      </div>
    </form>
  );
}
