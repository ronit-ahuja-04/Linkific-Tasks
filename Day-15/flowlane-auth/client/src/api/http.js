import axios from 'axios';

/**
 * HTTP LAYER: one axios instance for the whole app.
 *
 * Where the access token lives: in this module-level variable, i.e. in MEMORY only. Not in
 * localStorage/sessionStorage: any script running on the page (an XSS bug, a bad npm package)
 * can read those. Memory is lost on reload, which is fine: on startup we get a fresh access
 * token by calling /auth/refresh, because the browser sends the HttpOnly refresh cookie along
 * (JavaScript can never read that cookie).
 */
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const getAccessToken = () => accessToken;

let failureHandler = null;
/** The auth layer registers a callback here; it is told when a refresh failed and the user is logged out */
export const setAuthFailureHandler = (fn) => {
  failureHandler = typeof fn === 'function' ? fn : null;
};

export const NETWORK_ERROR_MESSAGE = 'Cannot reach the server. Check your connection.';

/** The one error type the UI ever sees. Matches the server shape { error: { code, message, fields? } } */
export class ApiError extends Error {
  constructor({ status = 0, code = 'unknown', message = 'Something went wrong.', fields } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** axios error -> ApiError. Idempotent (an ApiError passes through unchanged). */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (error?.response) {
    const { status, data } = error.response;
    const body = data?.error;
    return new ApiError({
      status,
      code: body?.code ?? `http_${status}`,
      message: body?.message ?? 'Something went wrong. Please try again.',
      fields: body?.fields,
    });
  }
  // axios sets error.request (or code ERR_NETWORK) when no response arrived at all
  if (error?.request || error?.isAxiosError) {
    return new ApiError({ status: 0, code: 'network_error', message: NETWORK_ERROR_MESSAGE });
  }
  return new ApiError({ status: 0, code: 'unknown', message: error?.message || 'Something went wrong.' });
}

const BASE_URL = '/api';
// X-Requested-With is the CSRF defence for the cookie endpoints: a browser will not add a custom
// header to a cross-site request without a CORS preflight, so a forged form post cannot carry it.
const COMMON_HEADERS = { 'X-Requested-With': 'fetch' };

export const http = axios.create({ baseURL: BASE_URL, withCredentials: true, headers: COMMON_HEADERS });

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// /auth/* URLs are never retried (a failed login must not trigger a refresh), except these
// Bearer-protected ones, which behave like any other API call.
const RETRYABLE_AUTH_PREFIXES = ['/auth/me', '/auth/sessions', '/auth/resend-verification'];
function canRetry(url = '') {
  const path = url.startsWith('/') ? url : `/${url}`;
  if (!path.startsWith('/auth/')) return true;
  return RETRYABLE_AUTH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/**
 * REFRESH, single flight. If five requests get a 401 at the same moment they all await the SAME
 * promise, so only one POST /auth/refresh happens. This matters because refresh tokens ROTATE:
 * the first call invalidates the old cookie, so a second parallel call would look like a stolen,
 * reused token and the server would revoke the whole session.
 *
 * It uses a bare axios instance (no interceptors) so a failing refresh can never trigger another
 * refresh. The adapter is read from `http` at call time so tests can swap it in one place.
 */
let refreshPromise = null;
export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const bare = axios.create({ baseURL: BASE_URL, withCredentials: true, headers: COMMON_HEADERS, adapter: http.defaults.adapter });
  refreshPromise = bare
    .post('/auth/refresh')
    .then((response) => {
      accessToken = response.data.accessToken;
      return response.data;
    })
    .catch((error) => {
      accessToken = null;
      throw toApiError(error);
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

// Parallel requests share one failed refresh (one shared ApiError); tell the handler once per failure.
const reported = new WeakSet();
function reportFailure(refreshError) {
  if (reported.has(refreshError)) return;
  reported.add(refreshError);
  failureHandler?.('expired');
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const apiError = toApiError(error);
    const sentToken = Boolean(config?.headers?.Authorization);
    const expired = apiError.status === 401 && (apiError.code === 'token_expired' || (apiError.code === 'unauthorized' && sentToken));
    if (!config || config._retried || !expired || !canRetry(config.url)) throw apiError;

    config._retried = true; // the flag that guarantees ONE retry and no loops
    try {
      await refreshAccessToken();
    } catch (refreshError) {
      reportFailure(refreshError);
      throw apiError;
    }
    return http(config); // the request interceptor attaches the new token
  }
);
