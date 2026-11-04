import { useState, useId } from 'react';
import styled from 'styled-components';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { buildUsersUrl } from '../../lib/api.js';
import { Button, Card, Stack } from '../ui.jsx';
import { UserRow } from './UserRow.jsx';
import { UserRowSkeleton } from './UserRowSkeleton.jsx';
import { ErrorPanel } from './ErrorPanel.jsx';
import { SearchBox } from './SearchBox.jsx';

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
`;
const Sub = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const SlowToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  input {
    accent-color: ${({ theme }) => theme.colors.accent};
    width: 1rem;
    height: 1rem;
    margin: 0;
  }
`;
const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  border: 2px dashed ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: 1rem;
  padding: 1.5rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 3rem;
  }
  .title {
    font-weight: 600;
  }
  .desc {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  button {
    margin-top: 0.5rem;
  }
`;
const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  > button {
    border: 1px solid ${({ theme }) => theme.colors.line};
    border-radius: ${({ theme }) => theme.radii.md};
  }
`;
const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  padding-top: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
`;

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
    <Card as={Stack} $gap={4}>
      <Stack $dir="row" $wrap $align="flex-start" $justify="space-between" $gap={3}>
        <div>
          <Title>Participant Directory</Title>
          <Sub>Registered attendees fetched declaratively via DummyJSON API</Sub>
        </div>

        {/* Simulate Slow Network Control (PD-5) */}
        <SlowToggle htmlFor={slowNetworkCheckboxId}>
          <input
            id={slowNetworkCheckboxId}
            type="checkbox"
            checked={slowNetwork}
            onChange={(e) => setSlowNetwork(e.target.checked)}
          />
          Simulate slow network (+1000ms)
        </SlowToggle>
      </Stack>

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
          <Empty>
            <div className="title">
              {debouncedQuery
                ? `No participants found matching "${debouncedQuery}"`
                : 'No participants found'}
            </div>
            <div className="desc">
              {debouncedQuery
                ? 'Try searching with a different name or clear the search input.'
                : 'Try adjusting your query or click Retry to reload the directory.'}
            </div>
            {debouncedQuery ? (
              <Button $variant="secondary" onClick={() => setQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Button $variant="secondary" onClick={refetch}>
                Reload Participants
              </Button>
            )}
          </Empty>
        ) : (
          <Rows>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUserId === user.id}
                onSelect={onSelectUser}
              />
            ))}
          </Rows>
        )}
      </div>

      {/* Footer Meta */}
      {data && !loading && !error && (
        <Meta>
          <span>
            Showing {users.length} of {data.total || users.length} attendees
          </span>
          <span>Endpoint: /users{debouncedQuery ? '/search' : ''}</span>
        </Meta>
      )}
    </Card>
  );
}
