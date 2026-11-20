'use client';

import { useEffect } from 'react';

/**
 * error.tsx: an error boundary for the whole app (it must be a Client Component). It catches errors thrown while
 * rendering a page below it. In this version of Next.js the recovery function is called `retry`: it re-fetches
 * and re-renders the failed segment without a full page reload.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="error-box" role="alert">
      <h1>Something went wrong</h1>
      <p>The page could not be shown. You can try again.</p>
      <button type="button" className="btn-primary" onClick={() => retry()}>Try again</button>
    </div>
  );
}
