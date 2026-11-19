import type { DashboardStatus } from '../types';

/**
 * Typed errors. `catch (reason)` hands back `unknown` (anything can be thrown), so the app throws ONE class and
 * checks for it with `instanceof`. `kind` is a discriminant: code can branch on it and the compiler knows the cases.
 */
export type ApiErrorKind = 'network' | 'http' | 'shape';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** the HTTP status, only for kind 'http' */
  readonly status?: number;
  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

export const isApiError = (reason: unknown): reason is ApiError => reason instanceof ApiError;
export const isAbortError = (reason: unknown): boolean => reason instanceof Error && reason.name === 'AbortError';

/** What a failed request is reduced to inside the store: plain data (no class instance in Redux state) */
export interface ApiFailure {
  kind: ApiErrorKind | 'unknown';
  message: string;
}
const FALLBACK = 'Something went wrong. Try again.';

/** Turn whatever was thrown into an `ApiFailure`, narrowing `unknown` step by step */
export function toFailure(reason: unknown): ApiFailure {
  if (isApiError(reason)) return { kind: reason.kind, message: reason.message };
  if (reason instanceof Error) return { kind: 'unknown', message: reason.message };
  return { kind: 'unknown', message: FALLBACK };
}

/** The failure variant of a status (a helper so the Extract is used where it is read) */
export type ErrorStatus = Extract<DashboardStatus, { kind: 'error' }>;
