import { useId } from 'react';

/**
 * Controlled search input component with derived debouncing indicator.
 * Complies with requirements SR-1 and SR-2.
 */
export function SearchBox({ query, onChange, onClear, isSearching, debouncedQuery }) {
  const searchInputId = useId();

  return (
    <div className="live-search-wrap">
      <div className="live-search-input-box">
        <label htmlFor={searchInputId} className="sr-only">
          Search participants
        </label>
        <span className="live-search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          id={searchInputId}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search participants by name (debounced 300ms)..."
          className="live-search-input"
        />

        {query && (
          <button
            type="button"
            onClick={onClear}
            className="live-search-clear-btn"
            title="Clear search"
          >
            Clear ✕
          </button>
        )}
      </div>

      <div className="live-search-status-row">
        <div aria-live="polite">
          {isSearching ? (
            <span className="live-searching-indicator">
              <span>●</span> Searching... (waiting for 300ms pause)
            </span>
          ) : debouncedQuery ? (
            <span>
              Filtered by: <strong>&quot;{debouncedQuery}&quot;</strong>
            </span>
          ) : (
            <span>Type to search (300ms debounce)</span>
          )}
        </div>
      </div>
    </div>
  );
}
