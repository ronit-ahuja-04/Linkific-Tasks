import { isAppError } from './errors';

/**
 * Send a browser-side error to our own log (POST /api/client-errors), where it lands next to the server's errors
 * as one JSON line. Used by the global listeners (ErrorListeners) and, from M3, by the error boundaries.
 *
 * Careful by design:
 *   - expected failures are NOT reported: being offline, a timeout, a 4xx. An API 5xx is not reported either: the
 *     server already logged it, with the same request id.
 *   - at most 10 reports per page load, and the same message at most once every 30 s (an error in a render loop must
 *     not flood the log or the network);
 *   - only the path is sent, never the query string (it can hold personal data), and nothing from the page's content;
 *   - reporting never throws: an error while reporting an error is dropped.
 */
export type ReportSource = 'window' | 'unhandledrejection' | 'boundary';

const MAX_PER_PAGE = 10;
const REPEAT_WINDOW_MS = 30_000;
let sent = 0;
const lastSent = new Map<string, number>();

export function shouldReport(error: unknown): boolean {
  if (isAppError(error)) return error.kind === 'unknown';
  return true;
}

export function reportClientError(error: unknown, source: ReportSource, extra: { digest?: string } = {}): void {
  try {
    if (!shouldReport(error)) return;
    const name = error instanceof Error ? error.name : typeof error;
    const message = error instanceof Error ? error.message : String(error);
    const key = `${name}:${message}`;
    const now = Date.now();
    if (sent >= MAX_PER_PAGE || now - (lastSent.get(key) ?? -Infinity) < REPEAT_WINDOW_MS) return;
    sent += 1;
    lastSent.set(key, now);
    const report = {
      source,
      name: name.slice(0, 100),
      message: message.slice(0, 1000),
      stack: error instanceof Error && error.stack ? error.stack.slice(0, 4000) : undefined,
      path: location.pathname.slice(0, 300),
      digest: extra.digest,
    };
    // keepalive: the report still goes out if the page is being closed or navigated away
    void fetch('/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report), keepalive: true }).catch(() => undefined);
  } catch {
    // never let reporting break the page
  }
}
