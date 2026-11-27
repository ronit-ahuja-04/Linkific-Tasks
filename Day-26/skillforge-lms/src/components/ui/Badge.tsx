import type { HTMLAttributes, ReactNode } from 'react';
import { badgeClasses, type BadgeSize, type BadgeTone } from './variants';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color tone. */
  tone?: BadgeTone;
  /** Compact or standard pill sizing. */
  size?: BadgeSize;
  /** Optional leading icon rendered inside the badge. */
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  tone = 'brand',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={badgeClasses({ tone, size, className })} {...rest}>
      {icon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
