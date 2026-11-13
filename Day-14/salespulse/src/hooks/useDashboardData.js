import { useCallback, useEffect, useState } from 'react';

/**
 * Fetch the dashboard data for a range of months from the (mock) API.
 *
 *   data        the last data that arrived (kept while the next request is running)
 *   loading     true only for the very first load (nothing to show yet)
 *   refreshing  true while a NEW range loads and the old charts are still on screen
 *   error       the message of a failed request for the CURRENT range, else null
 *   retry()     ask again after an error
 *
 * Nothing sets state at the top of an effect: `loading`, `refreshing` and `error` are worked out
 * from three plain facts (the data, the requested range, the last failure), so they can never
 * disagree with each other.
 */
export function useDashboardData(api, months) {
  const [data, setData] = useState(null);
  const [failure, setFailure] = useState(null); // { key, message }
  const [attempt, setAttempt] = useState(0);
  const key = `${months}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    api.fetchDashboard({ months }, { signal: controller.signal }).then(
      (result) => setData(result),
      (error) => {
        if (error.name !== 'AbortError') setFailure({ key, message: error.message });
      }
    );
    return () => controller.abort(); // a newer range, or unmount, cancels the request
  }, [api, months, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const error = failure?.key === key ? failure.message : null;
  return {
    data,
    error,
    loading: data === null && !error,
    refreshing: data !== null && data.months !== months && !error,
    retry,
  };
}
