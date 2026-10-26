/**
 * ui.js - Flashcards DOM Rendering & UI Updates
 * Strict DOM separation: Pure state in, DOM updates out.
 * User content is rendered strictly via textContent.
 */

/**
 * Elements cache
 */
export const elements = {
  cardContainer: document.getElementById('card-container'),
  cardFrontText: document.getElementById('card-front-text'),
  cardBackText: document.getElementById('card-back-text'),
  cardCategoryBadge: document.getElementById('card-category-badge'),
  cardKnownStatusBadge: document.getElementById('card-known-status-badge'),
  cardCounter: document.getElementById('card-counter'),
  progressBar: document.getElementById('progress-bar-fill'),
  progressText: document.getElementById('progress-text'),
  progressCongrats: document.getElementById('progress-congrats'),
  statusMessage: document.getElementById('status-message'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  btnFlip: document.getElementById('btn-flip'),
  btnToggleKnown: document.getElementById('btn-toggle-known'),
  btnDeleteCard: document.getElementById('btn-delete-card'),
  btnShuffle: document.getElementById('btn-shuffle'),
  btnResetOrder: document.getElementById('btn-reset-order'),
  btnResetDeck: document.getElementById('btn-reset-deck'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  filterCountAll: document.getElementById('count-all'),
  filterCountKnown: document.getElementById('count-known'),
  filterCountUnknown: document.getElementById('count-unknown'),
  emptyState: document.getElementById('empty-state'),
  cardViewer: document.getElementById('card-viewer'),
  addCardForm: document.getElementById('add-card-form'),
  frontInput: document.getElementById('card-front-input'),
  backInput: document.getElementById('card-back-input'),
};

/**
 * Renders the entire flashcard application view from state.
 * @param {object} state
 * @param {Array<object>} visibleDeck - Deck after current filter is applied
 * @param {{ known: number, total: number, allKnown: boolean }} progress
 */
export function render(state, visibleDeck, progress) {
  // 1. Update filter counts
  const allCount = state.deck.length;
  const knownCount = progress.known;
  const unknownCount = allCount - knownCount;

  elements.filterCountAll.textContent = String(allCount);
  elements.filterCountKnown.textContent = String(knownCount);
  elements.filterCountUnknown.textContent = String(unknownCount);

  // Update active tab class
  elements.filterTabs.forEach((tab) => {
    const filterType = tab.getAttribute('data-filter');
    const isActive = filterType === state.filter;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // 2. Update progress bar
  const percent = progress.total > 0 ? Math.round((progress.known / progress.total) * 100) : 0;
  elements.progressBar.style.width = `${percent}%`;
  elements.progressText.textContent = `${progress.known} of ${progress.total} cards mastered (${percent}%)`;

  // All known banner
  if (progress.allKnown && progress.total > 0) {
    elements.progressCongrats.hidden = false;
    elements.progressCongrats.textContent = 'Session complete: 100% of cards in this deck are mastered.';
  } else {
    elements.progressCongrats.hidden = true;
  }

  // 3. Handle empty state vs visible card
  if (visibleDeck.length === 0) {
    elements.cardViewer.hidden = true;
    elements.emptyState.hidden = false;
    let emptyMsg = 'No flashcards available in this view.';
    if (state.filter === 'known') {
      emptyMsg = 'You have not marked any cards as mastered yet. Switch to "All" or "To Learn" to practice!';
    } else if (state.filter === 'unknown') {
      emptyMsg = 'No unmastered cards remaining! Great work.';
    }
    elements.emptyState.textContent = emptyMsg;
    return;
  }

  elements.cardViewer.hidden = false;
  elements.emptyState.hidden = true;

  // 4. Clamped active card
  const currentIndex = Math.min(state.index, visibleDeck.length - 1);
  const currentCard = visibleDeck[currentIndex];

  // Set counter text
  elements.cardCounter.textContent = `Card ${currentIndex + 1} of ${visibleDeck.length}`;

  // Set card contents safely using textContent
  elements.cardFrontText.textContent = currentCard.front;
  elements.cardBackText.textContent = currentCard.back;

  // Set known status badge
  if (currentCard.known) {
    elements.cardKnownStatusBadge.textContent = 'Mastered';
    elements.cardKnownStatusBadge.className = 'status-badge badge-mastered';
    elements.btnToggleKnown.textContent = 'Mark as To Learn';
    elements.btnToggleKnown.className = 'btn btn-outline-warning';
  } else {
    elements.cardKnownStatusBadge.textContent = 'To Learn';
    elements.cardKnownStatusBadge.className = 'status-badge badge-to-learn';
    elements.btnToggleKnown.textContent = 'Mark as Mastered';
    elements.btnToggleKnown.className = 'btn btn-success';
  }

  // Flip state on card container
  elements.cardContainer.classList.toggle('is-flipped', state.flipped);
  elements.btnFlip.textContent = state.flipped ? 'Show Question' : 'Flip to Answer';

  // Navigation button states
  elements.btnPrev.disabled = currentIndex === 0;
  elements.btnNext.disabled = currentIndex === visibleDeck.length - 1;
}

/**
 * Displays a transient message in the live status container.
 * @param {string} msg
 * @param {'info' | 'success' | 'error'} [type='info']
 */
export function showNotification(msg, type = 'info') {
  elements.statusMessage.textContent = msg;
  elements.statusMessage.className = `status-banner status-${type}`;
  elements.statusMessage.hidden = false;

  // Clear notification after 4 seconds
  clearTimeout(elements.statusMessage._timer);
  elements.statusMessage._timer = setTimeout(() => {
    elements.statusMessage.hidden = true;
    elements.statusMessage.textContent = '';
  }, 4000);
}
