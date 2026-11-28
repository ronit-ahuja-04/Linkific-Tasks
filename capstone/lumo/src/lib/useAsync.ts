import { useEffect, useState } from 'react';
import { toAppError, type AppError } from './errors';

export type AsyncState<T> =
  { status: 'loading' } | { status: 'error'; error: AppError } | { status: 'ready'; data: T };

/**
 * Run a loader whenever its inputs (or a retry) change. Each run has a key; a result is shown only while its key is
 * current, so a slow answer for old inputs never overwrites a newer one, and "loading" needs no extra state.
 */
export function useAsync<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const key = `${JSON.stringify(deps)}#${attempt}`;
  const [result, setResult] = useState<{ key: string; state: AsyncState<T> } | null>(null);

  useEffect(() => {
    let current = true;
    load().then(
      (data) => current && setResult({ key, state: { status: 'ready', data } }),
      (error: unknown) =>
        current && setResult({ key, state: { status: 'error', error: toAppError(error) } }),
    );
    return () => {
      current = false;
    };
    // The key captures every input: `load` is recreated each render on purpose and must not retrigger the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const state: AsyncState<T> = result && result.key === key ? result.state : { status: 'loading' };
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
