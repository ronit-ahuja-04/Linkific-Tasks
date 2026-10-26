/**
 * main.js - Pokédex Application Controller
 * Demonstrates the two asynchronous paradigms side-by-side:
 * - Browse Path (PK-3): Promise chain (.then/.catch/.finally) with Promise.all
 * - Search Path (PK-4): async/await with try/catch/finally
 */

import { getPokemon, getPokemonPage, normalizeKey } from './api.js';
import { elements, renderDetailCard, renderGrid, renderState } from './ui.js';

// Application State
const state = {
  status: 'idle', // 'idle' | 'loading' | 'success' | 'notFound' | 'error'
  current: null,  // Currently inspected Pokémon view model
  list: [],       // Loaded Pokémon cards for browsing grid
  offset: 0,
  typeFilter: 'all',
  sortBy: 'id',   // 'id' | 'name'
  isLoadingMore: false,
};

/**
 * Returns filtered and sorted cards for the browse grid.
 * @returns {Array<object>}
 */
// CONCEPT: filter
// CONCEPT: sort
function getProcessedGridList() {
  let filtered = state.list;

  if (state.typeFilter !== 'all') {
    filtered = filtered.filter((p) => p.types.includes(state.typeFilter));
  }

  const copy = [...filtered];

  if (state.sortBy === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    copy.sort((a, b) => a.id - b.id);
  }

  return copy;
}

/**
 * Updates the grid rendering based on active filter and sorting.
 */
function updateGridView() {
  const processed = getProcessedGridList();
  renderGrid(processed);
}

// ============================================================================
// 1. Browse Path: Implemented using Promise Chains & Promise.all (PK-3)
// ============================================================================
// CONCEPT: promises
// CONCEPT: Promise.all
export function loadMorePokemon() {
  if (state.isLoadingMore) return;
  state.isLoadingMore = true;
  elements.btnLoadMore.disabled = true;
  elements.btnLoadMore.textContent = 'Loading...';

  // 1. Fetch page of 20 summaries
  getPokemonPage(state.offset, 20)
    // 2. Map summaries into array of detail promises and wait with Promise.all
    .then((results) => {
      const detailPromises = results.map((item) => getPokemon(item.name));
      return Promise.all(detailPromises);
    })
    // 3. Append received Pokémon details to state
    .then((newDetails) => {
      state.list = [...state.list, ...newDetails];
      state.offset += 20;
      updateGridView();
    })
    // 4. Handle any network or parsing rejection
    .catch((error) => {
      console.error('[browse error]:', error);
      renderState('error', `Failed to load Pokémon list: ${error.message}`);
    })
    // 5. Cleanup loading indicators
    .finally(() => {
      state.isLoadingMore = false;
      elements.btnLoadMore.disabled = false;
      elements.btnLoadMore.textContent = 'Load More Pokémon';
    });
}

// ============================================================================
// 2. Search Path: Implemented using async / await & try/catch/finally (PK-4)
// ============================================================================
// CONCEPT: async-await
// CONCEPT: error-handling
export async function handleSearch(query) {
  const trimmed = normalizeKey(query);
  if (!trimmed) {
    renderState('notFound', 'Please enter a Pokémon name or ID number.');
    return;
  }

  renderState('loading');
  elements.btnSearch.disabled = true;

  try {
    const pokemon = await getPokemon(trimmed);
    state.current = pokemon;
    renderDetailCard(pokemon);
    renderState('success');
  } catch (error) {
    console.warn('[search error]:', error);
    if (error.status === 404) {
      renderState('notFound', `No Pokémon matching "${trimmed}" exists.`);
    } else {
      renderState('error', `Search failed: ${error.message}`);
    }
  } finally {
    elements.btnSearch.disabled = false;
  }
}

/**
 * Initializes listeners and loads first batch of Pokémon.
 */
function init() {
  // Search Form Submit
  elements.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = elements.searchInput.value;
    handleSearch(query);
  });

  // Load More Button
  elements.btnLoadMore.addEventListener('click', loadMorePokemon);

  // Type Filter Dropdown
  elements.typeFilter.addEventListener('change', (event) => {
    state.typeFilter = event.target.value;
    updateGridView();
  });

  // Sort Selector Dropdown
  elements.sortSelect.addEventListener('change', (event) => {
    state.sortBy = event.target.value;
    updateGridView();
  });

  // Event Delegation on Pokémon Browse Grid (PK-6)
  // CONCEPT: event-delegation
  elements.pokemonGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.grid-card');
    if (!card) return;

    const id = card.getAttribute('data-id');
    const matched = state.list.find((p) => String(p.id) === id);

    if (matched) {
      state.current = matched;
      renderDetailCard(matched);
      // Scroll smoothly to detail view on mobile
      elements.detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Initial loads:
  // 1. Load Pikachu by default in detail view
  handleSearch('pikachu');
  // 2. Load first 20 in browse grid
  loadMorePokemon();
}

document.addEventListener('DOMContentLoaded', init);
