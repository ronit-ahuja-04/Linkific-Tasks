/**
 * script.js - Typing Speed Test Engine
 * Classic JavaScript script demonstrating setInterval timers, input events,
 * live character-level feedback, switch statements, and formula metrics.
 */

// ============================================================================
// 1. Text Passages Dataset (TT-1: 12 Original Texts across 3 Difficulties)
// ============================================================================
const PASSAGES = {
  easy: [
    'Clean code always looks like it was written by someone who cares.',
    'JavaScript is a dynamic programming language used for modern web applications.',
    'Functions are the basic building blocks of any modular JavaScript codebase.',
    'HTML provides semantic structure while CSS styles every visual element on the screen.',
  ],
  medium: [
    'In modern JavaScript, const prevents reassignment while let allows block-scoped mutation.',
    'Higher order functions like map, filter, and reduce enable elegant functional pipelines.',
    'Event delegation attaches a single event listener to a common parent element for efficiency.',
    'Promises provide a structured asynchronous foundation with then, catch, and finally handlers.',
  ],
  hard: [
    'The Temporal Dead Zone occurs between entering scope and executing let or const declarations.',
    'Fisher-Yates shuffle produces uniform permutations in O(n) time without statistical bias.',
    'Destructuring extracts nested properties and default parameters safeguard against undefined inputs.',
    'Strict equality triple-equals prevents implicit coercion gotchas like zero matching false.',
  ],
};

const STORAGE_KEY_BEST = 'day2.typing.best.v1';

// Application State
const state = {
  difficulty: 'medium',
  durationLimit: 30, // 30 or 60 seconds
  targetText: '',
  elapsedSeconds: 0,
  timerId: null,
  hasStarted: false,
  isFinished: false,
  bestWpm: { easy: 0, medium: 0, hard: 0 },
};

// DOM Elements Cache
const elements = {
  difficultySelect: document.getElementById('difficulty-select'),
  durationRadios: document.querySelectorAll('input[name="duration"]'),
  timerDisplay: document.getElementById('timer-display'),
  wpmDisplay: document.getElementById('wpm-display'),
  accuracyDisplay: document.getElementById('accuracy-display'),
  errorsDisplay: document.getElementById('errors-display'),
  bestWpmBadge: document.getElementById('best-wpm-badge'),
  textDisplay: document.getElementById('text-display'),
  typingInput: document.getElementById('typing-input'),
  btnRestart: document.getElementById('btn-restart'),
  resultsSummary: document.getElementById('results-summary'),
};

/**
 * Loads best WPM scores from localStorage.
 */
function loadBestScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BEST);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.bestWpm = { ...state.bestWpm, ...parsed };
    }
  } catch (err) {
    console.warn('[typing-test] Failed to load best scores:', err);
  }
}

/**
 * Saves best WPM scores to localStorage.
 */
function saveBestScores() {
  try {
    localStorage.setItem(STORAGE_KEY_BEST, JSON.stringify(state.bestWpm));
  } catch (err) {
    console.error('[typing-test] Failed to save best scores:', err);
  }
}

/**
 * Selects a random passage for the current difficulty using switch.
 * @param {'easy' | 'medium' | 'hard'} difficulty
 * @returns {string}
 */
