import { Fragment, useState, useId } from 'react';
import { ListGroup, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, Search, ShoppingBag } from 'lucide-react';
import { buildCommands, filterCommands } from '../../lib/commands.js';
import { Kbd } from '../ui.jsx';

const COMMANDS = buildCommands();
const GROUP_ICONS = { Pages: FileText, Products: ShoppingBag };

/**
 * W5: ⌘K command palette. Mounted only while open, so the query and
 * highlight reset for free every time it opens.
 * CONCEPT: Programmatic navigation - navigate(path) from a keyboard event.
 */
export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (index) => `${baseId}-opt-${index}`;

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = filterCommands(COMMANDS, query);
  const safeIndex = Math.min(activeIndex, results.length - 1);

  const go = (command) => {
    onClose();
    navigate(command.path);
  };

  const moveTo = (index) => {
    setActiveIndex(index);
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      moveTo((safeIndex + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      moveTo((safeIndex - 1 + results.length) % results.length);
    } else if (event.key === 'Enter' && results[safeIndex]) {
      event.preventDefault();
      go(results[safeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Modal
      show
      onHide={onClose}
      size="lg"
      autoFocus
      aria-label="Jump to a page"
      dialogClassName="mt-5"
      contentClassName="overflow-hidden rounded-4 shadow"
    >
      <div className="d-flex align-items-center gap-3 border-bottom px-3">
        <Search size={18} aria-hidden="true" className="flex-shrink-0 text-body-secondary" />
        <input
          autoFocus
          type="text"
          className="form-control form-control-lg border-0 shadow-none bg-transparent px-0"
          placeholder="Jump to a page or product…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[safeIndex] ? optionId(safeIndex) : undefined}
          aria-autocomplete="list"
        />
        <Kbd>Esc</Kbd>
      </div>

      {results.length === 0 ? (
        <p className="px-3 py-5 mb-0 text-center small text-body-secondary">
          No page or product matches “{query}”.
        </p>
      ) : (
        <ListGroup
          id={listId}
          variant="flush"
          className="overflow-y-auto p-2 gap-1"
          style={{ maxHeight: '20rem' }}
          role="listbox"
          aria-label="Results"
        >
          {results.map((command, index) => {
            const Icon = GROUP_ICONS[command.group];
            const showGroup = index === 0 || results[index - 1].group !== command.group;
            const isActive = index === safeIndex;

            return (
              <Fragment key={command.id}>
                {showGroup && (
                  <div
                    className="px-3 pt-3 pb-1 font-monospace small text-uppercase ls-wider text-body-secondary"
                    aria-hidden="true"
                  >
                    {command.group}
                  </div>
                )}
                <ListGroup.Item
                  as="div"
                  action
                  id={optionId(index)}
                  role="option"
                  aria-selected={isActive}
                  className="d-flex align-items-center gap-3 rounded-3 border-0"
                  style={
                    isActive
                      ? { backgroundColor: 'var(--ink)', color: 'var(--surface)' }
                      : undefined
                  }
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => go(command)}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                    className={isActive ? 'text-brand' : 'text-body-secondary'}
                  />
                  <span className="flex-grow-1 text-truncate fw-medium">{command.label}</span>
                  <code className="small opacity-75 d-none d-sm-inline">{command.hint}</code>
                  {isActive && (
                    <CornerDownLeft size={14} aria-hidden="true" className="text-brand" />
                  )}
                </ListGroup.Item>
              </Fragment>
            );
          })}
        </ListGroup>
      )}

      <div
        className="d-flex align-items-center gap-3 border-top bg-body-tertiary px-3 py-2 small text-body-secondary"
        aria-hidden="true"
      >
        <span className="d-flex align-items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> move
        </span>
        <span className="d-flex align-items-center gap-1">
          <Kbd>↵</Kbd> go
        </span>
        <span className="ms-auto font-monospace">navigate(path)</span>
      </div>
    </Modal>
  );
}
