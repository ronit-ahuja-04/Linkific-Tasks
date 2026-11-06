import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * COMPOUND COMPONENTS: Tabs is a family of components that only make sense together.
 *
 *   <Tabs value={tab} onChange={setTab}>
 *     <Tabs.List aria-label="Project views">
 *       <Tabs.Tab value="board">Board</Tabs.Tab>
 *       <Tabs.Tab value="activity">Activity</Tabs.Tab>
 *     </Tabs.List>
 *     <Tabs.Panel value="board">...</Tabs.Panel>
 *     <Tabs.Panel value="activity">...</Tabs.Panel>
 *   </Tabs>
 *
 * The parts do not receive props from each other. They share state through a Context that only
 * this file knows about, which is what makes the API flexible: you can put anything between the
 * parts (the project header sits between the list and the panels in FlowLane), reorder them, or
 * leave one out. A fixed `<Tabs items={[...]} />` prop API could not do that.
 *
 * It works controlled (pass `value` and `onChange`, as FlowLane does so Redux can read the open
 * tab) or uncontrolled (pass `defaultValue`, as the Settings page does).
 *
 * Accessibility: WAI-ARIA tabs pattern. role tablist, tab and tabpanel, aria-selected, aria-controls,
 * and keyboard support (Left, Right, Home and End move between tabs; only the open tab is in the
 * Tab key order).
 */
const TabsContext = createContext(null);

/** Custom hook for the parts: fails with a clear message when a part is used outside <Tabs> */
function useTabsContext(part) {
  const context = useContext(TabsContext);
  if (context === null) throw new Error(`<${part}> must be rendered inside <Tabs>.`);
  return context;
}

export function Tabs({ value, defaultValue, onChange, children }) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = isControlled ? value : internalValue;
  const baseId = useId();

  // Keep the latest onChange in a ref so `select` keeps the same identity between renders
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const select = useCallback(
    (next) => {
      if (!isControlled) setInternalValue(next);
      onChangeRef.current?.(next);
    },
    [isControlled]
  );

  const context = useMemo(() => ({ value: current, select, baseId }), [current, select, baseId]);
  // No wrapper element: the parts can sit anywhere in the layout
  return <TabsContext.Provider value={context}>{children}</TabsContext.Provider>;
}

function TabList({ children, className = '', ...props }) {
  useTabsContext('Tabs.List');
  const listRef = useRef(null);

  const handleKeyDown = (event) => {
    const tabs = [...listRef.current.querySelectorAll('[role="tab"]:not([disabled])')];
    const index = tabs.indexOf(document.activeElement);
    if (index === -1) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click(); // automatic activation: the focused tab opens
  };

  return (
    <div role="tablist" ref={listRef} className={className} onKeyDown={handleKeyDown} {...props}>
      {children}
    </div>
  );
}

function Tab({ value, children, className = '', disabled = false, ...props }) {
  const { value: current, select, baseId } = useTabsContext('Tabs.Tab');
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      className={`tab${active ? ' active' : ''} ${className}`.trim()}
      disabled={disabled}
      onClick={() => select(value)}
      {...props}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children, keepMounted = false, className = 'tab-panel', ...props }) {
  const { value: current, baseId } = useTabsContext('Tabs.Panel');
  const active = current === value;
  if (!active && !keepMounted) return null; // closed panels are not rendered at all
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!active}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

// Attach the parts to the parent so they are used as <Tabs.List>, <Tabs.Tab>, <Tabs.Panel>
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
