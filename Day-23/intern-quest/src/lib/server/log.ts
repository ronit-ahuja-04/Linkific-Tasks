import 'server-only';

/**
 * STRUCTURED ERROR LOG. Every server error, and every error a browser reports, becomes ONE JSON line on stderr:
 *
 *   {"at":"error","source":"route","id":"<x-request-id>","digest":null,"method":"GET","path":"/api/quests",…}
 *
 * One line per error, so Vercel's log search (or grep) finds it by the request id the proxy gives every request, or
 * by the digest Next.js shows on its error page. Next's own multi-line "⨯ Error …" output stays as it is; this line
 * is the one meant to be searched.
 */
export type ErrorSource = 'render' | 'route' | 'action' | 'proxy' | 'client';

export interface ErrorContext {
  source: ErrorSource;
  requestId?: string | null;
  digest?: string | null;
  method?: string;
  path?: string;
  /** the route FILE, e.g. /journal/[id]: groups the same bug across different ids */
  route?: string;
  userId?: string | null;
}

const STACK_LINES = 8;

export function errorLine(error: unknown, context: ErrorContext): Record<string, unknown> {
  const isError = error instanceof Error;
  const kind = isError && 'kind' in error && typeof error.kind === 'string' ? error.kind : undefined;
  return {
    at: 'error',
    source: context.source,
    id: context.requestId ?? null,
    digest: context.digest ?? digestOf(error) ?? null,
    method: context.method,
    path: context.path,
    route: context.route,
    user: context.userId ?? undefined,
    name: isError ? error.name : typeof error,
    kind,
    message: (isError ? error.message : String(error)).slice(0, 500),
    stack: isError && error.stack ? error.stack.split('\n').slice(1, STACK_LINES + 1).map((l) => l.trim()) : undefined,
  };
}

export function digestOf(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' ? error.digest : undefined;
}

export function logError(error: unknown, context: ErrorContext): void {
  console.error(JSON.stringify(errorLine(error, context)));
}

/** First value of a header that Next may hand over as string | string[] */
export const headerValue = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
