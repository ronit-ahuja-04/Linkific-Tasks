import { ALL_MONTHS, DAY_COUNT, MONTH_COUNT, REGIONS, getWarehouse } from '../data/generate';
import type { DashboardApi, DashboardParams, DashboardResponse, RequestOptions } from '../types';

/**
 * A pretend REST API. `fetchDashboard` waits like a network request would, can be cancelled with
 * an AbortSignal, and can be told to fail, so the dashboard's loading, refetch and error states
 * are real code paths rather than hopes.
 *
 * The server filters by RANGE (the last N months; it also sends the N months before, so the
 * dashboard can show "vs previous period"). Region and category are filtered in the browser, so
 * switching them is instant and needs no request.
 */

export interface CreateApiOptions {
  delayMs?: number;
  /** make the next N requests fail, to exercise the error and retry paths */
  failTimes?: number;
}

/**
 * Wait `delayMs` like a network would, then compute the answer. A generic: whatever `produce` returns
 * is what the promise resolves to, with its type kept (`simulateRequest(() => 5)` is a `Promise<number>`).
 * Cancelling through the AbortSignal rejects with an AbortError, as a real fetch does.
 */
export async function simulateRequest<T>(produce: () => T, delayMs: number, signal?: AbortSignal): Promise<T> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delayMs);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Request cancelled', 'AbortError'));
    });
  });
  return produce();
}

export function createApi({ delayMs = 500, failTimes = 0 }: CreateApiOptions = {}): DashboardApi {
  let remainingFailures = failTimes;
  const calls: number[] = [];

  async function fetchDashboard({ months }: DashboardParams, { signal }: RequestOptions = {}): Promise<DashboardResponse> {
    calls.push(months);
    return simulateRequest(
      (): DashboardResponse => {
        if (remainingFailures > 0) {
          remainingFailures -= 1;
          throw new Error('The analytics service did not respond. Try again.');
        }
        const { sales, users, products, scores } = getWarehouse();
        const wanted = Math.min(months * 2, MONTH_COUNT); // the period and the one before it
        const keep = new Set(ALL_MONTHS.slice(-wanted));
        return {
          months,
          sales: sales.filter((row) => keep.has(row.month)),
          users: users.slice(-Math.min(months * 31, DAY_COUNT) * REGIONS.length), // whole days only: 4 regions per day
          products,
          scores,
        };
      },
      delayMs,
      signal
    );
  }

  return { fetchDashboard, calls };
}

export const api: DashboardApi = createApi();
