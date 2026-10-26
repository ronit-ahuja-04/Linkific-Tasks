/**
 * api.js - PokeAPI Service Layer with In-Memory Cache
 * Zero DOM code. Strictly handles network requests and data transformations.
 */

// In-memory cache to prevent redundant HTTP requests (PK-5)
// CONCEPT: Map-cache
const pokemonCache = new Map();

/**
 * Normalizes input name or ID.
 * @param {string | number} input
 * @returns {string}
 */
export function normalizeKey(input) {
  return String(input).trim().toLowerCase();
}

/**
 * Internal helper to fetch and parse JSON with explicit HTTP status verification.
 * @param {string} url
 * @returns {Promise<any>}
 */
// CONCEPT: fetch-api
// CONCEPT: response.ok
export async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

/**
 * Transforms raw PokeAPI JSON payload into a clean view model.
 * Performs nested destructuring and converts units (dm -> m, hg -> kg).
 * @param {object} raw
 * @returns {object}
 */
// CONCEPT: destructuring
export function toPokemonView(raw) {
  const {
    id,
    name,
    sprites: {
      front_default,
      other: {
        'official-artwork': { front_default: officialArtwork } = {},
      } = {},
    } = {},
    height,
    weight,
    types,
    stats,
  } = raw;

  return {
    id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    sprite: officialArtwork || front_default || '',
    types: types.map((t) => t.type.name),
    heightM: Number((height / 10).toFixed(1)),
    weightKg: Number((weight / 10).toFixed(1)),
    stats: stats.map((s) => ({
      name: s.stat.name,
      base: s.base_stat,
    })),
  };
}

/**
 * Fetches Pokémon detail by name or ID.
 * Employs Map cache to avoid repeating network requests.
 * @param {string | number} nameOrId
 * @returns {Promise<object>}
 */
// CONCEPT: async-await
export async function getPokemon(nameOrId) {
  const key = normalizeKey(nameOrId);
  if (!key) {
    throw new Error('Please enter a valid Pokémon name or ID number.');
  }

  // PK-5: In-memory cache lookup
  if (pokemonCache.has(key)) {
    return pokemonCache.get(key);
  }

  const raw = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`);
  const viewData = toPokemonView(raw);

  // Cache by both name and numeric ID
  pokemonCache.set(key, viewData);
  pokemonCache.set(String(viewData.id), viewData);
  pokemonCache.set(viewData.name.toLowerCase(), viewData);

  return viewData;
}

/**
 * Fetches a page of Pokémon summary results.
 * Returns a standard Promise for chaining in main.js.
 * @param {number} [offset=0]
 * @param {number} [limit=20]
 * @returns {Promise<Array<{ name: string, url: string }>>}
 */
// CONCEPT: promises
export function getPokemonPage(offset = 0, limit = 20) {
  const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        const error = new Error(`List fetch failed with status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    })
    .then((data) => data.results);
}
