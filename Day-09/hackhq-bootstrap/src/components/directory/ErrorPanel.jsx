/**
 * Accessible error alert panel with a Retry trigger.
 * Complies with requirement PD-3.
 */
export function ErrorPanel({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-bad/30 bg-bad-soft p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true">⚠️</span>
        <div>
          <div className="text-sm font-semibold text-bad">Failed to load data</div>
          <div className="mt-0.5 text-xs text-bad/80">{message}</div>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-bad px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
        >
          Retry Request
        </button>
      )}
    </div>
  );
}
