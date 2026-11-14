// Which translated message fits an ApiError code (see `github.error.*` in the dictionaries)
const KNOWN = new Set(['github_token_invalid', 'github_token_missing', 'github_rate_limited', 'rate_limited', 'repo_not_found', 'network_error', 'github_unavailable']);
const ALIAS = {
  github_token_invalid: 'token_invalid',
  github_token_missing: 'token_invalid',
  github_rate_limited: 'rate_limited',
  rate_limited: 'rate_limited',
  repo_not_found: 'repo_not_found',
  network_error: 'network_error',
  github_unavailable: 'unavailable',
};

export const errorKeyFor = (error) => (KNOWN.has(error?.code) ? ALIAS[error.code] : 'generic');

/** The token is gone or rejected: the only fix is to connect again */
export const needsReconnect = (error) => error?.code === 'github_token_invalid' || error?.code === 'github_token_missing';
