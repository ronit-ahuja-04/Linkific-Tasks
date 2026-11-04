import { useId } from 'react';
import styled, { css } from 'styled-components';
import { Button, Input } from '../ui.jsx';

const hidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const Group = styled.div`
  display: flex;
  align-items: stretch;
  position: relative;
  > * {
    border-radius: 0;
  }
  > :nth-child(2) {
    border-top-left-radius: ${({ theme }) => theme.radii.md};
    border-bottom-left-radius: ${({ theme }) => theme.radii.md};
  }
  > :last-child {
    border-top-right-radius: ${({ theme }) => theme.radii.md};
    border-bottom-right-radius: ${({ theme }) => theme.radii.md};
  }
  > input {
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;
  }
  > input:focus {
    z-index: 1;
  }
`;
const HiddenLabel = styled.label`
  ${hidden}
`;
const Addon = styled.span`
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-right: 0;
`;
const ClearBtn = styled(Button)`
  margin-left: -1px;
`;
const Status = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.875rem;
`;
const Searching = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.warn};
`;

/**
 * Controlled search input component with derived debouncing indicator.
 * Complies with requirements SR-1 and SR-2.
 */
export function SearchBox({ query, onChange, onClear, isSearching, debouncedQuery }) {
  const searchInputId = useId();

  return (
    <Wrap>
      <Group>
        <HiddenLabel htmlFor={searchInputId}>Search participants</HiddenLabel>
        <Addon aria-hidden="true">🔍</Addon>
        <Input
          id={searchInputId}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search participants by name (debounced 300ms)..."
        />
        {query && (
          <ClearBtn $variant="secondary" onClick={onClear} title="Clear search">
            Clear ✕
          </ClearBtn>
        )}
      </Group>

      <Status>
        <div aria-live="polite">
          {isSearching ? (
            <Searching>
              <span>●</span> Searching... (waiting for 300ms pause)
            </Searching>
          ) : debouncedQuery ? (
            <span>
              Filtered by: <strong>&quot;{debouncedQuery}&quot;</strong>
            </span>
          ) : (
            <span>Type to search (300ms debounce)</span>
          )}
        </div>
      </Status>
    </Wrap>
  );
}
