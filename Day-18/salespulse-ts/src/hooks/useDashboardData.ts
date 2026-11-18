import { useCallback, useEffect, useState } from 'react';
import type { DashboardApi, DashboardResponse } from '../types';

/** What the hook gives back. */
export interface DashboardData {
  /** the last data that arrived (kept while the next request is running), or null before the first answer */
  data: DashboardResponse | null;
  /** the message of a failed request for the CURRENT range, else null */
  error: string | null;
  /** true only for the very first load (nothing to show yet) */
  loading: boolean;
  /** true while a NEW range loads and the old charts are still on screen */
  refreshing: boolean;
  /** ask again after an error */
  retry: () => void;
}

interface Failure {
  key: string;
  message: string;
}

/** A thrown value can be anything: look at it before using it */
const isAbort = (reason: unknown): boolean => reason instanceof Error && reason.name === 'AbortError';
const messageOf = (reason: unknown): string => (reason instanceof Error ? reason.message : 'Something went wrong. Try again.');

/**
 * Fetch the dashboard data for a range of months from the (mock) API.
 *
 * Nothing sets state at the top of an effect: `loading`, `refreshing` and `error` are worked out
 * from three plain facts (the data, the requested range, the last failure), so they can never
 * disagree with each other.
 */
export function useDashboardData(api: DashboardApi, months: number): DashboardData {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${months}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    api.fetchDashboard({ months }, { signal: controller.signal }).then(
      (result) => setData(result),
      (reason: unknown) => {
        if (!isAbort(reason)) setFailure({ key, message: messageOf(reason) });
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