// CONCEPT: switch
function pickPassage(difficulty) {
  let pool;

  switch (difficulty) {
    case 'easy':
      pool = PASSAGES.easy;
      break;
    case 'hard':
      pool = PASSAGES.hard;
      break;
    case 'medium':
    default:
      pool = PASSAGES.medium;
      break;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Renders the target passage character by character inside span elements.
 * @param {string} text
 */
// CONCEPT: map
function renderCharacterSpans(text) {
  elements.textDisplay.replaceChildren();

  const spans = text.split('').map((char, index) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.className = 'char pending';
    if (index === 0) {
      span.classList.add('current');
    }
    return span;
  });

  spans.forEach((span) => elements.textDisplay.appendChild(span));
}

/**
 * Resets the typing test back to fresh idle state.
 */
function resetTest() {
  // Clear any active interval timer
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  state.hasStarted = false;
  state.isFinished = false;
  state.elapsedSeconds = 0;

  // Retrieve duration limit
  const selectedDuration = document.querySelector('input[name="duration"]:checked');
  state.durationLimit = selectedDuration ? parseInt(selectedDuration.value, 10) : 30;

  // Pick new passage
  state.targetText = pickPassage(state.difficulty);
  renderCharacterSpans(state.targetText);

  // Reset inputs and metrics
  elements.typingInput.value = '';
  elements.typingInput.disabled = false;
  elements.timerDisplay.textContent = `${state.durationLimit}s`;
  elements.wpmDisplay.textContent = '0';
  elements.accuracyDisplay.textContent = '100%';
  elements.errorsDisplay.textContent = '0';

  // Update best WPM display for current difficulty
  const currentBest = state.bestWpm[state.difficulty] ?? 0;
  elements.bestWpmBadge.textContent = `Best WPM (${state.difficulty}): ${currentBest}`;

  elements.resultsSummary.hidden = true;
  elements.resultsSummary.textContent = '';
  elements.typingInput.focus();
}

/**
 * Starts the countdown timer on the very first keystroke.
 */
// CONCEPT: callbacks
function startTimer() {
  if (state.hasStarted) return;
  state.hasStarted = true;

  state.timerId = setInterval(() => {
    state.elapsedSeconds++;
    const remainingTime = Math.max(0, state.durationLimit - state.elapsedSeconds);
    elements.timerDisplay.textContent = `${remainingTime}s`;

    // Recalculate live stats
    evaluateInput();

    if (remainingTime <= 0) {
      finishTest('Time expired!');
    }
  }, 1000);
}

/**
 * Computes typing speed (WPM), accuracy, and error counts based on typed characters.
 * @returns {{ grossWpm: number, netWpm: number, accuracy: number, errors: number, isComplete: boolean }}
 */
function computeMetrics(typedText, targetText, elapsedSec) {
  const effectiveSeconds = Math.max(1, elapsedSec);
  const minutes = effectiveSeconds / 60;

  let correctCount = 0;
  let errorCount = 0;

  const totalTyped = typedText.length;

  for (let i = 0; i < totalTyped; i++) {
    if (typedText[i] === targetText[i]) {
      correctCount++;
    } else {
      errorCount++;
    }
  }

  // 1 standard word = 5 characters
  const grossWpm = Math.round((totalTyped / 5) / minutes);
  const uncorrectedErrors = errorCount;
  const netWpm = Math.max(0, Math.round(((totalTyped - uncorrectedErrors) / 5) / minutes));
  const accuracy = totalTyped > 0 ? Math.round((correctCount / totalTyped) * 100) : 100;
  const isComplete = totalTyped >= targetText.length;

  return { grossWpm, netWpm, accuracy, errors: errorCount, isComplete };
}

/**
 * Evaluates the current input and updates character highlight classes.
 */
// CONCEPT: classList
function evaluateInput() {
  const typed = elements.typingInput.value;
  const target = state.targetText;
  const charSpans = elements.textDisplay.querySelectorAll('.char');

  let errors = 0;

  // Live per-character status
  charSpans.forEach((span, index) => {
    span.classList.remove('correct', 'incorrect', 'current');

    if (index < typed.length) {
      if (typed[index] === target[index]) {
        span.classList.add('correct');
      } else {
        span.classList.add('incorrect');
        errors++;
      }
    } else if (index === typed.length) {
      span.classList.add('current');
    } else {
      span.classList.add('pending');
    }
  });

  const metrics = computeMetrics(typed, target, state.elapsedSeconds);

  elements.wpmDisplay.textContent = String(metrics.netWpm);
  elements.accuracyDisplay.textContent = `${metrics.accuracy}%`;
  elements.errorsDisplay.textContent = String(metrics.errors);

  // If user completed typing the full text passage
  if (metrics.isComplete && !state.isFinished) {
    finishTest('Passage completed successfully!');
  }
}

/**
 * Concludes the test, halts the timer, and announces results in aria-live.
 * @param {string} reason
 */
function finishTest(reason) {
  if (state.isFinished) return;
  state.isFinished = true;

  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  elements.typingInput.disabled = true;

  const typed = elements.typingInput.value;
  const metrics = computeMetrics(typed, state.targetText, Math.max(1, state.elapsedSeconds));

  // Check and update best score
  const previousBest = state.bestWpm[state.difficulty] ?? 0;
  let isNewBest = false;
  if (metrics.netWpm > previousBest) {
    state.bestWpm[state.difficulty] = metrics.netWpm;
    saveBestScores();
    isNewBest = true;
    elements.bestWpmBadge.textContent = `Best WPM (${state.difficulty}): ${metrics.netWpm} [New Record]`;
  }

  // Announce in accessible aria-live region
  const summaryText = `${reason} Result: ${metrics.netWpm} WPM (Net), ${metrics.accuracy}% accuracy, ${metrics.errors} errors in ${state.elapsedSeconds} seconds.${isNewBest ? ' You set a new personal record!' : ''}`;
  elements.resultsSummary.textContent = summaryText;
  elements.resultsSummary.hidden = false;
}

/**
 * Initializes application events.
 */
function init() {
  loadBestScores();

  // Change difficulty
  elements.difficultySelect.addEventListener('change', (e) => {
    state.difficulty = e.target.value;
    resetTest();
  });

  // Change duration
  elements.durationRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      resetTest();
    });
  });

  // Typing input listener
  // Starts timer only on the first keystroke
  elements.typingInput.addEventListener('input', () => {
    if (!state.hasStarted && elements.typingInput.value.length > 0) {
      startTimer();
    }
    evaluateInput();
  });

  // TT-8: Block pasting into typing input
  elements.typingInput.addEventListener('paste', (event) => {
    event.preventDefault();
  });

  // Restart Button
  elements.btnRestart.addEventListener('click', resetTest);

  // Initial setup
  resetTest();
}

// Start on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
