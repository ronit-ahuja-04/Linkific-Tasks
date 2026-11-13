import { ALL_MONTHS, DAY_COUNT, MONTH_COUNT, REGIONS, getWarehouse } from '../data/generate';

/**
 * A pretend REST API. `fetchDashboard` waits like a network request would, can be cancelled with
 * an AbortSignal, and can be told to fail, so the dashboard's loading, refetch and error states
 * are real code paths rather than hopes.
 *
 * The server filters by RANGE (the last N months; it also sends the N months before, so the
 * dashboard can show "vs previous period"). Region and category are filtered in the browser, so
 * switching them is instant and needs no request.
 */
export function createApi({ delayMs = 500, failTimes = 0 } = {}) {
  let remainingFailures = failTimes;
  const calls = [];

  async function fetchDashboard({ months }, { signal } = {}) {
    calls.push(months);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, delayMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Request cancelled', 'AbortError'));
      });
    });
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
  }

  return { fetchDashboard, calls };
}

export const api = createApi();
