import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, Search, ShoppingBag } from 'lucide-react';
import { buildCommands, filterCommands } from '../../lib/commands.js';
import { Kbd, cx } from '../ui.jsx';

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
      className="fixed inset-0 z-[60] flex animate-fade items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl animate-pop overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        role="dialog"
        aria-modal="true"
        aria-label="Jump to a page"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} aria-hidden="true" className="shrink-0 text-muted" />
          <input
            autoFocus
            type="text"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
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
          <p className="px-4 py-10 text-center text-sm text-muted">
            No page or product matches “{query}”.
          </p>
        ) : (
          <ul
            id={listId}
            className="max-h-80 overflow-y-auto p-2"
            role="listbox"
            aria-label="Results"
          >
            {results.map((command, index) => {
              const Icon = GROUP_ICONS[command.group];
              const showGroup = index === 0 || results[index - 1].group !== command.group;
              const isActive = index === safeIndex;

              return (
                <li key={command.id} role="presentation">
                  {showGroup && (
                    <div
                      className="px-3 pt-3 pb-1.5 font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase"
                      aria-hidden="true"
                    >
                      {command.group}
                    </div>
                  )}
                  <div
                    id={optionId(index)}
                    role="option"
                    aria-selected={isActive}
                    className={cx(
                      'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                      isActive ? 'bg-ink text-bg' : 'text-ink'
                    )}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => go(command)}
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className={isActive ? 'text-brand' : 'text-muted'}
                    />
                    <span className="flex-1 truncate font-medium">{command.label}</span>
                    <code className="font-mono text-xs opacity-60">{command.hint}</code>
                    {isActive && (
                      <CornerDownLeft size={14} aria-hidden="true" className="text-brand" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div
          className="flex items-center gap-4 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted"
          aria-hidden="true"
        >
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> go
          </span>
          <span className="ml-auto font-mono">navigate(path)</span>
        </div>
      </div>
    </div>
  );
}
