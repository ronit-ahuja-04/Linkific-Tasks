import { useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hideLabel?: boolean;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  containerClassName = '',
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={textareaId}
          className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-bold text-ink'}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-xl border-2 bg-surface px-3.5 py-2 text-sm text-ink placeholder:text-muted/75 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-danger focus:border-danger' : 'border-line focus:border-brand',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
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
