import axios, { type AxiosAdapter, type AxiosInstance, type AxiosResponse } from 'axios';

/**
 * 05. Async operations, typed: promises, fetch, axios, errors.
 */

// ---- 1. async / await and Promise<T> ----

/** An `async` function ALWAYS returns a Promise: write `Promise<T>` for what the caller gets after `await` */
export async function delayed<T>(value: T, ms = 0): Promise<T> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
  return value;
}

/** Promise.all keeps each position's type: the result is a TUPLE, not an array of a union */
export async function loadPair(): Promise<[number, string]> {
  const [n, s] = await Promise.all([delayed(1), delayed('one')]);
  return [n, s];
}

/** allSettled gives a union per item; checking `status` narrows it */
export async function settle<T>(promises: readonly Promise<T>[]): Promise<{ values: T[]; errors: string[] }> {
  const results = await Promise.allSettled(promises);
  const values: T[] = [];
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') values.push(r.value); // r: PromiseFulfilledResult<T>
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason)); // r.reason is `any` in lib.d.ts: treat as unknown
  }
  return { values, errors };
}

// ---- 2. Errors: `catch (e)` is unknown, so narrow it ----

/** The discriminant `kind` makes the error handling exhaustive */
export class HttpError extends Error {
  readonly kind = 'http' as const;
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}
export class NetworkError extends Error {
  readonly kind = 'network' as const;
  constructor(message = 'Network unreachable') {
    super(message);
    this.name = 'NetworkError';
  }
}
export class ValidationError extends Error {
  readonly kind = 'validation' as const;
  constructor(readonly field: string) {
    super(`Invalid response: ${field}`);
    this.name = 'ValidationError';
  }
}
export type AppError = HttpError | NetworkError | ValidationError;

/** Turn ANY thrown value into an AppError (a thrown value can be a string, null, anything) */
export function toAppError(thrown: unknown): AppError {
  if (thrown instanceof HttpError || thrown instanceof NetworkError || thrown instanceof ValidationError) return thrown;
  if (axios.isAxiosError(thrown)) {
    // axios.isAxiosError is a type guard: thrown is AxiosError here, so `.response?.status` is typed
    return thrown.response ? new HttpError(thrown.response.status, thrown.message) : new NetworkError(thrown.message);
  }
  if (thrown instanceof TypeError) return new NetworkError(thrown.message); // fetch rejects with TypeError when offline
  return new NetworkError(String(thrown));
}

export function describeError(error: AppError): string {
  switch (error.kind) {
    case 'http':
      return `Server said ${error.status}`; // error.status exists only on HttpError
    case 'network':
      return 'You appear to be offline';
    case 'validation':
      return `Bad field: ${error.field}`;
  }
}

// ---- 3. Result<T, E>: errors as values instead of exceptions ----

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Run any promise and capture the outcome as a Result; callers must check `ok` before touching `value` */
export async function attempt<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    return ok(await promise);
  } catch (thrown: unknown) {
    return err(toAppError(thrown));
  }
}

// ---- 4. A typed fetch wrapper: the response body is `unknown` until a guard says otherwise ----

/** `Guard<T>` is any function that proves an unknown value is a T */
export type Guard<T> = (value: unknown) => value is T;

export interface Post {
  id: number;
  title: string;
}
export const isPost: Guard<Post> = (v): v is Post =>
  typeof v === 'object' && v !== null && 'id' in v && typeof v.id === 'number' && 'title' in v && typeof v.title === 'string';
export const isArrayOf =
  <T>(guard: Guard<T>): Guard<T[]> =>
  (v): v is T[] =>
    Array.isArray(v) && v.every(guard);

/**
 * `response.json()` returns `Promise<any>` in the DOM typings. We IMMEDIATELY store it as `unknown`, check it with
 * the guard and only then call it a T. No cast: the guard is the proof. `fetchImpl` is injectable for tests.
 */
export async function fetchJson<T>(url: string, guard: Guard<T>, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new HttpError(response.status, response.statusText);
  const body: unknown = await response.json();
  if (!guard(body)) throw new ValidationError('body');
  return body;
}

// ---- 5. axios: generics on the call, a typed error ----

/** `axios.get<T>` says what `response.data` is. It is a PROMISE of that type, not a check: validate if the server is not yours. */
export async function getPosts(client: AxiosInstance): Promise<Post[]> {
  const response: AxiosResponse<Post[]> = await client.get<Post[]>('/posts');
  return response.data;
}

/** Validate even with axios: type the data `unknown`, run the guard */
export async function getPostsChecked(client: AxiosInstance): Promise<Post[]> {
  const { data } = await client.get<unknown>('/posts');
  if (!isArrayOf(isPost)(data)) throw new ValidationError('posts');
  return data;
}

export async function createPost(client: AxiosInstance, input: Omit<Post, 'id'>): Promise<Post> {
  // two type arguments: <ResponseData, ResponseWrapper, RequestBody>; here the request body is typed too
  const response = await client.post<Post, AxiosResponse<Post>, Omit<Post, 'id'>>('/posts', input);
  return response.data;
}

/** An axios instance whose transport is replaced, so tests never touch the network */
export function makeClient(adapter: AxiosAdapter): AxiosInstance {
  return axios.create({ baseURL: 'http://example.test', adapter });
}

// ---- 6. Generic retry and timeout ----

/** Run `task` until it succeeds or `attempts` are used up. T flows from the task to the result. */
export async function retry<T>(task: (attempt: number) => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await task(i);
    } catch (thrown: unknown) {
      lastError = thrown;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Reject if `promise` takes longer than `ms`; resolves to the same T otherwise */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (reason: unknown) => { clearTimeout(timer); reject(reason instanceof Error ? reason : new Error(String(reason))); }
    );
  });
}
