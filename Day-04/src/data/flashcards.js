/**
 * Day 2 JavaScript Flashcards Dataset Rebuilt for Day 4 React Basics.
 * Proves list reconciliation and imperative vs declarative comparison.
 */
export const initialFlashcards = [
  {
    id: 'fc-01',
    front: 'What is the primary difference between let and const in JavaScript?',
    back: 'let allows variable reassignment, whereas const creates an immutable binding that cannot be reassigned (though objects/arrays assigned to const remain mutable).',
    category: 'Variables',
    mastered: false,
  },
  {
    id: 'fc-02',
    front: 'What does typeof null evaluate to and why?',
    back: '"object" - This is an acknowledged historical bug in JavaScript 1995 where object type tags were 000, and null was represented as a NULL pointer (0x00).',
    category: 'Types',
    mastered: true,
  },
  {
    id: 'fc-03',
    front: 'How does == (loose equality) differ from === (strict equality)?',
    back: '== performs type coercion before comparison (e.g. 0 == "0" is true), while === checks both type and value without coercion (0 === "0" is false).',
    category: 'Operators',
    mastered: false,
  },
  {
    id: 'fc-04',
    front: 'Why should you never sort numbers using .sort() without a comparator?',
    back: 'Default .sort() converts elements to strings and compares UTF-16 code units ("130" comes before "44"). Always provide (a, b) => a - b.',
    category: 'Array Methods',
    mastered: true,
  },
  {
    id: 'fc-05',
    front: 'What is the Temporal Dead Zone (TDZ)?',
    back: 'The span between entering scope where a let/const variable is hoisted and where its declaration is evaluated. Accessing it earlier throws ReferenceError.',
    category: 'Scope',
    mastered: false,
  },
  {
    id: 'fc-06',
    front: 'How does Imperative DOM differ from Declarative React?',
    back: 'Imperative tells the browser step-by-step HOW to manipulate nodes (document.createElement, appendChild). Declarative describes WHAT the UI should look like for a given state (UI = f(state)).',
    category: 'React vs Vanilla',
    mastered: false,
  },
];

export default initialFlashcards;
