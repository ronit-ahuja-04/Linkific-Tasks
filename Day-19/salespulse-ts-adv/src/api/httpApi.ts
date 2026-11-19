import { hasField, isCategory, isRegion } from '../lib/guards';
import type { DashboardApi, DashboardParams, DashboardResponse, Product, RequestOptions, SalesRow, Score, UsersRow } from '../types';
import { ApiError, isAbortError } from './errors';

/**
 * The REAL-network twin of mockApi: the same `DashboardApi`, but over `fetch`. The app does not use it (there is
 * no server), but it is the pattern for the day there is one, and it shows the rule for typing a response:
 *
 *   `response.json()` returns `any`. Do not cast it (`as DashboardResponse`): that is a promise the server never made.
 *   Take it as `unknown`, check it with a type guard, and only then does it become a `DashboardResponse`.
 */

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isArrayOf = <T>(value: unknown, guard: (item: unknown) => item is T): value is T[] => Array.isArray(value) && value.every(guard);

/** A tiny field checker: does `value` have each named field, and does the guard accept it? */
function hasFields(value: unknown, checks: Record<string, (field: unknown) => boolean>): boolean {
  return Object.entries(checks).every(([key, check]) => hasField(value, key) && check(Reflect.get(value, key)));
}

const isRegionValue = (v: unknown): boolean => isString(v) && isRegion(v);
const isCategoryValue = (v: unknown): boolean => isString(v) && isCategory(v);

export const isSalesRow = (value: unknown): value is SalesRow =>
  hasFields(value, { month: isString, region: isRegionValue, category: isCategoryValue, revenue: isNumber, cost: isNumber, orders: isNumber, units: isNumber });
export const isUsersRow = (value: unknown): value is UsersRow =>
  hasFields(value, { date: isString, region: isRegionValue, visitors: isNumber, sessions: isNumber, signups: isNumber });
export const isProduct = (value: unknown): value is Product =>
  hasFields(value, { id: isString, name: isString, category: isCategoryValue, price: isNumber, units: isNumber, revenue: isNumber, rating: isNumber });
export const isScore = (value: unknown): value is Score =>
  hasFields(value, { region: isRegionValue, category: isCategoryValue, satisfaction: isNumber, retention: isNumber });

/** The contract check: is this unknown JSON really a `DashboardResponse`? */
export function isDashboardResponse(value: unknown): value is DashboardResponse {
  if (!hasField(value, 'months') || !isNumber(value.months)) return false;
  return (
    hasField(value, 'sales') && isArrayOf(value.sales, isSalesRow) &&
    hasField(value, 'users') && isArrayOf(value.users, isUsersRow) &&
    hasField(value, 'products') && isArrayOf(value.products, isProduct) &&
    hasField(value, 'scores') && isArrayOf(value.scores, isScore)
  );
}

/**
 * GET a URL and return its JSON as `T`, where `T` is whatever the guard proves. Generic, and honest:
 * the return type is only as strong as the guard you pass in. Every failure becomes a typed `ApiError`.
 */
export async function fetchJson<T>(
  url: string,
  guard: (value: unknown) => value is T,
  { signal, fetchImpl = fetch }: RequestOptions & { fetchImpl?: typeof fetch } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(url, signal ? { signal } : {});
  } catch (reason: unknown) {
    if (isAbortError(reason)) throw reason; // cancelling is not a failure: let the caller see it as it is
    throw new ApiError('network', 'Could not reach the analytics service. Check your connection.');
  }
  if (!response.ok) throw new ApiError('http', `The analytics service answered ${response.status}.`, response.status);
  const body: unknown = await response.json();
  if (!guard(body)) throw new ApiError('shape', 'The analytics service sent data in an unexpected shape.');
  return body;
}

export function createHttpApi(baseUrl: string, fetchImpl?: typeof fetch): DashboardApi {
  const calls: number[] = [];
  async function fetchDashboard({ months }: DashboardParams, options: RequestOptions = {}): Promise<DashboardResponse> {
    calls.push(months);
    const url = `${baseUrl}/dashboard?months=${encodeURIComponent(String(months))}`;
    return fetchJson(url, isDashboardResponse, { ...options, ...(fetchImpl ? { fetchImpl } : {}) });
  }
  return { fetchDashboard, calls };
}
