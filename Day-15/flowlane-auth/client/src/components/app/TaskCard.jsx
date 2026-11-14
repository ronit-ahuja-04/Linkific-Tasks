import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { COLUMNS } from './columns';

// One task. Moving uses a plain <select> (keyboard and screen reader friendly, no drag-and-drop).
export default function TaskCard({ task, onMove, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [error, setError] = useState('');

  function startEdit() {
    setDraft(task.title);
    setError('');
    setEditing(true);
  }

  function submit(event) {
    event.preventDefault();
    const title = draft.trim();
    if (title.length < 1 || title.length > 120) {
      setError('Title must be 1 to 120 characters.');
      return;
    }
    setEditing(false);
    if (title !== task.title) onRename(task, title);
  }

  return (
    <li className="task-card">
      {editing ? (
        <form className="form" onSubmit={submit} noValidate>
          <div className="field">
            <input
              className="input"
              aria-label={`Edit title of ${task.title}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? `edit-err-${task.id}` : undefined}
              autoFocus
            />
            {error && <span className="field-error" id={`edit-err-${task.id}`} role="alert">{error}</span>}
          </div>
          <div className="task-controls">
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
            <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <span className="task-title">{task.title}</span>
          <div className="task-controls">
            <select
              id={`task-move-${task.id}`}
              aria-label={`Move ${task.title} to`}
              value={task.status}
              onChange={(e) => onMove(task, e.target.value)}
            >
              {COLUMNS.map((c) => (
                <option key={c.status} value={c.status}>{c.label}</option>
              ))}
            </select>
            <button type="button" className="icon-btn" aria-label={`Edit ${task.title}`} onClick={startEdit}>
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task)}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </li>
  );
}
