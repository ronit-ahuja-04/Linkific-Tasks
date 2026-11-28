/** Grey placeholders in the shape of what's loading, so the page doesn't jump when data arrives. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-mist ${className}`} />;
}

export function CardSkeletons({ count = 3, label }: { count?: number; label: string }) {
  return (
    <div role="status" aria-label={label}>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4 p-0">
        {Array.from({ length: count }, (_, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-[var(--radius-card)] border-2 border-line bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </li>
        ))}
      </ul>
    </div>
  );
}
