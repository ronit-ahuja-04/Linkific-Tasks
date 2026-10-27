import axios from 'axios';

/**
 * Creates a configured axios client for the GitHub REST API.
 */
export function createGitHubClient(token = null) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'repo-report-cli',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return axios.create({
    baseURL: 'https://api.github.com',
    headers,
    timeout: 10000,
  });
}

/**
 * Fetches public repositories for a given GitHub username.
 * Accepts an optional client parameter for dependency injection and testing.
 * Filters out forks and archived repositories unless includeAll is true.
 *
 * @param {string} username - GitHub username
 * @param {object} [client] - Axios instance (defaults to createGitHubClient())
 * @param {boolean} [includeAll=false] - Whether to include forks and archived repos
 * @returns {Promise<Array>} Array of repository objects
 */
export async function fetchRepos(username, client = createGitHubClient(), includeAll = false) {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new Error('A valid GitHub username must be provided.');
  }

  const response = await client.get(`/users/${encodeURIComponent(username.trim())}/repos`, {
    params: {
      per_page: 100,
      sort: 'pushed',
      direction: 'desc',
    },
  });

  const repos = response.data;
  if (!Array.isArray(repos)) {
    return [];
  }

  if (includeAll) {
    return repos;
  }

  return repos.filter((repo) => !repo.fork && !repo.archived);
}
