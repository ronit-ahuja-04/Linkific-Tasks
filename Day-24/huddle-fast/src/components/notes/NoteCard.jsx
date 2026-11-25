import { Lock, Pencil, Pin, Trash2, Users } from 'lucide-react';
import { flattenTags } from '../../lib/notes';
import Avatar from '../Avatar';
import RelativeTime from '../ui/RelativeTime';

/** "You", the owner's full name, or their @username */
const ownerName = (owner, isMine) => (isMine ? 'You' : owner?.full_name?.trim() || `@${owner?.username ?? 'unknown'}`);

/**
 * One note. Title first (it is what you scan for), then the body, tags, and a footer with who and when.
 * Priority only shows when it means something (above 0): "Priority 0" on every card was noise.
 * Only the owner sees Edit / Delete (RLS would refuse anybody else anyway).
 */
export default function NoteCard({ note, isMine, confirmingDelete, busy, onEdit, onAskDelete, onCancelDelete, onDelete }) {
  const tags = flattenTags(note);
  const owner = note.owner ?? {};
  const team = note.visibility === 'team';
  return (
    <li className="notes-card card" data-testid="note-card">
      <div className="notes-card-head">
        <h3 className="notes-card-title">
          {note.pinned && <Pin size={14} className="notes-pin" aria-hidden="true" />}
          {note.pinned && <span className="sr-only">Pinned: </span>}
          {note.title}
        </h3>
        <span className={`badge ${team ? 'badge-primary' : ''}`}>
          {team ? <Users size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
          {team ? 'Team' : 'Private'}
        </span>
      </div>
      {note.body && <p className="notes-card-body">{note.body}</p>}
      {tags.length > 0 && (
        <ul className="notes-tags" aria-label="Note labels">
          {tags.map((tag) => <li key={tag.id} className="notes-tag">#{tag.name}</li>)}
        </ul>
      )}
      <div className="notes-card-foot">
        <span className="notes-owner">
          <Avatar profile={owner} size={24} />
          <span className="notes-owner-name">{ownerName(owner, isMine)}</span>
          <span aria-hidden="true">·</span>
          <RelativeTime date={note.updated_at} />
        </span>
        {note.priority > 0 && <span className="badge">Priority {note.priority}</span>}
      </div>
      {isMine && (
        <div className="notes-actions">
          {confirmingDelete ? (
            <>
              <span role="alert" className="notes-confirm">Delete this note?</span>
              <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={() => onDelete(note)}>Yes, delete</button>
              <button type="button" className="btn btn-sm" disabled={busy} onClick={onCancelDelete}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onEdit(note)} aria-label={`Edit ${note.title}`}><Pencil size={14} aria-hidden="true" />Edit</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onAskDelete(note)} aria-label={`Delete ${note.title}`}><Trash2 size={14} aria-hidden="true" />Delete</button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
