import { useId, useState } from 'react';
import { flattenTags, parseTagInput } from '../../lib/notes';

/** Create or edit a note. `note` is null for a new one. onSave({ title, body, visibility, pinned, priority, tags }) returns an error message or ''. */
export default function NoteForm({ note, onSave, onCancel }) {
  const id = useId();
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [visibility, setVisibility] = useState(note?.visibility ?? 'private');
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [priority, setPriority] = useState(note?.priority ?? 0);
  const [tagText, setTagText] = useState(note ? flattenTags(note).map((tag) => tag.name).join(', ') : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setError('Give the note a title.');
      return;
    }
    setSaving(true);
    setError('');
    const message = await onSave({ title, body, visibility, pinned, priority, tags: parseTagInput(tagText) });
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <form className="notes-form card form" onSubmit={submit} aria-label={note ? 'Edit note' : 'New note'}>
      <h2 className="notes-form-title">{note ? 'Edit note' : 'New note'}</h2>
      <div className="field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input id={`${id}-title`} className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label htmlFor={`${id}-body`}>Body</label>
        <textarea id={`${id}-body`} rows={4} value={body} maxLength={20000} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="notes-form-row">
        <div className="field">
          <label htmlFor={`${id}-vis`}>Who can read it</label>
          <select id={`${id}-vis`} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="private">Private (only me)</option>
            <option value="team">Team (everyone signed in)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-prio`}>Priority</label>
          <select id={`${id}-prio`} value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <label className="checkbox notes-pinned"><input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pinned</label>
      </div>
      <div className="field">
        <label htmlFor={`${id}-tags`}>Tags</label>
        <input id={`${id}-tags`} className="input" value={tagText} onChange={(e) => setTagText(e.target.value)} aria-describedby={`${id}-tags-hint`} />
        <span id={`${id}-tags-hint`} className="field-hint">Separate with commas, for example: work, ideas</span>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="notes-form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : note ? 'Save changes' : 'Create note'}</button>
        <button type="button" className="btn" disabled={saving} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
