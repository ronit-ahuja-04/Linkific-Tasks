import Snippet from './Snippet';

/** Results of rpc('search_notes'): title, highlighted snippet, rank (how well it matched) and visibility */
export default function SearchResults({ results, userId, onEdit }) {
  return (
    <ul className="notes-results">
      {results.map((row) => (
        <li key={row.id} className="card notes-result" data-testid="search-result">
          <div className="notes-card-head">
            <h3 className="notes-card-title">{row.title}</h3>
            <span className="badge">{row.visibility === 'team' ? 'Team' : 'Private'}</span>
          </div>
          <p className="notes-result-snippet"><Snippet text={row.snippet} /></p>
          <div className="notes-card-foot">
            <span className="muted notes-meta">Rank {Number(row.rank).toFixed(3)} · {row.owner_id === userId ? 'yours' : 'a teammate'}</span>
            {row.owner_id === userId && (
              <button type="button" className="btn btn-sm" onClick={() => onEdit(row.id)} aria-label={`Edit ${row.title}`}>Edit</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
