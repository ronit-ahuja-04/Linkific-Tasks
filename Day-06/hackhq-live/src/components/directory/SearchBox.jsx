import { useId } from 'react';

/**
 * Controlled search input component with derived debouncing indicator.
 * Complies with requirements SR-1 and SR-2 (includes aria-live for the Searching hint).
 *
 * @param {{
 *   query: string,
 *   onChange: (val: string) => void,
 *   onClear: () => void,
 *   isSearching: boolean,
 *   debouncedQuery: string
 * }} props
 */
export function SearchBox({ query, onChange, onClear, isSearching, debouncedQuery }) {
  const searchInputId = useId();

  return (
    <div className="space-y-2">
      <div className="relative flex items-center">
        <label htmlFor={searchInputId} className="sr-only">
          Search participants
        </label>
        <span
          className="absolute left-3.5 text-slate-400 pointer-events-none text-sm"
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
          className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60 transition-colors"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 px-2 py-0.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear search"
          >
            Clear ✕
          </button>
        )}
      </div>

      {/* Derived Searching Indicator and Query Status (SR-2) */}
      <div className="flex items-center justify-between text-xs px-1 min-h-[18px]">
        <div aria-live="polite" className="font-mono">
          {isSearching ? (
            <span className="text-cyan-400 animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Searching... (waiting for 300ms pause)
            </span>
          ) : debouncedQuery ? (
            <span className="text-slate-400">
              Filtered by: <span className="text-slate-200">&quot;{debouncedQuery}&quot;</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
