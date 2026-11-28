import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './variants';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks clicks, but keeps the button focusable (aria-disabled, not disabled). */
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'glow',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  fullWidth,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : leftIcon}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}
