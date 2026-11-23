import { Pin } from 'lucide-react';
import { flattenTags } from '../../lib/notes';
import Avatar from '../Avatar';

/** One note: owner, visibility badge, tags. Only the owner sees Edit / Delete (RLS would refuse anybody else anyway). */
export default function NoteCard({ note, isMine, confirmingDelete, busy, onEdit, onAskDelete, onCancelDelete, onDelete }) {
  const tags = flattenTags(note);
  const owner = note.owner ?? {};
  return (
    <li className="notes-card card" data-testid="note-card">
      <div className="notes-card-head">
        <h3 className="notes-card-title">
          {note.pinned && <Pin size={14} aria-label="Pinned" className="notes-pin" />}
          {note.title}
        </h3>
        <span className={`badge notes-vis notes-vis-${note.visibility}`}>{note.visibility === 'team' ? 'Team' : 'Private'}</span>
      </div>
      {note.body && <p className="notes-card-body">{note.body}</p>}
      {tags.length > 0 && (
        <ul className="notes-tags" aria-label="Note labels">
          {tags.map((tag) => <li key={tag.id} className="badge">#{tag.name}</li>)}
        </ul>
      )}
      <div className="notes-card-foot">
        <span className="notes-owner">
          <Avatar profile={owner} size={22} />
          <span>{isMine ? 'You' : `@${owner.username ?? 'unknown'}`}</span>
        </span>
        <span className="muted notes-meta">Priority {note.priority} · {new Date(note.updated_at).toLocaleDateString()}</span>
      </div>
      {isMine && (
        <div className="notes-actions">
          {confirmingDelete ? (
            <>
              <span role="alert">Delete this note?</span>
              <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={() => onDelete(note)}>Yes, delete</button>
              <button type="button" className="btn btn-sm" disabled={busy} onClick={onCancelDelete}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-sm" disabled={busy} onClick={() => onEdit(note)} aria-label={`Edit ${note.title}`}>Edit</button>
              <button type="button" className="btn btn-sm" disabled={busy} onClick={() => onAskDelete(note)} aria-label={`Delete ${note.title}`}>Delete</button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
