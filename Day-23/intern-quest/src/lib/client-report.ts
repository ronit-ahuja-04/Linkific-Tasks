/**
 * The body of POST /api/client-errors: an error a browser reports. Everything is optional except the message, and
 * every string is cut to a fixed length, so a report can never be used to write a huge line into the log.
 * Pure: unit tested.
 */
export interface ClientReport {
  source: 'window' | 'unhandledrejection' | 'boundary';
  name: string;
  message: string;
  stack?: string;
  path?: string;
  digest?: string;
}

const SOURCES = ['window', 'unhandledrejection', 'boundary'] as const;
const text = (value: unknown, max: number): string | undefined => (typeof value === 'string' && value.trim() ? value.slice(0, max) : undefined);

export function parseClientReport(value: unknown): ClientReport | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const message = text(v.message, 1000);
  const source = SOURCES.find((s) => s === v.source);
  if (!message || !source) return null;
  const path = text(v.path, 300);
  const digest = text(v.digest, 40);
  return {
    source,
    name: text(v.name, 100) ?? 'Error',
    message,
    stack: text(v.stack, 4000),
    // a path only (no scheme, host or query); a digest is a short token
    path: path?.startsWith('/') ? path.split('?')[0] : undefined,
    digest: digest && /^[\w-]+$/.test(digest) ? digest : undefined,
  };
}
