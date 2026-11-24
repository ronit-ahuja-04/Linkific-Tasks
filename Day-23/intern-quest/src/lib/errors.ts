/**
 * ONE ERROR MODEL for everything the browser asks the server.
 *
 * Every failure, whatever caused it (no network, a slow server, a 409, a crash on our side), becomes an `AppError`
 * with a KIND. The kind decides three things, in one place instead of at every call site:
 *   - the message a person reads (what happened, and what to do next; never raw server text for a 5xx);
 *   - whether trying again can help (`retryable`), and whether a read may be retried automatically (`autoRetry`);
 *   - which reference (the request id) to quote when it is our fault.
 *
 * Pure and shared: used in the browser (apiFetch) and in unit tests; no imports.
 */
export type ErrorKind =
  | 'offline' //      the browser knows it has no network: nothing was sent
  | 'network' //      the request failed on the way (DNS, connection dropped, CORS): no answer
  | 'timeout' //      no answer before our deadline
  | 'aborted' //      we cancelled it ourselves (the page was left): not shown to anyone
  | 'validation' //   400: the input breaks a rule; `fields` says which
  | 'unauthorized' // 401: no session, or it ended
  | 'forbidden' //    403
  | 'notFound' //     404
  | 'conflict' //     409: e.g. that day is already logged
  | 'tooLarge' //     413
  | 'rateLimited' //  429
  | 'unavailable' //  503: our database is not answering; temporary
  | 'server' //       500 and other 5xx: a bug or an outage on our side
  | 'unknown';

export const MESSAGES: Record<ErrorKind, string> = {
  offline: 'You are offline. Nothing was sent: reconnect and try again.',
  network: 'Could not reach Intern Quest. Check your connection and try again.',
  timeout: 'Intern Quest took too long to answer. Try again in a moment.',
  aborted: 'Cancelled.',
  validation: 'Some fields need another look.',
  unauthorized: 'Your session has ended. Sign in again to continue.',
  forbidden: 'You are not allowed to do this.',
  notFound: 'That no longer exists. It may have been deleted.',
  conflict: 'That clashes with something already saved.',
  tooLarge: 'That is too large to send.',
  rateLimited: 'Too many tries in a short time. Wait a minute and try again.',
  unavailable: 'Intern Quest can not reach its database right now. Try again in a moment.',
  server: 'Something broke on our side. It has been logged; try again, and quote the reference if it keeps happening.',
  unknown: 'Something unexpected went wrong. Try again.',
};

/** Trying again (by a person) can help */
const RETRYABLE = new Set<ErrorKind>(['offline', 'network', 'timeout', 'rateLimited', 'unavailable', 'server', 'unknown']);
/** A READ may be retried automatically, a moment later, without asking anyone (never a write: it could happen twice) */
const AUTO_RETRY = new Set<ErrorKind>(['network', 'timeout', 'unavailable', 'server']);

export interface AppErrorInit {
  status?: number;
  fields?: Record<string, string>;
  requestId?: string;
  method?: string;
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly status?: number;
  readonly fields?: Record<string, string>;
  readonly requestId?: string;
  readonly method?: string;

  constructor(kind: ErrorKind, message: string, init: AppErrorInit = {}) {
    super(message, { cause: init.cause });
    this.name = 'AppError';
    this.kind = kind;
    this.status = init.status;
    this.fields = init.fields;
    this.requestId = init.requestId;
    this.method = init.method;
  }

  get retryable(): boolean {
    return RETRYABLE.has(this.kind);
  }

  get autoRetry(): boolean {
    return AUTO_RETRY.has(this.kind) && (this.method ?? 'GET') === 'GET';
  }

  /** Our fault (5xx), so a reference helps support find the log line */
  get isOurs(): boolean {
    return this.kind === 'server' || this.kind === 'unavailable';
  }

  /** The message with a short reference for our own failures: "… (ref 3f2a9c1e)" */
  get messageWithReference(): string {
    return this.isOurs && this.requestId ? `${this.message} (ref ${shortRef(this.requestId)})` : this.message;
  }
}

export const shortRef = (requestId: string): string => requestId.replace(/-/g, '').slice(0, 8);
export const isAppError = (value: unknown): value is AppError => value instanceof AppError;

export function kindForStatus(status: number): ErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404 || status === 410) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 413) return 'tooLarge';
  if (status === 429) return 'rateLimited';
  if (status === 503) return 'unavailable';
  if (status >= 500) return 'server';
  return 'unknown';
}

const isWrite = (method?: string) => method !== undefined && method !== 'GET' && method !== 'HEAD';

/**
 * An HTTP answer that is not OK. Our API answers `{ error, fields?, requestId? }`; the `error` sentence is written for
 * people, so it is used for 4xx answers. For 5xx the body may be anything (an HTML page, nothing at all), so the
 * message comes from the kind.
 */
export function fromResponse(status: number, body: unknown, init: Omit<AppErrorInit, 'status'> = {}): AppError {
  const kind = kindForStatus(status);
  const record = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  const serverMessage = typeof record.error === 'string' && record.error.trim() ? record.error : undefined;
  const fields = isFieldMap(record.fields) ? record.fields : undefined;
  const requestId = init.requestId ?? (typeof record.requestId === 'string' ? record.requestId : undefined);
  const usesServerText = status < 500 && kind !== 'unauthorized' && serverMessage !== undefined;
  return new AppError(kind, usesServerText ? serverMessage : MESSAGES[kind], { ...init, status, fields, requestId });
}

function isFieldMap(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every((v) => typeof v === 'string');
}

/**
 * A request that produced no answer at all: fetch rejected. Which kind it is depends on WHY:
 *   TimeoutError (our deadline) -> timeout · AbortError (we cancelled) -> aborted
 *   TypeError with the browser offline -> offline · any other TypeError -> network
 * (A CORS refusal is also a TypeError, "Failed to fetch": JavaScript can not tell it from a dropped connection.)
 */
export function fromException(error: unknown, init: AppErrorInit & { online?: boolean } = {}): AppError {
  if (isAppError(error)) return error;
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  const { online, ...rest } = init;
  if (name === 'TimeoutError') {
    // the request may have arrived and be in progress: a write may well have been saved
    const message = isWrite(init.method) ? `${MESSAGES.timeout} It may have been saved anyway: check before sending it again.` : MESSAGES.timeout;
    return new AppError('timeout', message, { ...rest, cause: error });
  }
  if (name === 'AbortError') return new AppError('aborted', MESSAGES.aborted, { ...rest, cause: error });
  if (online === false) return new AppError('offline', MESSAGES.offline, { ...rest, cause: error });
  if (name === 'TypeError') return new AppError('network', MESSAGES.network, { ...rest, cause: error });
  return new AppError('unknown', MESSAGES.unknown, { ...rest, cause: error });
}

/** Anything caught in a `catch` block, as an AppError (call sites need no type checks) */
export const toAppError = (error: unknown): AppError => fromException(error, { online: typeof navigator === 'undefined' ? undefined : navigator.onLine });
