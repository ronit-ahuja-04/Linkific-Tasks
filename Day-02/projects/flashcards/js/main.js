/**
 * main.js - Application Entry & Controller for Flashcards
 * Ties pure deck logic, safe localStorage wrapper, and UI rendering together.
 */

import {
  STARTER_DECK,
  createCard,
  toggleKnown,
  filterDeck,
  shuffle,
  getProgress,
  removeCard,
} from './deck.js';
import { loadFromStorage, saveToStorage } from './storage.js';
import { elements, render, showNotification } from './ui.js';

// Application State
const state = {
  deck: [],
  originalOrder: [],
  filter: 'all',
  index: 0,
  flipped: false,
};

/**
 * Gets currently visible cards based on the active filter mode.
 * @returns {Array<object>}
 */
function getVisibleDeck() {
  return filterDeck(state.deck, state.filter);
}

/**
 * Triggers a full UI render based on current state.
 */
function updateView() {
  const visible = getVisibleDeck();
  // Clamp index so it never exceeds visible deck bounds
  if (visible.length > 0 && state.index >= visible.length) {
    state.index = visible.length - 1;
  } else if (state.index < 0) {
    state.index = 0;
  }
  const progress = getProgress(state.deck);
  render(state, visible, progress);
}

/**
 * Persists deck to localStorage and re-renders.
 */
function persistAndRender(message = null, type = 'info') {
  saveToStorage(undefined, state.deck);
  updateView();
  if (message) {
    showNotification(message, type);
  }
}

/**
 * Initializes state from localStorage or STARTER_DECK.
 */
function init() {
  const savedDeck = loadFromStorage(undefined, null);
  if (Array.isArray(savedDeck) && savedDeck.length > 0) {
    state.deck = savedDeck;
  } else {
    state.deck = [...STARTER_DECK];
    saveToStorage(undefined, state.deck);
  }
  state.originalOrder = [...state.deck];
  updateView();
  setupEventListeners();
}

/**
 * Registers DOM and keyboard event handlers.
 */
function setupEventListeners() {
  // Flip card
  elements.btnFlip.addEventListener('click', () => {
    state.flipped = !state.flipped;
    updateView();
  });

  // Clicking on the card itself also flips it
  elements.cardContainer.addEventListener('click', (event) => {
    // Avoid flipping if user clicks on actionable inner elements (if any)
    if (event.target.closest('button')) return;
    state.flipped = !state.flipped;
    updateView();
  });

  // Previous card
  elements.btnPrev.addEventListener('click', () => {
    if (state.index > 0) {
      state.index--;
      state.flipped = false; // Reset flip on navigation
      updateView();
    }
  });

  // Next card
  elements.btnNext.addEventListener('click', () => {
    const visible = getVisibleDeck();
    if (state.index < visible.length - 1) {
      state.index++;
      state.flipped = false;
      updateView();
    }
  });

  // Toggle Known / Mastered
  elements.btnToggleKnown.addEventListener('click', () => {
    const visible = getVisibleDeck();
    const currentCard = visible[state.index];
    if (!currentCard) return;

    state.deck = toggleKnown(state.deck, currentCard.id);
    const updatedStatus = !currentCard.known;
    persistAndRender(
      updatedStatus ? 'Marked card as Mastered!' : 'Moved card to "To Learn".',
      updatedStatus ? 'success' : 'info'
    );
  });

  // Delete Card
  elements.btnDeleteCard.addEventListener('click', () => {
    const visible = getVisibleDeck();
    const currentCard = visible[state.index];
    if (!currentCard) return;

    state.deck = removeCard(state.deck, currentCard.id);
    state.originalOrder = removeCard(state.originalOrder, currentCard.id);
    state.flipped = false;
    persistAndRender('Flashcard deleted.', 'info');
  });

  // Filter Tabs
  elements.filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-filter');
      state.filter = mode;
      state.index = 0;
      state.flipped = false;
      updateView();
    });
  });

  // Shuffle Deck (Fisher–Yates)
  elements.btnShuffle.addEventListener('click', () => {
    state.deck = shuffle(state.deck);
    state.index = 0;
    state.flipped = false;
    updateView();
    showNotification('Deck shuffled uniformly with Fisher–Yates algorithm.', 'info');
  });

  // Reset Order (Restores original sequence)
  elements.btnResetOrder.addEventListener('click', () => {
    // Filter originalOrder to keep only currently existing cards
    const existingIds = new Set(state.deck.map((c) => c.id));
    state.deck = state.originalOrder.filter((c) => existingIds.has(c.id));
    state.index = 0;
    state.flipped = false;
    updateView();
    showNotification('Deck restored to original study order.', 'info');
  });

  // Reset Deck to Starters
  elements.btnResetDeck.addEventListener('click', () => {
    state.deck = [...STARTER_DECK];
    state.originalOrder = [...STARTER_DECK];
    state.index = 0;
    state.filter = 'all';
    state.flipped = false;
    persistAndRender('Reset deck to 12 core JavaScript starter cards.', 'success');
  });

  // Add Card Form Submission
  elements.addCardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const frontText = elements.frontInput.value.trim();
    const backText = elements.backInput.value.trim();

    if (!frontText || !backText) {
      showNotification('Please enter both question and answer text.', 'error');
      return;
    }

    try {
      const newCard = createCard(frontText, backText);
      state.deck = [...state.deck, newCard];
      state.originalOrder = [...state.originalOrder, newCard];
      elements.frontInput.value = '';
      elements.backInput.value = '';
      persistAndRender('New flashcard created successfully!', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  });

  // Keyboard Shortcuts (Space to flip, ArrowLeft for Prev, ArrowRight for Next)
  // CONCEPT: keyboard-navigation
  window.addEventListener('keydown', (event) => {
    // If user is focused inside a form input or textarea, do not intercept
    const activeTagName = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTagName === 'input' || activeTagName === 'textarea') {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault(); // Prevent page scroll
      state.flipped = !state.flipped;
      updateView();
    } else if (event.key === 'ArrowLeft') {
      if (state.index > 0) {
        state.index--;
        state.flipped = false;
        updateView();
      }
    } else if (event.key === 'ArrowRight') {
      const visible = getVisibleDeck();
      if (state.index < visible.length - 1) {
        state.index++;
        state.flipped = false;
        updateView();
      }
    }
  });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
