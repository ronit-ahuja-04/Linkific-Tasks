import {
  createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
  type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode,
} from 'react';

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
interface TabsContextValue {
  /** the value of the open tab */
  value: string | undefined;
  select: (next: string) => void;
  /** prefix for the ids that tie each tab to its panel */
  baseId: string;
}
const TabsContext = createContext<TabsContextValue | null>(null);

/** Custom hook for the parts: fails with a clear message when a part is used outside <Tabs> */
function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (context === null) throw new Error(`<${part}> must be rendered inside <Tabs>.`);
  return context;
}

interface TabsProps {
  /** controlled: the open tab, owned by the parent */
  value?: string;
  /** uncontrolled: the tab that starts open; Tabs keeps its own state */
  defaultValue?: string;
  onChange?: (next: string) => void;
  children: ReactNode;
}

export function Tabs({ value, defaultValue, onChange, children }: TabsProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const current = isControlled ? value : internalValue;
  const baseId = useId();

  // Keep the latest onChange in a ref so `select` keeps the same identity between renders
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const select = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChangeRef.current?.(next);
    },
    [isControlled]
  );

  const context = useMemo(() => ({ value: current, select, baseId }), [current, select, baseId]);
  // No wrapper element: the parts can sit anywhere in the layout
  return <TabsContext.Provider value={context}>{children}</TabsContext.Provider>;
}

type TabListProps = ComponentPropsWithoutRef<'div'>;
function TabList({ children, className = '', ...props }: TabListProps) {
  const { value } = useTabsContext('Tabs.List');
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // The sliding underline. It is moved by writing straight to the element's style, not through
  // React state, so a tab change costs no extra render. The first placement has no animation, or
  // the line would slide in from the left edge when the page loads.
  const placeIndicator = useCallback(() => {
    const indicator = indicatorRef.current;
    const active = listRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!indicator || !active) return;
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    if (!indicator.dataset.ready) requestAnimationFrame(() => { indicator.dataset.ready = 'true'; });
  }, []);

  useLayoutEffect(placeIndicator, [value, placeIndicator]);

  // Tabs change width when their text does (a new language): follow them
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(placeIndicator);
    observer.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [placeIndicator]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list) return;
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')];
    const index = tabs.findIndex((tab) => tab === document.activeElement);
    if (index === -1) return;
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next];
    if (!target) return;
    target.focus();
    target.click(); // automatic activation: the focused tab opens
  };

  return (
    <div role="tablist" ref={listRef} className={`tab-list ${className}`.trim()} onKeyDown={handleKeyDown} {...props}>
      {children}
      <span ref={indicatorRef} className="tab-indicator" aria-hidden="true" />
    </div>
  );
}

interface TabProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value'> {
  value: string;
}
function Tab({ value, children, className = '', disabled = false, ...props }: TabProps) {
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

interface TabPanelProps extends Omit<ComponentPropsWithoutRef<'div'>, 'id' | 'hidden'> {
  value: string;
  /** keep a closed panel in the page (hidden) instead of removing it */
  keepMounted?: boolean;
}
function TabPanel({ value, children, keepMounted = false, className = 'tab-panel', ...props }: TabPanelProps) {
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
