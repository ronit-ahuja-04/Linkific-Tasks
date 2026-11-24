/**
 * What an error BOUNDARY shows, decided from the thrown value. (apiFetch errors, from buttons and forms, are shown in
 * place with their own messages; boundaries catch what broke while rendering.) Four cases:
 *
 *   updated  a code chunk failed to load: a new version was deployed while the tab was open (inventory row C11).
 *            Retrying can not help, the old chunk is gone; only a reload gets the new version.
 *   offline  the browser is offline: say so, and retry once it is back.
 *   server   a Server Component failed. In production its message is hidden; Next.js gives a `digest`, the same id
 *            our server log line carries (src/instrumentation.ts), so it is shown as the reference.
 *   client   something broke in the browser: it is reported to our log (no digest exists for it).
 *
 * Pure (no React, no window): unit tested.
 */
export type ErrorReason = 'updated' | 'offline' | 'server' | 'client';

export interface ErrorView {
  reason: ErrorReason;
  title: string;
  text: string;
  /** a short id to quote; for server errors the digest */
  reference?: string;
  /** what the main button does: re-fetch and re-render the part that failed, or reload the whole page */
  action: 'retry' | 'reload';
  /** whether the browser should report it (the server already logged server errors; offline is expected) */
  report: boolean;
}

const CHUNK_FAILURE = /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

export function isChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_FAILURE.test(error.name) || CHUNK_FAILURE.test(error.message);
}

export const digestOf = (error: unknown): string | undefined =>
  typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest ? error.digest : undefined;

export function describeError(error: unknown, online: boolean, what = 'This page'): ErrorView {
  if (isChunkError(error)) {
    return {
      reason: 'updated', action: 'reload', report: true,
      title: 'Intern Quest was updated',
      text: 'A newer version went live while this tab was open. Reload to get it: anything you already saved is safe.',
    };
  }
  if (!online) {
    return {
      reason: 'offline', action: 'retry', report: false,
      title: 'You are offline',
      text: `${what} needs a connection. Reconnect, then try again.`,
    };
  }
  const digest = digestOf(error);
  if (digest) {
    return {
      reason: 'server', action: 'retry', report: false, reference: digest,
      title: `${what} could not load`,
      text: 'The problem is on our side, and it has been logged. Try again in a moment.',
    };
  }
  return {
    reason: 'client', action: 'retry', report: true,
    title: `${what} broke`,
    text: 'Something went wrong in your browser, and it has been reported. Try again; if it keeps happening, reload the page.',
  };
}
