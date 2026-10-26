/**
 * 04-fetch-api.js
 * Demonstrates HTTP requests using native global fetch() in Node.js 20+:
 * 1. Fetching JSON from JSONPlaceholder (/posts)
 * 2. Fetching Pokémon data from PokeAPI (/pokemon/pikachu)
 * 3. Checking response.ok and parsing response.json()
 */

// CONCEPT: fetch-api

console.log('====================================================');
console.log('              04: NATIVE FETCH API DEMO             ');
console.log('====================================================\n');

/**
 * Fetches sample posts from JSONPlaceholder public API.
 */
async function fetchSamplePosts() {
  const url = 'https://jsonplaceholder.typicode.com/posts?_limit=3';
  console.log(`[1] Fetching posts from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const posts = await response.json();
    console.log(`[JSONPlaceholder] Successfully received ${posts.length} posts:`);
    posts.forEach((post) => {
      console.log(`  - [ID ${post.id}] ${post.title.substring(0, 45)}...`);
    });
  } catch (err) {
    console.error('[JSONPlaceholder Fetch Error]:', err.message);
  }
}

/**
 * Fetches Pokémon details from PokeAPI public REST API.
 */
async function fetchPokemonDetails(nameOrId = 'pikachu') {
  const url = `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
  console.log(`\n[2] Fetching Pokémon data from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`PokeAPI responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Destructuring key fields from API response
    const { id, name, height, weight, types, stats } = data;
    const typeNames = types.map((t) => t.type.name).join(', ');
    const hpStat = stats.find((s) => s.stat.name === 'hp')?.base_stat;

    console.log('[PokeAPI] Parsed Pokémon View:');
    console.log({
      id,
      name: name.toUpperCase(),
      types: typeNames,
      heightMeters: height / 10,
      weightKg: weight / 10,
      baseHp: hpStat,
    });
  } catch (err) {
    console.error('[PokeAPI Fetch Error]:', err.message);
  }
}

async function runFetchDemos() {
  await fetchSamplePosts();
  await fetchPokemonDetails('pikachu');
  console.log('\nAll Fetch API demonstrations completed successfully.');
}

runFetchDemos();
