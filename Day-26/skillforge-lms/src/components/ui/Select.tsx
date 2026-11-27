import { useId, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  options?: readonly SelectOption[];
  containerClassName?: string;
}

export function Select({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  options,
  containerClassName = '',
  className = '',
  children,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={selectId}
          className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-bold text-ink'}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-xl border-2 bg-surface px-3 py-2 text-sm font-semibold text-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger focus:border-danger' : 'border-line focus:border-brand',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
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
