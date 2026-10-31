import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, Search, ShoppingBag } from 'lucide-react';
import { buildCommands, filterCommands } from '../../lib/commands.js';

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
    <div
      className="cmdk-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Jump to a page">
        <div className="cmdk-input-row">
          <Search size={18} aria-hidden="true" className="cmdk-search-icon" />
          <input
            autoFocus
            type="text"
            className="cmdk-input"
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
          <kbd className="cmdk-kbd">Esc</kbd>
        </div>

        {results.length === 0 ? (
          <p className="cmdk-empty">No page or product matches “{query}”.</p>
        ) : (
          <ul id={listId} className="cmdk-list" role="listbox" aria-label="Results">
            {results.map((command, index) => {
              const Icon = GROUP_ICONS[command.group];
              const showGroup = index === 0 || results[index - 1].group !== command.group;
              const isActive = index === safeIndex;

              return (
                <li key={command.id} role="presentation">
                  {showGroup && (
                    <div className="cmdk-group" aria-hidden="true">
                      {command.group}
                    </div>
                  )}
                  <div
                    id={optionId(index)}
                    role="option"
                    aria-selected={isActive}
                    className={`cmdk-option ${isActive ? 'active' : ''}`}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => go(command)}
                  >
                    <Icon size={16} aria-hidden="true" className="cmdk-option-icon" />
                    <span className="cmdk-option-label">{command.label}</span>
                    <code className="cmdk-option-hint">{command.hint}</code>
                    {isActive && (
                      <CornerDownLeft size={14} aria-hidden="true" className="cmdk-enter" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="cmdk-footer" aria-hidden="true">
          <span>
            <kbd className="cmdk-kbd">↑</kbd>
            <kbd className="cmdk-kbd">↓</kbd> move
          </span>
          <span>
            <kbd className="cmdk-kbd">↵</kbd> go
          </span>
          <span className="cmdk-footer-concept">navigate(path)</span>
        </div>
      </div>
    </div>
  );
}
