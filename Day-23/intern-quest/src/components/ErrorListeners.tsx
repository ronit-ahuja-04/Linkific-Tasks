'use client';

import { useEffect } from 'react';
import { reportClientError, shouldReport } from '@/lib/report-client';
import { toast } from '@/lib/toast';

/**
 * GLOBAL ERROR LISTENERS. Error boundaries only catch errors thrown while React RENDERS. They do not see errors in
 * event handlers, timers or promises nobody awaited; those reach the window instead:
 *   - `error`               an exception nobody caught (e.g. in a click handler or a setTimeout)
 *   - `unhandledrejection`  a promise that failed with no .catch (e.g. `void save()` that threw)
 * Both are reported to our log, and a toast tells the person (nothing else on the page can show such an error).
 * They are not prevented: the browser still prints them in the console for developers.
 */
const UNEXPECTED = 'Something on this page went wrong, and it has been reported. If anything looks wrong, reload the page.';
const handle = (error: unknown, source: 'window' | 'unhandledrejection') => {
  if (!shouldReport(error)) return; // expected failures (offline, a 4xx…) are shown where they happen
  reportClientError(error, source);
  toast(UNEXPECTED, 'error');
};
export default function ErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => handle(event.error ?? new Error(event.message), 'window');
    const onRejection = (event: PromiseRejectionEvent) => handle(event.reason, 'unhandledrejection');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
