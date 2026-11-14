// One error shape for the whole API: { "error": { "code", "message", ...extra } }.
// The browser's axios interceptor reads `code` (token_expired, github_token_invalid...) to decide
// what to do, so codes are part of the contract and messages are only for humans.

export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export const errors = {
  unauthorized: (message = 'Missing or invalid credentials.') => new ApiError(401, 'unauthorized', message),
  tokenExpired: () => new ApiError(401, 'token_expired', 'The ID token has expired. Refresh it and retry.'),
  githubTokenMissing: () => new ApiError(401, 'github_token_missing', 'The X-GitHub-Token header is required.'),
  githubTokenInvalid: () => new ApiError(401, 'github_token_invalid', 'GitHub rejected the access token. Reconnect GitHub.'),
  validation: (message) => new ApiError(400, 'validation_failed', message),
  repoNotFound: () => new ApiError(404, 'repo_not_found', 'Repository not found or not accessible.'),
  githubUnavailable: () => new ApiError(502, 'github_unavailable', 'GitHub could not be reached.'),
  notFound: () => new ApiError(404, 'not_found', 'Route not found.'),
}

export function sendError(res, status, code, message, extra = {}) {
  res.status(status).json({ error: { code, message, ...extra } })
}

// Express error handler (last middleware). Unknown errors become a generic 500 and only their
// name is logged: messages could in theory contain request data, and we never log secrets.
export function errorHandler(config) {
  // Express recognises error handlers by their 4 arguments.
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    if (err instanceof ApiError) return sendError(res, err.status, err.code, err.message, err.extra)
    if (err?.type === 'entity.too.large') return sendError(res, 413, 'validation_failed', 'Request body is too large.')
    if (err?.type === 'entity.parse.failed') return sendError(res, 400, 'validation_failed', 'Malformed JSON body.')
    if (!config.logSilent) console.error(`[api] unexpected error: ${err?.name ?? 'Error'}`)
    return sendError(res, 500, 'internal_error', 'Something went wrong.')
  }
}
