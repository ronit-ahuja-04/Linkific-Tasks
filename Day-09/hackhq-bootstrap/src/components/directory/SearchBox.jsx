import { useId } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { Button, inputClass } from '../ui.jsx';

/**
 * Controlled search input component with derived debouncing indicator.
 * Complies with requirements SR-1 and SR-2.
 */
export function SearchBox({ query, onChange, onClear, isSearching, debouncedQuery }) {
  const searchInputId = useId();

  return (
    <div className="d-flex flex-column gap-2">
      <InputGroup>
        <Form.Label htmlFor={searchInputId} visuallyHidden>
          Search participants
        </Form.Label>
        <InputGroup.Text aria-hidden="true">🔍</InputGroup.Text>
        <Form.Control
          id={searchInputId}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search participants by name (debounced 300ms)..."
          className={inputClass}
        />
        {query && (
          <Button variant="secondary" onClick={onClear} title="Clear search">
            Clear ✕
          </Button>
        )}
      </InputGroup>

      <div className="font-monospace text-uppercase ls-wide text-body-secondary small">
        <div aria-live="polite">
          {isSearching ? (
            <span className="d-inline-flex align-items-center gap-2 text-warning-emphasis">
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
