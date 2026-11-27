import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible or screen-reader field label. */
  label?: string;
  /** Hides the label visually while keeping it accessible to screen readers. */
  hideLabel?: boolean;
  /** Helper text displayed below the input and linked via aria-describedby. */
  hint?: string;
  /** Validation error message; switches border tone and sets aria-invalid. */
  error?: string;
  /** Optional leading icon positioned inside the left edge of the field. */
  leftIcon?: ReactNode;
  /** Optional trailing slot (e.g. password visibility toggle). */
  rightSlot?: ReactNode;
  /** Additional classes for the outer wrapper element. */
  containerClassName?: string;
}

export function Input({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  leftIcon,
  rightSlot,
  containerClassName = '',
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-bold text-ink'}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-3 inline-flex text-muted"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'w-full rounded-xl border-2 bg-surface py-2 text-sm text-ink placeholder:text-muted/75 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger focus:border-danger' : 'border-line focus:border-brand',
            leftIcon ? 'pl-9' : 'px-3',
            rightSlot ? 'pr-10' : leftIcon ? 'pr-3' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {rightSlot && <div className="absolute right-2 inline-flex items-center">{rightSlot}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
