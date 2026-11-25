/**
 * Shown while a page's code chunk downloads (the Suspense fallback of a lazy route, Day 24). Usually it is never
 * seen: links preload their page on hover or focus. On a slow connection it keeps the layout steady (a heading-sized
 * bar and a few rows, the shape of most pages) instead of a blank area, and says "Loading" to screen readers once.
 */
export default function PageLoading({ fullPage = false }) {
  const bars = (
    <div className="page-loading" aria-busy="true">
      <p className="sr-only" role="status">Loading the page…</p>
      <span className="skeleton page-loading-title" aria-hidden="true" />
      <span className="skeleton page-loading-line" aria-hidden="true" />
      <span className="skeleton page-loading-block" aria-hidden="true" />
      <span className="skeleton page-loading-block" aria-hidden="true" />
    </div>
  );
  return fullPage ? <main className="centered-page">{bars}</main> : bars;
}
