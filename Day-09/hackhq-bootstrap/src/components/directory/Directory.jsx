import { useState, useId } from 'react';
import { Form, ListGroup } from 'react-bootstrap';
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
    <Card className="d-flex flex-column gap-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <h2 className="fs-4 fw-bold mb-1">Participant Directory</h2>
          <p className="mb-0 small text-body-secondary">
            Registered attendees fetched declaratively via DummyJSON API
          </p>
        </div>

        {/* Simulate Slow Network Control (PD-5) */}
        <Form.Check
          id={slowNetworkCheckboxId}
          type="checkbox"
          className="border rounded-3 bg-body-tertiary px-3 py-2 ps-5 small text-body-secondary user-select-none mb-0"
          label="Simulate slow network (+1000ms)"
          checked={slowNetwork}
          onChange={(e) => setSlowNetwork(e.target.checked)}
        />
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
          <div className="d-flex flex-column align-items-center gap-2 rounded-4 border border-dashed bg-body-tertiary p-4 p-sm-5 text-center">
            <div className="fw-semibold">
              {debouncedQuery
                ? `No participants found matching "${debouncedQuery}"`
                : 'No participants found'}
            </div>
            <div className="small text-body-secondary">
              {debouncedQuery
                ? 'Try searching with a different name or clear the search input.'
                : 'Try adjusting your query or click Retry to reload the directory.'}
            </div>
            {debouncedQuery ? (
              <Button variant="secondary" onClick={() => setQuery('')} className="mt-2">
                Clear Search
              </Button>
            ) : (
              <Button variant="secondary" onClick={refetch} className="mt-2">
                Reload Participants
              </Button>
            )}
          </div>
        ) : (
          <ListGroup className="gap-2">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUserId === user.id}
                onSelect={onSelectUser}
              />
            ))}
          </ListGroup>
        )}
      </div>

      {/* Footer Meta */}
      {data && !loading && !error && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-top pt-3 font-monospace small text-uppercase ls-wide text-body-secondary">
          <span>
            Showing {users.length} of {data.total || users.length} attendees
          </span>
          <span>Endpoint: /users{debouncedQuery ? '/search' : ''}</span>
        </div>
      )}
    </Card>
  );
}
