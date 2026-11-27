import type { HTMLAttributes, ReactNode } from 'react';
import { cardClasses, type CardPadding, type CardVariant } from './variants';

export type CardElement = 'div' | 'section' | 'article' | 'aside';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Semantic HTML element rendered by the card container. */
  as?: CardElement;
  /** Visual surface treatment. */
  variant?: CardVariant;
  /** Internal padding preset. */
  padding?: CardPadding;
  /** Adds subtle hover lift and brand border accent. */
  interactive?: boolean;
  children: ReactNode;
}

export function Card({
  as = 'div',
  variant = 'default',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Tag = as;
  return (
    <Tag className={cardClasses({ variant, padding, interactive, className })} {...rest}>
      {children}
    </Tag>
  );
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className = '', children, ...rest }: CardSectionProps) {
  return (
    <div
      className={`border-b-2 border-line bg-surface-2/60 px-6 py-4 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className = '', children, ...rest }: CardSectionProps) {
  return (
    <div className={`p-6 ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...rest }: CardSectionProps) {
  return (
    <div className={`border-t border-line px-6 py-4 ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
