/**
 * ui.js - Pokédex DOM Rendering Layer
 * Strictly responsible for DOM layout and rendering. No network calls.
 * Protects against XSS using textContent.
 */

// CONCEPT: createElement

export const elements = {
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  btnSearch: document.getElementById('btn-search'),
  stateContainer: document.getElementById('state-container'),
  detailSection: document.getElementById('detail-section'),
  detailCard: document.getElementById('detail-card'),
  gridSection: document.getElementById('grid-section'),
  pokemonGrid: document.getElementById('pokemon-grid'),
  btnLoadMore: document.getElementById('btn-load-more'),
  typeFilter: document.getElementById('type-filter'),
  sortSelect: document.getElementById('sort-select'),
};

/**
 * Returns color token corresponding to a Pokémon type.
 * @param {string} type
 * @returns {string}
 */
export function getTypeColor(type) {
  const colors = {
    normal: '#a8a878',
    fire: '#f08030',
    water: '#6890f0',
    grass: '#78c850',
    electric: '#f8d030',
    ice: '#98d8d8',
    fighting: '#c03028',
    poison: '#a040a0',
    ground: '#e0c068',
    flying: '#a890f0',
    psychic: '#f85888',
    bug: '#a8b820',
    rock: '#b8a038',
    ghost: '#705898',
    dragon: '#7038f8',
    steel: '#b8b8d0',
    fairy: '#ee99ac',
  };
  return colors[type] || '#777777';
}

/**
 * Updates the global state view banner (PK-2).
 * States: idle, loading, success, notFound, error
 * @param {'idle' | 'loading' | 'success' | 'notFound' | 'error'} status
 * @param {string} [customMessage='']
 */
export function renderState(status, customMessage = '') {
  elements.stateContainer.replaceChildren();

  if (status === 'idle') {
    elements.stateContainer.hidden = true;
    return;
  }

  elements.stateContainer.hidden = false;
  elements.stateContainer.className = `status-card status-${status}`;

  const messageP = document.createElement('p');

  switch (status) {
    case 'loading':
      messageP.textContent = 'Retrieving specimen telemetry from PokeAPI...';
      break;
    case 'notFound':
      messageP.textContent = customMessage || 'Specimen not found. Please verify the name or Dex ID.';
      break;
    case 'error':
      messageP.textContent = customMessage || 'Network communication error. Please check your connection.';
      break;
    case 'success':
      elements.stateContainer.hidden = true;
      return;
    default:
      elements.stateContainer.hidden = true;
      return;
  }

  elements.stateContainer.appendChild(messageP);
}

/**
 * Renders the full detail card for the searched or selected Pokémon (PK-1, PK-9).
 * @param {object} pokemon
 */
