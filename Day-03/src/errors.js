/**
 * Formats API errors into polite, user-friendly messages without stack traces.
 *
 * @param {Error} error - The caught error object
 * @param {string} username - The queried GitHub username
 * @returns {string} Human-readable error explanation
 */
export function formatApiError(error, username) {
  if (error.response) {
    const status = error.response.status;
    if (status === 404) {
      return `Error: GitHub user '${username}' was not found (404). Please verify the username.`;
    }
    if (status === 403) {
      const remaining = error.response.headers?.['x-ratelimit-remaining'];
      const resetTime = error.response.headers?.['x-ratelimit-reset'];
      if (remaining === '0' || remaining === 0) {
        const resetDate = resetTime
          ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString()
          : 'soon';
        return `Error: GitHub API rate limit exceeded (403). Limit resets at ${resetDate}.`;
      }
      return `Error: Access forbidden by GitHub API (403).`;
    }
    if (status >= 500) {
      return `Error: GitHub servers are currently experiencing issues (${status}). Please try again later.`;
    }
    return `Error: GitHub API responded with status ${status}: ${error.response.data?.message || 'Unknown error'}`;
  }

  if (
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    (error.message && error.message.includes('Network Error'))
  ) {
    return `Error: Network connectivity issue. Unable to connect to https://api.github.com.`;
  }

  return `Error: ${error.message}`;
}
