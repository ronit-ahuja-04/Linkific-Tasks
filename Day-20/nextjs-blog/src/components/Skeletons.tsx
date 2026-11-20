/** Placeholder shapes shown by loading.tsx and Suspense fallbacks while the real content streams in */
export function ListSkeleton() {
  return (
    <ul className="grid" aria-busy="true" aria-label="Loading posts">
      {[0, 1, 2].map((i) => (
        <li key={i}>
          <div className="skeleton skeleton-block" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        </li>
      ))}
    </ul>
  );
}

export function PostSkeleton() {
  return (
    <div className="article" aria-busy="true" aria-label="Loading post">
      <div className="skeleton skeleton-line" style={{ width: '40%' }} />
      <div className="skeleton skeleton-line" style={{ height: '2.4rem' }} />
      <div className="skeleton skeleton-block" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" style={{ width: '70%' }} />
    </div>
  );
}
