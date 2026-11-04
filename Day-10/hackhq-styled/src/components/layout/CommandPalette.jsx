import { Fragment, useState, useId, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, Search, ShoppingBag } from 'lucide-react';
import { buildCommands, filterCommands } from '../../lib/commands.js';
import { Backdrop, Dialog, Kbd } from '../ui.jsx';
import { useModalBehavior } from '../ContentModal.jsx';

const COMMANDS = buildCommands();
const Top = styled(Backdrop)`
  align-items: start;
  padding-top: 3rem;
`;
const Panel = styled(Dialog)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
  max-height: calc(100vh - 6rem);
  border-radius: ${({ theme }) => theme.radii.lg};
`;
const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  > svg {
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 1rem 0;
  border: 0;
  background: transparent;
  outline: none;
  color: ${({ theme }) => theme.colors.ink};
  font-size: 1.125rem;
  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const Empty = styled.p`
  margin: 0;
  padding: 3rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Results = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  overflow-y: auto;
  max-height: 20rem;
`;
const GroupLabel = styled.div`
  padding: 0.75rem 1rem 0.25rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.muted};
`;
const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $active }) => ($active ? theme.colors.ink : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.surface : theme.colors.ink)};
  > svg {
    flex-shrink: 0;
    color: ${({ theme, $active }) => ($active ? theme.colors.brand : theme.colors.muted)};
  }
  > svg:last-child {
    color: ${({ theme }) => theme.colors.brand};
  }
`;
const OptionLabel = styled.span`
  flex: 1;
  min-width: 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const Hint = styled.code`
  display: none;
  font-size: 0.875em;
  opacity: 0.75;
  ${({ theme }) => theme.media.up('sm')} {
    display: inline;
  }
`;
const Footer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
`;
const Spacer = styled.span`
  margin-left: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
`;

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

  const panelRef = useRef(null);
  useModalBehavior(panelRef, onClose);

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
    }
  };

  return (
    <Top
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Panel
        ref={panelRef}
        $padded={false}
        $width="50rem"
        aria-label="Jump to a page"
        tabIndex={-1}
      >
        <SearchRow>
          <Search size={18} aria-hidden="true" />
          <SearchInput
            autoFocus
            type="text"
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
        </SearchRow>

        {results.length === 0 ? (
          <Empty>No page or product matches “{query}”.</Empty>
        ) : (
          <Results id={listId} role="listbox" aria-label="Results">
            {results.map((command, index) => {
              const Icon = GROUP_ICONS[command.group];
              const showGroup = index === 0 || results[index - 1].group !== command.group;
              const isActive = index === safeIndex;

              return (
                <Fragment key={command.id}>
                  {showGroup && <GroupLabel aria-hidden="true">{command.group}</GroupLabel>}
                  <Option
                    id={optionId(index)}
                    role="option"
                    aria-selected={isActive}
                    $active={isActive}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => go(command)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <OptionLabel>{command.label}</OptionLabel>
                    <Hint>{command.hint}</Hint>
                    {isActive && <CornerDownLeft size={14} aria-hidden="true" />}
                  </Option>
                </Fragment>
              );
            })}
          </Results>
        )}

        <Footer aria-hidden="true">
          <span>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span>
            <Kbd>↵</Kbd> go
          </span>
          <Spacer>navigate(path)</Spacer>
        </Footer>
      </Panel>
    </Top>
  );
}
