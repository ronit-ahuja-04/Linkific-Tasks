/**
 * Accessible skeleton placeholder rows displayed while participant data is loading.
 * Complies with requirement PD-1 (includes aria-busy on the list container).
 */
export function UserRowSkeleton({ count = 5 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading participants"
      className="space-y-3"
    >
      {items.map((idx) => (
        <div
          key={idx}
          className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-slate-900/40 animate-pulse"
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 bg-slate-800 rounded" />
            <div className="h-3 w-56 bg-slate-800/70 rounded" />
          </div>
          <div className="h-6 w-14 bg-slate-800/60 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading participants list...</span>
    </div>
  );
}

