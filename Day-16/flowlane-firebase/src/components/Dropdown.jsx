import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * COMPOUND COMPONENT #2: Dropdown, a menu button.
 *
 *   <Dropdown>
 *     <Dropdown.Trigger aria-label="Language">EN</Dropdown.Trigger>
 *     <Dropdown.Menu aria-label="Choose a language">
 *       <Dropdown.Item checked onSelect={() => setLocale('en')}>English</Dropdown.Item>
 *       <Dropdown.Item onSelect={() => setLocale('es')}>Español</Dropdown.Item>
 *     </Dropdown.Menu>
 *   </Dropdown>
 *
 * Same idea as Tabs: the parts share the open/closed state and ids through a private Context, so
 * they take no props from each other. The parts own the behaviour people expect from a menu:
 * click outside or Escape closes it, focus returns to the button, the arrow keys, Home and End
 * move between items, and ARIA roles tell screen readers it is a menu.
 */
const DropdownContext = createContext(null);

function useDropdownContext(part) {
  const context = useContext(DropdownContext);
  if (context === null) throw new Error(`<${part}> must be rendered inside <Dropdown>.`);
  return context;
}

export function Dropdown({ children, className = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const baseId = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Click outside closes the menu (without stealing focus from what was clicked)
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) close(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, close]);

  const context = useMemo(
    () => ({ open, setOpen, close, triggerRef, triggerId: `${baseId}-trigger`, menuId: `${baseId}-menu` }),
    [open, close, baseId]
  );

  return (
    <DropdownContext.Provider value={context}>
      <div ref={rootRef} className={`dropdown ${className}`.trim()}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function Trigger({ children, className = '', ...props }) {
  const { open, setOpen, triggerRef, triggerId, menuId } = useDropdownContext('Dropdown.Trigger');
  return (
    <button
      ref={triggerRef}
      type="button"
      id={triggerId}
      className={`dropdown-trigger ${className}`.trim()}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function Menu({ children, className = '', ...props }) {
  const { open, close, triggerId, menuId } = useDropdownContext('Dropdown.Menu');
  const menuRef = useRef(null);

  const items = () => [...(menuRef.current?.querySelectorAll('[role^="menuitem"]') ?? [])];

  // When the menu opens, focus the selected item (or the first one)
  useEffect(() => {
    if (!open) return;
    const all = items();
    (all.find((el) => el.getAttribute('aria-checked') === 'true') ?? all[0])?.focus();
  }, [open]);

  if (!open) return null; // a closed menu is not rendered

  const onKeyDown = (event) => {
    const all = items();
    const index = all.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % all.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + all.length) % all.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = all.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    } else if (event.key === 'Tab') {
      close(false); // let focus move on naturally
      return;
    } else return;
    event.preventDefault();
    all[next]?.focus();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      id={menuId}
      // an explicit aria-label wins; otherwise the menu is named by its trigger button
      aria-labelledby={props['aria-label'] ? undefined : triggerId}
      className={`dropdown-menu ${className}`.trim()}
      onKeyDown={onKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}

function Item({ children, onSelect, checked, className = '', ...props }) {
  const { close } = useDropdownContext('Dropdown.Item');
  const isRadio = checked !== undefined;
  return (
    <button
      type="button"
      role={isRadio ? 'menuitemradio' : 'menuitem'}
      aria-checked={isRadio ? checked : undefined}
      tabIndex={-1}
      className={`dropdown-item${checked ? ' selected' : ''} ${className}`.trim()}
      onClick={() => {
        onSelect?.();
        close();
      }}
      {...props}
    >
      {children}
    </button>
  );
}

Dropdown.Trigger = Trigger;
Dropdown.Menu = Menu;
Dropdown.Item = Item;
