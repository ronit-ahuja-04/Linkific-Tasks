'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-client';

/**
 * GLOBAL ERROR LISTENERS. Error boundaries only catch errors thrown while React RENDERS. They do not see errors in
 * event handlers, timers or promises nobody awaited; those reach the window instead:
 *   - `error`               an exception nobody caught (e.g. in a click handler or a setTimeout)
 *   - `unhandledrejection`  a promise that failed with no .catch (e.g. `void save()` that threw)
 * Both are reported to our log. They are not prevented: the browser still prints them in the console for developers.
 */
export default function ErrorListeners() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => reportClientError(event.error ?? new Error(event.message), 'window');
    const onRejection = (event: PromiseRejectionEvent) => reportClientError(event.reason, 'unhandledrejection');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
