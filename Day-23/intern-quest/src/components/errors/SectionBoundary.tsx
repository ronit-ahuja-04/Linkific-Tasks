'use client';

import { catchError, type ErrorInfo } from 'next/error';
import ErrorPanel from './ErrorPanel';

/**
 * An error boundary for ONE part of a page (Next 16's `catchError`): if that part fails, only it shows an error,
 * and the rest of the page stays. Server Components inside it work too: a failed database read in a streamed section
 * arrives here instead of taking the page down (inventory row S1: the home page's leaderboard).
 * `retry()` re-fetches the section from the server; `notFound()` and `redirect()` pass through untouched.
 *
 *   <SectionBoundary what="The guild board"> <Suspense …><Board /></Suspense> </SectionBoundary>
 */
function SectionFallback({ what }: { what: string }, { error, retry }: ErrorInfo) {
  return <ErrorPanel variant="section" what={what} error={error} retry={retry} />;
}

export default catchError(SectionFallback);
