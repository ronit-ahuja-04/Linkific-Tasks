/**
 * Accessible skeleton placeholder rows displayed while participant data is loading.
 * Complies with requirement PD-1.
 */
export function UserRowSkeleton({ count = 5 }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading participants"
      className="flex flex-col gap-2"
    >
      {items.map((idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
        >
          <div className="size-11 shrink-0 animate-pulse rounded-full bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading participants list...</span>
    </div>
  );
}
