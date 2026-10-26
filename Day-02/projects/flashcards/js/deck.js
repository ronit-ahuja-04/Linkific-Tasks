/**
 * deck.js - Pure Flashcards Deck Business Logic
 * Zero DOM manipulation. Takes data and returns data.
 */

// CONCEPT: starter-deck
export const STARTER_DECK = [
  {
    id: 'c_1',
    front: 'What is the primary difference between let and const in JavaScript?',
    back: 'let allows variable reassignment, whereas const creates an immutable binding that cannot be reassigned (though objects/arrays assigned to const remain mutable).',
    known: false,
  },
  {
    id: 'c_2',
    front: 'What does typeof null evaluate to and why?',
    back: '"object" - This is an acknowledged historical bug in the first JavaScript engine from 1995 where object type tags were 000, and null was represented as NULL pointer (0x00).',
    known: false,
  },
  {
    id: 'c_3',
    front: 'How does == (loose equality) differ from === (strict equality)?',
    back: '== performs type coercion before comparison (e.g. 0 == "0" is true), while === checks both type and value without coercion (0 === "0" is false).',
    known: false,
  },
  {
    id: 'c_4',
    front: 'Why should you never sort numbers using .sort() without a comparator?',
    back: 'Default .sort() converts elements to strings and compares UTF-16 code points, so "130" comes before "44". Always provide (a, b) => a - b.',
    known: false,
  },
  {
    id: 'c_5',
    front: 'What is the Temporal Dead Zone (TDZ)?',
    back: 'The period between entering the scope where a let/const variable is declared and the point where the declaration is executed. Accessing the variable in this zone throws a ReferenceError.',
    known: false,
  },
  {
    id: 'c_6',
    front: 'What is the difference between null and undefined?',
    back: 'undefined signifies that a variable has been declared but not assigned a value. null is an intentional assignment representing the absence of an object value.',
    known: false,
  },
  {
    id: 'c_7',
    front: 'What is Event Delegation and what is its primary benefit?',
    back: 'Attaching a single event listener to a parent container instead of every child. It handles dynamically added elements automatically and reduces memory usage.',
    known: false,
  },
  {
    id: 'c_8',
    front: 'Why is textContent preferred over innerHTML for user-supplied data?',
    back: 'textContent parses input strictly as plain text, preventing malicious script injection and Cross-Site Scripting (XSS) attacks.',
    known: false,
  },
  {
    id: 'c_9',
    front: 'What does the Fisher–Yates shuffle algorithm achieve?',
    back: 'It produces an unbiased, uniform permutation of an array in O(n) time, avoiding the statistical skew caused by .sort(() => Math.random() - 0.5).',
    known: false,
  },
  {
    id: 'c_10',
    front: 'What is the difference between Promise.all() and Promise.allSettled()?',
    back: 'Promise.all rejects immediately upon the first rejected promise (fail-fast), whereas Promise.allSettled waits for all promises to settle regardless of rejection.',
    known: false,
  },
  {
    id: 'c_11',
    front: 'What does the spread operator (...) do when applied to an object?',
    back: 'It performs a shallow copy of own enumerable properties from one object to a new object, facilitating immutable updates.',
    known: false,
  },
  {
    id: 'c_12',
    front: 'What is the difference between for...of and for...in loops?',
    back: 'for...of iterates over the values of iterable objects (Arrays, Sets, Strings), while for...in iterates over the enumerable keys of an object.',
    known: false,
  },
];

/**
 * Validates and creates a new card object.
 * @param {string} front
 * @param {string} back
 * @returns {{ id: string, front: string, back: string, known: boolean }}
 */
// CONCEPT: object-shorthand
// CONCEPT: default-parameters
export function createCard(front = '', back = '') {
  const trimmedFront = front.trim();
  const trimmedBack = back.trim();

  if (!trimmedFront || !trimmedBack) {
    throw new Error('Both front and back card text are required.');
  }

  const id = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  // Object property shorthand
  return {
    id,
    front: trimmedFront,
    back: trimmedBack,
    known: false,
  };
}

/**
 * Immutably toggles the known flag of a card matching id.
 * @param {Array<object>} deck
 * @param {string} id
 * @returns {Array<object>} New deck array
 */
// CONCEPT: map
// CONCEPT: spread-operator
export function toggleKnown(deck, id) {
  return deck.map((card) => {
    if (card.id === id) {
      return {
        ...card,
        known: !card.known,
      };
    }
    return card;
  });
}

/**
 * Immutably filters deck by study mode.
 * @param {Array<object>} deck
 * @param {'all' | 'known' | 'unknown'} mode
 * @returns {Array<object>} Filtered deck array
 */
// CONCEPT: filter
export function filterDeck(deck, mode = 'all') {
  if (mode === 'known') {
    return deck.filter((card) => card.known);
  }
  if (mode === 'unknown') {
    return deck.filter((card) => !card.known);
  }
  return deck;
}

/**
 * Shuffles a deck using the true Fisher–Yates (Knuth) algorithm on a shallow copy.
 * Never mutates original array and never uses biased Math.random() - 0.5.
 * @param {Array<object>} deck
 * @returns {Array<object>} Shuffled copy of deck
 */
// CONCEPT: fisher-yates-shuffle
export function shuffle(deck) {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Array destructuring swap
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Calculates deck progress using filter and every.
 * @param {Array<object>} deck
 * @returns {{ known: number, total: number, allKnown: boolean }}
 */
// CONCEPT: every
export function getProgress(deck) {
  const total = deck.length;
  if (total === 0) {
    return { known: 0, total: 0, allKnown: false };
  }
  const known = deck.filter((card) => card.known).length;
  const allKnown = deck.every((card) => card.known);

  return { known, total, allKnown };
}

/**
 * Immutably removes a card from deck by id.
 * @param {Array<object>} deck
 * @param {string} id
 * @returns {Array<object>} New deck array without card
 */
export function removeCard(deck, id) {
  return deck.filter((card) => card.id !== id);
}

/**
 * Immutably updates card front/back text.
 * @param {Array<object>} deck
 * @param {string} id
 * @param {string} front
 * @param {string} back
 * @returns {Array<object>}
 */
export function updateCard(deck, id, front, back) {
  return deck.map((card) => {
    if (card.id === id) {
      return {
        ...card,
        front: front.trim(),
        back: back.trim(),
      };
    }
    return card;
  });
}
