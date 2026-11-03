import { useId } from 'react';
import { inputClass } from '../ui.jsx';

/**
 * Controlled search input component with derived debouncing indicator.
 * Complies with requirements SR-1 and SR-2.
 */
export function SearchBox({ query, onChange, onClear, isSearching, debouncedQuery }) {
  const searchInputId = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <label htmlFor={searchInputId} className="sr-only">
          Search participants
        </label>
        <span
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm"
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          id={searchInputId}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search participants by name (debounced 300ms)..."
          className={inputClass + ' pr-24 pl-10'}
        />

        {query && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-ink"
            title="Clear search"
          >
            Clear ✕
          </button>
        )}
      </div>

      <div className="font-mono text-[0.68rem] uppercase tracking-wider text-muted">
        <div aria-live="polite">
          {isSearching ? (
            <span className="inline-flex items-center gap-1.5 text-warn">
              <span className="animate-ping-slow">●</span> Searching... (waiting for 300ms pause)
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
