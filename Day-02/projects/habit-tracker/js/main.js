/**
 * main.js - Application Controller for Habit Tracker
 * Wires up state, event delegation, safe storage, and rendering.
 */

// CONCEPT: event-delegation

import { toDateKey, addDays } from './dates.js';
import { addHabit, toggleCheckIn, deleteHabit } from './state.js';
import { loadFromStorage, saveToStorage, clearStorageKey } from './storage.js';
import { elements, renderHabits, renderStats, showValidation } from './ui.js';

// Default starter habits for first-time visitors
const STARTER_HABITS = [
  {
    id: 'h_seed_1',
    name: 'Code for 45 minutes',
    createdAt: addDays(toDateKey(), -6),
    checkIns: [
      addDays(toDateKey(), -4),
      addDays(toDateKey(), -3),
      addDays(toDateKey(), -2),
      addDays(toDateKey(), -1),
      toDateKey(),
    ],
  },
  {
    id: 'h_seed_2',
    name: 'Read technical docs',
    createdAt: addDays(toDateKey(), -5),
    checkIns: [addDays(toDateKey(), -2), addDays(toDateKey(), -1)],
  },
  {
    id: 'h_seed_3',
    name: 'Drink 2L water',
    createdAt: addDays(toDateKey(), -3),
    checkIns: [addDays(toDateKey(), -1), toDateKey()],
  },
];

const state = {
  habits: [],
  todayKey: toDateKey(),
};

/**
 * Persists current habits state and updates both habit cards and stats.
 */
function updateViewAndPersist() {
  saveToStorage(undefined, state.habits);
  renderHabits(state.habits, state.todayKey);
  renderStats(state.habits, state.todayKey);
}

/**
 * Initializes state from localStorage or seeds.
 */
function init() {
  const stored = loadFromStorage(undefined, null);
  if (Array.isArray(stored) && stored.length > 0) {
    state.habits = stored;
  } else {
    state.habits = [...STARTER_HABITS];
    saveToStorage(undefined, state.habits);
  }

  updateViewAndPersist();
  setupEventListeners();
}

/**
 * Registers user interaction listeners.
 */
function setupEventListeners() {
  // Add Habit Form
  elements.addHabitForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const rawName = elements.habitNameInput.value;

    const { habits, error } = addHabit(state.habits, rawName);

    if (error) {
      showValidation(error, true);
      return;
    }

    showValidation(null);
    state.habits = habits;
    elements.habitNameInput.value = '';
    updateViewAndPersist();
  });

  // Event Delegation on Habit Cards List
  // A single listener captures both toggle and delete clicks across all habit cards
  elements.habitList.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    const card = event.target.closest('[data-id]');
    if (!card) return;

    const habitId = card.getAttribute('data-id');
    const action = actionBtn.getAttribute('data-action');

    if (action === 'toggle') {
      state.habits = toggleCheckIn(state.habits, habitId, state.todayKey);
      updateViewAndPersist();
    } else if (action === 'delete') {
      state.habits = deleteHabit(state.habits, habitId);
      updateViewAndPersist();
    }
  });

  // Reset All Data
  if (elements.btnResetAll) {
    elements.btnResetAll.addEventListener('click', () => {
      const confirmed = window.confirm('Are you sure you want to reset all habit data back to defaults?');
      if (confirmed) {
        clearStorageKey();
        state.habits = [...STARTER_HABITS];
        showValidation('All habit data reset to defaults.', false);
        updateViewAndPersist();
      }
    });
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