export function renderDetailCard(pokemon) {
  elements.detailCard.replaceChildren();

  if (!pokemon) {
    elements.detailSection.hidden = true;
    return;
  }

  elements.detailSection.hidden = false;

  const header = document.createElement('div');
  header.className = 'detail-header';

  const nameEl = document.createElement('h2');
  nameEl.className = 'detail-name';
  nameEl.textContent = pokemon.name;

  const idBadge = document.createElement('span');
  idBadge.className = 'detail-id-badge';
  idBadge.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

  header.appendChild(nameEl);
  header.appendChild(idBadge);

  // Sprite & Body Stats
  const bodyGrid = document.createElement('div');
  bodyGrid.className = 'detail-body-grid';

  const spriteWrapper = document.createElement('div');
  spriteWrapper.className = 'sprite-wrapper';

  const img = document.createElement('img');
  img.className = 'pokemon-sprite';
  img.src = pokemon.sprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
  img.alt = `Official artwork of ${pokemon.name}`;
  img.loading = 'lazy';
  spriteWrapper.appendChild(img);

  const infoCol = document.createElement('div');
  infoCol.className = 'info-col';

  // Types Tags
  const typesContainer = document.createElement('div');
  typesContainer.className = 'types-list';
  pokemon.types.forEach((typeName) => {
    const tag = document.createElement('span');
    tag.className = 'type-tag';
    tag.textContent = typeName.toUpperCase();
    tag.style.backgroundColor = getTypeColor(typeName);
    typesContainer.appendChild(tag);
  });
  infoCol.appendChild(typesContainer);

  // Dimensions
  const dimRow = document.createElement('div');
  dimRow.className = 'dimensions-row';

  const heightSpan = document.createElement('span');
  const heightStrong = document.createElement('strong');
  heightStrong.textContent = 'Height: ';
  heightSpan.appendChild(heightStrong);
  heightSpan.appendChild(document.createTextNode(`${pokemon.heightM} m`));

  const weightSpan = document.createElement('span');
  const weightStrong = document.createElement('strong');
  weightStrong.textContent = 'Weight: ';
  weightSpan.appendChild(weightStrong);
  weightSpan.appendChild(document.createTextNode(`${pokemon.weightKg} kg`));

  dimRow.appendChild(heightSpan);
  dimRow.appendChild(weightSpan);
  infoCol.appendChild(dimRow);

  bodyGrid.appendChild(spriteWrapper);
  bodyGrid.appendChild(infoCol);

  // Base Stats Bars (PK-9)
  const statsSection = document.createElement('div');
  statsSection.className = 'stats-section';

  const statsTitle = document.createElement('h3');
  statsTitle.className = 'stats-title';
  statsTitle.textContent = 'Base Stats';
  statsSection.appendChild(statsTitle);

  const statsList = document.createElement('div');
  statsList.className = 'stats-bars-list';

  pokemon.stats.forEach((stat) => {
    const row = document.createElement('div');
    row.className = 'stat-bar-row';

    const label = document.createElement('span');
    label.className = 'stat-bar-label';
    label.textContent = stat.name.replace('-', ' ').toUpperCase();

    const val = document.createElement('span');
    val.className = 'stat-bar-value';
    val.textContent = String(stat.base);

    const track = document.createElement('div');
    track.className = 'stat-bar-track';

    const fill = document.createElement('div');
    fill.className = 'stat-bar-fill';
    const percent = Math.min(100, Math.round((stat.base / 200) * 100));
    fill.style.width = `${percent}%`;

    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(val);
    row.appendChild(track);
    statsList.appendChild(row);
  });
  statsSection.appendChild(statsList);

  elements.detailCard.appendChild(header);
  elements.detailCard.appendChild(bodyGrid);
  elements.detailCard.appendChild(statsSection);
}

/**
 * Renders the browsing grid of Pokémon cards (PK-3, PK-6).
 * @param {Array<object>} pokemonList
 */
export function renderGrid(pokemonList) {
  elements.pokemonGrid.replaceChildren();

  if (!pokemonList || pokemonList.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'grid-empty';
    empty.textContent = 'No Pokémon match the active filter.';
    elements.pokemonGrid.appendChild(empty);
    return;
  }

  pokemonList.forEach((pokemon) => {
    const card = document.createElement('article');
    card.className = 'grid-card';
    card.setAttribute('data-id', String(pokemon.id));
    card.setAttribute('data-name', pokemon.name.toLowerCase());
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for #${pokemon.id} ${pokemon.name}`);

    const idSpan = document.createElement('span');
    idSpan.className = 'card-id';
    idSpan.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

    const sprite = document.createElement('img');
    sprite.className = 'card-thumb';
    sprite.src = pokemon.sprite;
    sprite.alt = `${pokemon.name} thumbnail`;
    sprite.loading = 'lazy';

    const nameH3 = document.createElement('h3');
    nameH3.className = 'card-name';
    nameH3.textContent = pokemon.name;

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'card-types';
    pokemon.types.forEach((type) => {
      const tag = document.createElement('span');
      tag.className = 'card-type-tag';
      tag.textContent = type;
      tag.style.backgroundColor = getTypeColor(type);
      tagsDiv.appendChild(tag);
    });

    card.appendChild(idSpan);
    card.appendChild(sprite);
    card.appendChild(nameH3);
    card.appendChild(tagsDiv);

    elements.pokemonGrid.appendChild(card);
  });
}
