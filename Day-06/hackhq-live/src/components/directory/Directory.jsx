import { useState, useId } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { buildUsersUrl } from '../../lib/api.js';
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
    <div className="live-card">
      <div className="live-card-header">
        <div className="live-card-title-group">
          <h2>Participant Directory</h2>
          <p className="live-card-subtitle">
            Registered attendees fetched declaratively via DummyJSON API
          </p>
        </div>

        {/* Simulate Slow Network Control (PD-5) */}
        <label htmlFor={slowNetworkCheckboxId} className="slow-network-label">
          <input
            id={slowNetworkCheckboxId}
            type="checkbox"
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
          <div className="live-empty-box">
            <div className="live-empty-title">
              {debouncedQuery
                ? `No participants found matching "${debouncedQuery}"`
                : 'No participants found'}
            </div>
            <div className="live-empty-desc">
              {debouncedQuery
                ? 'Try searching with a different name or clear the search input.'
                : 'Try adjusting your query or click Retry to reload the directory.'}
            </div>
            {debouncedQuery ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="btn btn-secondary"
                style={{ marginTop: '12px' }}
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={refetch}
                className="btn btn-secondary"
                style={{ marginTop: '12px' }}
              >
                Reload Participants
              </button>
            )}
          </div>
        ) : (
          <div className="live-user-list">
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
        <div
          className="live-search-status-row"
          style={{ paddingTop: '8px', borderTop: '1px solid var(--color-rule)' }}
        >
          <span>
            Showing {users.length} of {data.total || users.length} attendees
          </span>
          <span>Endpoint: /users{debouncedQuery ? '/search' : ''}</span>
        </div>
      )}
    </div>
  );
}
