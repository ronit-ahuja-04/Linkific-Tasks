import { useId, useState } from 'react';
import { Pin, SlidersHorizontal, X } from 'lucide-react';
import { DEFAULT_FILTERS, panelFilterChips } from '../../lib/notes';

const SCOPES = [
  ['all', 'All'],
  ['mine', 'Mine'],
  ['team', 'Team'],
  ['private', 'Private'],
];

/**
 * Filtering, in two layers:
 *  - quick chips that apply at once (whose notes, pinned): what people use most
 *  - a "More filters" panel for the rest; its values are drafts until "Apply filters", so typing does not fire
 *    a query per keystroke. Active panel filters show as chips you can remove one by one.
 */
export default function NoteFilters({ filters, tags, onApply, panelOpen, panelId }) {
  const id = useId();
  const [draft, setDraft] = useState(filters);
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }));
  const chips = panelFilterChips(filters, tags);

  return (
    <div className="notes-filters">
      {/* the panel comes first: a disclosure's content follows its button ("More filters", just above) in the tab order */}
      {panelOpen && (
        <form id={panelId} className="notes-panel card" aria-label="More filters" onSubmit={(event) => { event.preventDefault(); onApply({ ...draft, scope: filters.scope, pinnedOnly: filters.pinnedOnly }); }}>
          <div className="notes-panel-fields">
            <div className="field">
              <label htmlFor={`${id}-title`}>Name contains</label>
              <input id={`${id}-title`} className="input" value={draft.title} onChange={set('title')} />
            </div>
            <div className="field">
              <label htmlFor={`${id}-gt`}>Priority above</label>
              <select id={`${id}-gt`} value={draft.priorityAbove} onChange={set('priorityAbove')}>
                <option value="">Any</option>
                {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor={`${id}-lt`}>Priority below</label>
              <select id={`${id}-lt`} value={draft.priorityBelow} onChange={set('priorityBelow')}>
                <option value="">Any</option>
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
                <option value="">Any</option>
                {tags.map((tag) => <option key={tag.id} value={tag.id}>#{tag.name}</option>)}
              </select>
            </div>
          </div>
          <div className="cluster">
            <button type="submit" className="btn btn-primary"><SlidersHorizontal size={16} aria-hidden="true" />Apply filters</button>
            <button type="button" className="btn" onClick={() => { const reset = { ...DEFAULT_FILTERS, scope: filters.scope, pinnedOnly: filters.pinnedOnly }; setDraft(reset); onApply(reset); }}>Reset</button>
          </div>
        </form>
      )}
      <div className="notes-quick" role="group" aria-label="Show">
        {SCOPES.map(([value, label]) => (
          <button key={value} type="button" className="chip" aria-pressed={filters.scope === value} onClick={() => onApply({ ...filters, scope: value })}>
            {label}
          </button>
        ))}
        <span className="notes-quick-divider" aria-hidden="true" />
        <button type="button" className="chip" aria-pressed={filters.pinnedOnly} onClick={() => onApply({ ...filters, pinnedOnly: !filters.pinnedOnly })}>
          <Pin size={14} aria-hidden="true" />Pinned
        </button>
      </div>

      {chips.length > 0 && (
        <ul className="notes-active" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.key} className="chip">
              {chip.label}
              <button type="button" className="chip-remove" aria-label={`Remove filter: ${chip.label}`} onClick={() => onApply({ ...filters, [chip.key]: DEFAULT_FILTERS[chip.key] })}>
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onApply({ ...DEFAULT_FILTERS, scope: filters.scope, pinnedOnly: filters.pinnedOnly })}>Clear these</button>
          </li>
        </ul>
      )}

    </div>
  );
}
