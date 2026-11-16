import axios from 'axios';
import { auth } from '../lib/firebase';
import { clearGithubToken, getGithubToken } from '../lib/githubToken';

/**
 * The browser's door to our own Express API (server/).
 *
 * Two things happen on every call, in "interceptors" (small functions axios runs for us):
 *
 *  1. BEFORE the request leaves: we attach the Firebase ID token as `Authorization: Bearer <jwt>`.
 *     The ID token is a JWT (a signed passport) that proves who the user is; the server checks its
 *     signature. `getIdToken()` returns the cached token and quietly renews it when it is about to
 *     expire (it lives one hour), so we never store or refresh it ourselves.
 *     For GitHub endpoints we also send the GitHub access token in `X-GitHub-Token`; the server
 *     only forwards it to GitHub, it never saves it.
 *
 *  2. AFTER a failed response: if the server says 401 "token_expired / unauthorized" we ask
 *     Firebase for a brand new ID token ONCE, then repeat the request ONCE. If that still fails the
 *     session is really gone and we tell the app (setAuthFailureHandler) so it can sign the user out.
 */

export class ApiError extends Error {
  constructor({ status = 0, code = 'unknown', message = 'Request failed', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

// The app (AuthProvider) registers what should happen when the session cannot be saved.
let authFailureHandler = () => {};
export const setAuthFailureHandler = (fn) => {
  authFailureHandler = typeof fn === 'function' ? fn : () => {};
};

// Tell the app only once per "failure episode": a screen firing five requests at once must not
// sign the user out five times. A later successful response re-arms it.
let failureReported = false;
function reportAuthFailure() {
  if (failureReported) return;
  failureReported = true;
  try {
    authFailureHandler();
  } catch {
    /* the handler is the app's business; never break the request chain */
  }
}

// ONE refresh at a time: parallel 401s all await the same promise instead of asking Firebase N times.
let refreshing = null;
function refreshIdToken() {
  if (!refreshing) {
    const user = auth?.currentUser;
    refreshing = (user ? user.getIdToken(true) : Promise.reject(new Error('no user')))
      .catch((err) => {
        reportAuthFailure();
        throw err;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// Test helper: forget module state between tests
export function resetClientState() {
  refreshing = null;
  failureReported = false;
  authFailureHandler = () => {};
}

api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;
  if (!user) {
    throw new ApiError({ status: 401, code: 'unauthorized', message: 'You are not signed in.' });
  }
  const idToken = await user.getIdToken(); // cached, renewed by the SDK when close to expiry
  config.headers.set('Authorization', `Bearer ${idToken}`);
  if (config.github) {
    const githubToken = getGithubToken();
    if (githubToken) config.headers.set('X-GitHub-Token', githubToken);
  }
  return config;
});

/** Turn whatever axios gave us into one predictable ApiError */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  if (!response) {
    return new ApiError({ status: 0, code: 'network_error', message: 'Could not reach the server.' });
  }
  const body = response.data?.error;
  const { code, message, ...details } = body && typeof body === 'object' ? body : {};
  return new ApiError({
    status: response.status,
    code: code || (response.status === 401 ? 'unauthorized' : `http_${response.status}`),
    message: message || error.message || 'Request failed',
    details: Object.keys(details).length ? details : undefined,
  });
}

api.interceptors.response.use(
  (response) => {
    failureReported = false;
    return response;
  },
  async (error) => {
    if (axios.isCancel(error)) throw error;
    const apiError = toApiError(error);
    const config = error?.config;

    if (apiError.status === 401 && apiError.code === 'github_token_invalid') {
      clearGithubToken(); // the UI now shows "Reconnect GitHub"
      throw apiError;
    }

    if (apiError.status === 401 && (apiError.code === 'token_expired' || apiError.code === 'unauthorized')) {
      if (!config) throw apiError; // failed before a request existed (e.g. nobody signed in)
      if (config._retried) {
        // We already refreshed and retried once: the session itself is not accepted any more.
        reportAuthFailure();
        throw apiError;
      }
      try {
        await refreshIdToken();
      } catch {
        throw apiError;
      }
      config._retried = true;
      return api.request(config); // the request interceptor attaches the fresh token
    }

    throw apiError;
  }
);

export default api;
