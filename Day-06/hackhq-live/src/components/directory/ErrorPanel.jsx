/**
 * Accessible error alert panel with a Retry trigger.
 * Complies with requirement PD-3 (role="alert", specific message, refetch).
 */
export function ErrorPanel({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="p-5 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-200 space-y-3"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0" aria-hidden="true">
          ⚠️
        </span>
        <div className="flex-1">
          <h4 className="font-semibold text-rose-100 text-sm">Failed to load participants</h4>
          <p className="text-xs text-rose-300/90 mt-1 font-mono break-words">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-400 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Retry Request
          </button>
        </div>
      )}
    </div>
  );
}

