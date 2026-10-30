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
      className="live-skeleton-list"
    >
      {items.map((idx) => (
        <div key={idx} className="live-skeleton-row">
          <div className="live-skeleton-avatar" />
          <div className="live-skeleton-lines">
            <div className="live-skeleton-line-title" />
            <div className="live-skeleton-line-sub" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading participants list...</span>
    </div>
  );
}
