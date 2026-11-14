// A labelled input with its error/hint wired up for screen readers (aria-invalid + aria-describedby).
export default function TextField({ id, label, error, hint, inputRef, ...inputProps }) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} ref={inputRef} className="input" aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...inputProps} />
      {hint && !error ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
