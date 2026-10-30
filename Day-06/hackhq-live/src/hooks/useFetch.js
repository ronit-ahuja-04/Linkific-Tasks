import { useState, useEffect } from 'react';

/**
 * Custom hook for declarative data fetching with AbortController cleanup.
 *
 * @param {string|null} url - The URL to fetch. If null/empty, no request is made.
 * @returns {{ data: any, loading: boolean, error: string|null, refetch: () => void }}
 */
export function useFetch(url) {
  // CONCEPT: useFetch - declarative data fetching with AbortController cleanup
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    url: null,
    reloadKey: 0,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!url) {
      setFetchState({ url: null, reloadKey, data: null, error: null });
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}: ${response.statusText || 'Fetch failed'}`
          );
        }

        const result = await response.json();
        setFetchState({
          url,
          reloadKey,
          data: result,
          error: null,
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          // Aborted requests must never update component state
          return;
        }
        setFetchState({
          url,
          reloadKey,
          data: null,
          error: err.message || 'An unexpected fetch error occurred',
        });
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, reloadKey]);

  // Derived states to prevent displaying stale data while a new URL or refetch is in flight
  const isTargetUrl = fetchState.url === url;
  const isTargetKey = fetchState.reloadKey === reloadKey;
  const loading = Boolean(url) && (!isTargetUrl || !isTargetKey);
  const data = isTargetUrl ? fetchState.data : null;
  const error = isTargetUrl ? fetchState.error : null;

  const refetch = () => {
    setReloadKey((prev) => prev + 1);
  };

  return { data, loading, error, refetch };
}
