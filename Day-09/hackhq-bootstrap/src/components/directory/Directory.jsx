import { useState, useId } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { buildUsersUrl } from '../../lib/api.js';
import { Button, Card } from '../ui.jsx';
import { UserRow } from './UserRow.jsx';
import { UserRowSkeleton } from './UserRowSkeleton.jsx';
import { ErrorPanel } from './ErrorPanel.jsx';
import { SearchBox } from './SearchBox.jsx';

/**
 * Participants Directory component managing live user fetching,
 * 300ms debounced search, slow-network simulation, skeleton states, and error handling.
 */
export function Directory({ selectedUserId, onSelectUser }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const isSearching = query.trim() !== debouncedQuery.trim();

  const [slowNetwork, setSlowNetwork] = useState(false);
  const slowNetworkCheckboxId = useId();

  // Requests search endpoint when query is present, otherwise standard page 1 list
  const requestUrl = buildUsersUrl({
    query: debouncedQuery,
    limit: 10,
    skip: 0,
    delay: slowNetwork ? 1000 : 0,
  });

  const { data, loading, error, refetch } = useFetch(requestUrl);
  const users = data?.users || [];

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Participant Directory</h2>
          <p className="mt-1 text-sm text-muted">
            Registered attendees fetched declaratively via DummyJSON API
          </p>
        </div>

        {/* Simulate Slow Network Control (PD-5) */}
        <label
          htmlFor={slowNetworkCheckboxId}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted select-none hover:text-ink"
        >
          <input
            id={slowNetworkCheckboxId}
            type="checkbox"
            className="size-4 accent-accent"
            checked={slowNetwork}
            onChange={(e) => setSlowNetwork(e.target.checked)}
          />
          <span>Simulate slow network (+1000ms)</span>
        </label>
      </div>

      {/* Debounced Search Box (SR-1, SR-2) */}
      <SearchBox
        query={query}
        onChange={setQuery}
        onClear={() => setQuery('')}
        isSearching={isSearching}
        debouncedQuery={debouncedQuery}
      />

      {/* Directory Content Area */}
      <div>
        {error ? (
          <ErrorPanel message={error} onRetry={refetch} />
        ) : loading ? (
          <UserRowSkeleton count={5} />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 p-8 text-center">
            <div className="font-display text-base font-semibold">
              {debouncedQuery
                ? `No participants found matching "${debouncedQuery}"`
                : 'No participants found'}
            </div>
            <div className="text-sm text-muted">
              {debouncedQuery
                ? 'Try searching with a different name or clear the search input.'
                : 'Try adjusting your query or click Retry to reload the directory.'}
            </div>
            {debouncedQuery ? (
              <Button variant="secondary" onClick={() => setQuery('')} className="mt-3">
                Clear Search
              </Button>
            ) : (
              <Button variant="secondary" onClick={refetch} className="mt-3">
                Reload Participants
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUserId === user.id}
                onSelect={onSelectUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta */}
      {data && !loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 font-mono text-[0.68rem] uppercase tracking-wider text-muted">
          <span>
            Showing {users.length} of {data.total || users.length} attendees
          </span>
          <span>Endpoint: /users{debouncedQuery ? '/search' : ''}</span>
        </div>
      )}
    </Card>
  );
}
