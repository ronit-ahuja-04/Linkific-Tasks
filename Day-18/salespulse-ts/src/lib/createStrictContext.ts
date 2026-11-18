import { createContext, useContext, type Context } from 'react';

/**
 * A context whose hook can never hand back `null`.
 *
 * `createContext<T | null>(null)` is the usual starting point (there is no value until a Provider
 * exists), but then every consumer would have to check for null. This helper keeps the null inside:
 * the hook either returns a real `T` or throws a clear message when used outside its Provider.
 *
 *   const [DashboardContext, useDashboard] = createStrictContext<DashboardValue>('useDashboard', 'DashboardProvider');
 *
 * `T` is a generic that links two positions (what the Provider supplies, what the hook returns).
 */
export function createStrictContext<T>(hookName: string, providerName: string): readonly [Context<T | null>, () => T] {
  const Ctx = createContext<T | null>(null);
  function useStrictContext(): T {
    const value = useContext(Ctx);
    if (value === null) throw new Error(`${hookName} must be used inside a <${providerName}>.`);
    return value;
  }
  return [Ctx, useStrictContext];
}
