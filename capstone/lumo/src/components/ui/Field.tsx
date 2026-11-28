import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
}

/** A labelled input: the label, hint and error are wired with useId, aria-describedby and aria-invalid. */
export function Field({ id, label, hint, error, rightSlot, className = '', ...rest }: FieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-extrabold">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={[
            'min-h-12 w-full rounded-2xl border-2 bg-white px-4 text-base text-ink placeholder:text-dusk/70',
            'focus:outline-none',
            error ? 'border-ember focus:border-ember' : 'border-line-strong focus:border-violet',
            rightSlot ? 'pr-12' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {rightSlot && <div className="absolute right-2 flex">{rightSlot}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="m-0 text-sm text-dusk">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="m-0 text-sm font-bold text-ember-ink">
          {error}
        </p>
      )}
    </div>
  );
}
