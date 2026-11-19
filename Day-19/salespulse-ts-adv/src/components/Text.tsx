import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from 'react';

/**
 * A POLYMORPHIC component: one component that can be rendered as any element, with the props of THAT element.
 *
 *   <Text>plain paragraph</Text>                       renders <p>
 *   <Text as="h3" id="x">heading</Text>                renders <h3>; `id` is valid because h3 has it
 *   <Text as="a" href="/docs">link</Text>              renders <a>; `href` is valid only because `as="a"`
 *   <Text as="h3" href="/docs">…</Text>                COMPILE ERROR: an <h3> has no href
 *
 * How it works: `E extends ElementType` captures what `as` is. `ComponentPropsWithoutRef<E>` is "the props of E".
 * `Omit<…, keyof OwnProps>` removes anything we define ourselves, so ours win. In React 19 `ref` is an ordinary prop,
 * so it is typed here directly (no forwardRef needed).
 */
interface OwnProps<E extends ElementType> {
  as?: E;
  children?: ReactNode;
  /** a muted look (the `muted` class used across the app) */
  muted?: boolean;
  ref?: Ref<Element>;
}
export type TextProps<E extends ElementType> = OwnProps<E> & Omit<ComponentPropsWithoutRef<E>, keyof OwnProps<E>>;

export function Text<E extends ElementType = 'p'>({ as, muted = false, className, children, ...rest }: TextProps<E> & { className?: string }) {
  const Component: ElementType = as ?? 'p';
  const classes = [muted ? 'muted' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <Component className={classes || undefined} {...rest}>
      {children}
    </Component>
  );
}
