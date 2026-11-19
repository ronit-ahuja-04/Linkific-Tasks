import {
  Children, createContext, forwardRef, useContext, useState,
  type ComponentPropsWithoutRef, type ComponentType, type ElementType, type ForwardedRef, type ReactElement, type ReactNode, type Ref,
} from 'react';

/**
 * 03. Advanced React patterns, typed.
 */

// ---- 1. Higher-order components ----
// A HOC takes a component and returns a new one. Typing question: what props does the NEW one take?

/** `withLoading` ADDS a prop (`loading`) and passes everything else through: P & WithLoadingProps */
export interface WithLoadingProps {
  loading: boolean;
}
export function withLoading<P extends object>(Wrapped: ComponentType<P>): ComponentType<P & WithLoadingProps> {
  function WithLoading({ loading, ...rest }: P & WithLoadingProps) {
    if (loading) return <p role="status">Loading…</p>;
    // `rest` is Omit<P & WithLoadingProps, 'loading'>, which TypeScript can not prove equals P for a generic P: one cast, at the seam
    return <Wrapped {...(rest as unknown as P)} />;
  }
  WithLoading.displayName = `withLoading(${Wrapped.displayName ?? Wrapped.name})`;
  return WithLoading;
}

/** `withUser` INJECTS a prop: the wrapped component needs `user`, the new one does not (Omit<P, 'user'>) */
export interface InjectedUser {
  user: { name: string };
}
export function withUser<P extends InjectedUser>(Wrapped: ComponentType<P>, user: InjectedUser['user']): ComponentType<Omit<P, keyof InjectedUser>> {
  function WithUser(props: Omit<P, keyof InjectedUser>) {
    return <Wrapped {...(props as unknown as P)} user={user} />;
  }
  WithUser.displayName = `withUser(${Wrapped.displayName ?? Wrapped.name})`;
  return WithUser;
}

// ---- 2. Render props ----
// A component that owns some state or data and asks the CALLER how to draw it. Generics keep the item type.

export interface ListProps<T> {
  items: readonly T[];
  /** called for each item; T is inferred from `items` */
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T) => string | number;
  empty?: ReactNode;
}
export function List<T>({ items, renderItem, getKey, empty = <p>Nothing here</p> }: ListProps<T>): ReactElement {
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul>
      {items.map((item, i) => (
        <li key={getKey(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}

/** Children-as-a-function: the state is the component's, the markup is the caller's */
export interface ToggleState {
  on: boolean;
  toggle: () => void;
}
export function Toggle({ children, initial = false }: { children: (state: ToggleState) => ReactNode; initial?: boolean }): ReactElement {
  const [on, setOn] = useState(initial);
  return <>{children({ on, toggle: () => setOn((v) => !v) })}</>;
}

// ---- 3. Compound components ----
// <Accordion><Accordion.Item id="a" title="A">…</Accordion.Item></Accordion>: the parts share state through a typed context.

interface AccordionContextValue {
  openId: string | null;
  toggle: (id: string) => void;
}
const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (ctx === null) throw new Error('Accordion.Item must be used inside <Accordion>');
  return ctx;
}

function AccordionRoot({ children, defaultOpen = null }: { children: ReactNode; defaultOpen?: string | null }): ReactElement {
  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));
  return <AccordionContext.Provider value={{ openId, toggle }}>{children}</AccordionContext.Provider>;
}

function AccordionItem({ id, title, children }: { id: string; title: string; children: ReactNode }): ReactElement {
  const { openId, toggle } = useAccordion();
  const open = openId === id;
  return (
    <section>
      <button type="button" aria-expanded={open} onClick={() => toggle(id)}>{title}</button>
      {open && <div>{children}</div>}
    </section>
  );
}

/** Object.assign gives the function static members and TypeScript sees them: `Accordion.Item` is typed */
export const Accordion = Object.assign(AccordionRoot, { Item: AccordionItem });

/** Counting children: `Children.count` and `Children.toArray` are typed over ReactNode */
export function countChildren(children: ReactNode): number {
  return Children.toArray(children).length;
}

// ---- 4. Polymorphic components (the `as` prop) ----
// <Box as="a" href="…"> must accept anchor props, <Box as="button" onClick> button props, and <Box as="a" onClick={wrongThing}> must fail.

type PolymorphicProps<E extends ElementType, Own = object> = Own &
  Omit<ComponentPropsWithoutRef<E>, keyof Own | 'as'> & { as?: E };

export interface BoxOwnProps {
  padding?: number;
}

/**
 * `E extends ElementType = 'div'`: the element TYPE is the generic. `ComponentPropsWithoutRef<E>` then supplies
 * that element's own props (href for 'a', disabled for 'button'). The component's own props win over clashes.
 */
export function Box<E extends ElementType = 'div'>({ as, padding = 0, style, ...rest }: PolymorphicProps<E, BoxOwnProps>): ReactElement {
  const Tag: ElementType = as ?? 'div';
  return <Tag style={{ padding, ...(style as object | undefined) }} {...rest} />;
}

// ---- 5. forwardRef ----

/** The classic form: the ref type is the FIRST type argument, the props the second */
export const TextInput = forwardRef<HTMLInputElement, { label: string } & ComponentPropsWithoutRef<'input'>>(function TextInput(
  { label, ...input },
  ref
) {
  return (
    <label>
      {label}
      <input ref={ref} {...input} />
    </label>
  );
});

/**
 * forwardRef erases generics: `forwardRef(function Select<T>…)` loses T. The known workaround is to cast the result
 * back to a generic call signature. It is the one cast you keep.
 */
export interface SelectProps<T> extends Omit<ComponentPropsWithoutRef<'select'>, 'value' | 'onChange'> {
  options: readonly T[];
  value: T;
  getLabel: (option: T) => string;
  onChange: (option: T) => void;
}
function SelectInner<T>({ options, value, getLabel, onChange, ...rest }: SelectProps<T>, ref: ForwardedRef<HTMLSelectElement>) {
  return (
    <select
      ref={ref}
      {...rest}
      value={options.indexOf(value)}
      onChange={(e) => {
        const picked = options[Number(e.target.value)];
        if (picked !== undefined) onChange(picked);
      }}
    >
      {options.map((o, i) => (
        <option key={getLabel(o)} value={i}>{getLabel(o)}</option>
      ))}
    </select>
  );
}
export const Select = forwardRef(SelectInner) as <T>(props: SelectProps<T> & { ref?: Ref<HTMLSelectElement> }) => ReactElement;

/**
 * React 19: `ref` is an ordinary prop on function components, so `forwardRef` is no longer needed for new code.
 * You type it as `ref?: Ref<HTMLButtonElement>` and pass it on.
 */
export function FancyButton({ ref, ...props }: ComponentPropsWithoutRef<'button'> & { ref?: Ref<HTMLButtonElement> }): ReactElement {
  return <button ref={ref} {...props} />;
}
