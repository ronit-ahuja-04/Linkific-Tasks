import {
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const control = (error?: string) =>
  [
    'w-full rounded-2xl border-2 bg-white px-4 text-base text-ink placeholder:text-dusk/70 focus:outline-none',
    error ? 'border-ember focus:border-ember' : 'border-line-strong focus:border-violet',
  ].join(' ');

function Described({
  id,
  hint,
  error,
  extra,
}: {
  id: string;
  hint?: string;
  error?: string;
  extra?: ReactNode;
}) {
  return (
    <>
      {(hint || extra) && !error && (
        <p id={`${id}-hint`} className="m-0 flex justify-between gap-2 text-sm text-dusk">
          <span>{hint}</span>
          {extra}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="m-0 text-sm font-bold text-ember-ink">
          {error}
        </p>
      )}
    </>
  );
}

const describedBy = (id: string, hint?: unknown, error?: string) =>
  [hint && !error ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
  undefined;

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function SelectField({ label, hint, error, options, id, ...rest }: SelectFieldProps) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-extrabold">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, hint, error)}
        className={`min-h-12 ${control(error)}`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Described id={selectId} hint={hint} error={error} />
    </div>
  );
}

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  /** Shows "123 / 600" under the field. */
  showCount?: boolean;
  mono?: boolean;
}

export function TextAreaField({
  label,
  hint,
  error,
  showCount,
  mono,
  id,
  maxLength,
  value,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const generated = useId();
  const areaId = id ?? generated;
  const count =
    showCount && maxLength ? (
      <span aria-hidden="true">
        {String(value ?? '').length} / {maxLength}
      </span>
    ) : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={areaId} className="text-sm font-extrabold">
        {label}
      </label>
      <textarea
        id={areaId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(areaId, hint || count, error)}
        className={`py-3 ${control(error)} ${mono ? 'font-mono text-sm' : ''}`}
        {...rest}
      />
      <Described id={areaId} hint={hint} error={error} extra={count} />
    </div>
  );
}
