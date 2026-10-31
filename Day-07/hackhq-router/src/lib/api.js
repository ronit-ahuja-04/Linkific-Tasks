// BASE_URL and URL building utilities for DummyJSON API
export const BASE_URL = 'https://dummyjson.com';
export const FALLBACK_BASE_URL = 'https://jsonplaceholder.typicode.com';

/**
 * Pure function to construct the DummyJSON users API endpoint.
 * Encodes query parameters and handles pagination and simulated delays.
 */
export function buildUsersUrl({ query = '', limit = 10, skip = 0, delay = 0 } = {}) {
  const trimmed = query.trim();
  const searchPart = trimmed
    ? `/users/search?q=${encodeURIComponent(trimmed)}&limit=${limit}&skip=${skip}`
    : `/users?limit=${limit}&skip=${skip}`;

  const delayParam = delay > 0 ? `&delay=${delay}` : '';
  return `${BASE_URL}${searchPart}${delayParam}`;
}

/**
 * Pure function to construct the endpoint for a specific user's posts.
 */
export function buildUserPostsUrl(userId) {
  if (!userId) return null;
  return `${BASE_URL}/users/${userId}/posts`;
}
