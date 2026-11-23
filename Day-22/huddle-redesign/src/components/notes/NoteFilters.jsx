import { useId, useState } from 'react';
import { DEFAULT_FILTERS } from '../../lib/notes';

/** The filter form. The values are drafts until "Apply" so typing does not fire a query per keystroke. */
export default function NoteFilters({ filters, tags, onApply }) {
  const id = useId();
  const [draft, setDraft] = useState(filters);
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  return (
    <form
      className="notes-filters card"
      aria-label="Filter notes"
      onSubmit={(event) => { event.preventDefault(); onApply(draft); }}
    >
      <div className="field">
        <label htmlFor={`${id}-scope`}>Show</label>
        <select id={`${id}-scope`} value={draft.scope} onChange={set('scope')}>
          <option value="all">All I can see</option>
          <option value="mine">Only mine (owner_id = me)</option>
          <option value="team">Team notes (visibility = team)</option>
          <option value="private">Private notes (visibility = private)</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-title`}>Name contains</label>
        <input id={`${id}-title`} className="input" value={draft.title} onChange={set('title')} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-gt`}>Priority above</label>
        <select id={`${id}-gt`} value={draft.priorityAbove} onChange={set('priorityAbove')}>
          <option value="">any</option>
          {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-lt`}>Priority below</label>
        <select id={`${id}-lt`} value={draft.priorityBelow} onChange={set('priorityBelow')}>
          <option value="">any</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-since`}>Created since</label>
        <input id={`${id}-since`} type="date" className="input" value={draft.since} onChange={set('since')} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-tag`}>Only with tag</label>
        <select id={`${id}-tag`} value={draft.tagId} onChange={set('tagId')}>
          <option value="">any</option>
          {tags.map((tag) => <option key={tag.id} value={tag.id}>#{tag.name}</option>)}
        </select>
      </div>
      <label className="checkbox notes-filter-pinned"><input type="checkbox" checked={draft.pinnedOnly} onChange={set('pinnedOnly')} /> Pinned only</label>
      <div className="notes-filter-actions">
        <button type="submit" className="btn btn-primary">Apply filters</button>
        <button type="button" className="btn" onClick={() => { setDraft(DEFAULT_FILTERS); onApply(DEFAULT_FILTERS); }}>Reset</button>
      </div>
    </form>
  );
}
