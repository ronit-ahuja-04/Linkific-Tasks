import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './variants';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style preset aligned with SkillForge RPG tokens. */
  variant?: ButtonVariant;
  /** Spacing and typography scale. */
  size?: ButtonSize;
  /** Displays a spinner, sets aria-busy, and disables clicks. */
  loading?: boolean;
  /** Optional text shown instead of children while loading. */
  loadingText?: string;
  /** Optional leading icon element. */
  leftIcon?: ReactNode;
  /** Optional trailing icon element. */
  rightIcon?: ReactNode;
  /** Stretches button to full container width. */
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
