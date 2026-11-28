/** One error model for the whole app: every failure becomes an AppError with a kind and a human message. */
export type ErrorKind =
  'offline' | 'auth' | 'forbidden' | 'not_found' | 'validation' | 'conflict' | 'server';

export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly code?: string;
  constructor(kind: ErrorKind, message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.code = code;
  }
}

interface SupabaseLikeError {
  message?: string;
  code?: string;
  status?: number;
}

const MESSAGES: Record<ErrorKind, string> = {
  offline: "You're offline. Nothing was sent; try again when you're back.",
  auth: 'Please sign in again.',
  forbidden: "You don't have permission to do that.",
  not_found: "That doesn't exist (or isn't visible to you).",
  validation: 'Some of that information needs fixing.',
  conflict: 'That already exists.',
  server: 'Something went wrong on our side. Please try again.',
};

/** Map a Supabase / Postgres / fetch error to an AppError. Postgres codes: 42501 privilege, 23505 unique, 23514 check. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    return new AppError('offline', MESSAGES.offline);
  const e = (error ?? {}) as SupabaseLikeError;
  const code = e.code;
  const raw = e.message ?? '';
  if (error instanceof TypeError && /fetch/i.test(raw))
    return new AppError('offline', MESSAGES.offline);
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(raw)) {
    return new AppError('auth', 'That email and password don’t match.', code);
  }
  if (code === 'user_already_exists' || /already registered/i.test(raw)) {
    return new AppError(
      'conflict',
      'An account with that email already exists. Try signing in.',
      code,
    );
  }
  if (code === '23505')
    return new AppError(
      'conflict',
      /handle/.test(raw) ? 'That handle is taken.' : MESSAGES.conflict,
      code,
    );
  if (code === '23514' || code === '22023' || code === '23502')
    return new AppError('validation', raw || MESSAGES.validation, code);
  if (code === '42501') return new AppError('forbidden', raw || MESSAGES.forbidden, code);
  if (code === 'P0002' || code === 'PGRST116')
    return new AppError('not_found', MESSAGES.not_found, code);
  if (e.status === 401 || code === '28000') return new AppError('auth', MESSAGES.auth, code);
  return new AppError('server', MESSAGES.server, code);
}
