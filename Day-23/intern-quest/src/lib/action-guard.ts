import { toAppError, type AppError } from './errors';

/**
 * Server actions (the sign-in forms, the mentor code) are POSTs that React sends for us. When the network fails,
 * the action's promise rejects with fetch's TypeError, and React passes the error to the nearest error boundary,
 * replacing the whole form (inventory row C9: signing in offline showed "This page couldn't load").
 *
 * `guardAction` keeps the form: a failure to REACH the server (offline, network, timeout) becomes form state with a
 * message, like any other sign-in problem. Everything else is re-thrown untouched: real bugs belong to the boundary,
 * and so does Next's own control flow (a successful sign-in ends with a redirect).
 */
const UNREACHABLE: readonly AppError['kind'][] = ['offline', 'network', 'timeout'];

export function guardAction<S>(action: (previous: S, data: FormData) => Promise<S>, onUnreachable: (error: AppError, data: FormData, previous: S) => S) {
  return async (previous: S, data: FormData): Promise<S> => {
    try {
      return await action(previous, data);
    } catch (caught) {
      const error = toAppError(caught);
      if (UNREACHABLE.includes(error.kind)) return onUnreachable(error, data, previous);
      throw caught;
    }
  };
}
