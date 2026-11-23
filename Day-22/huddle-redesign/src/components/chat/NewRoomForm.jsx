import { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { createRoom, friendlyError } from '../../lib/chat';

export default function NewRoomForm({ onCreated }) {
  const { client } = useAuth();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError('A room name needs at least 2 characters.');
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
    <details className="chat-new">
      <summary>New room</summary>
      <form className="form chat-new-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="room-name">Room name</label>
          <input id="room-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(error) || undefined} />
        </div>
        <div className="field">
          <label htmlFor="room-topic">Topic (optional)</label>
          <input id="room-topic" className="input" value={topic} maxLength={160} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <label className="checkbox"><input type="checkbox" checked={isPrivate} onChange={(e) => setPrivate(e.target.checked)} /> Private (only invited members see it)</label>
        {error ? <p role="alert" className="field-error">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating...' : 'Create room'}</button>
      </form>
    </details>
  );
}
