# Day 2 – JavaScript Fundamentals & ES6+

Linkific Internship Training Phase · Month 1 · Day 2  
**Owner:** Ronit Ahuja  
**Date:** Monday, 26 October 2026  

---

## 1. Overview & How to Run

This repository contains learning practice, exercises, and interactive applications demonstrating JavaScript fundamentals, ES6+ features, DOM manipulation, and asynchronous programming.

### Running Practice Scripts
All practice scripts run directly in Node.js (v20+):
```bash
# Fundamentals
node 01-fundamentals/01-variables-and-types.js
node 01-fundamentals/02-operators-conditionals-loops.js
node 01-fundamentals/03-functions.js
node 01-fundamentals/04-es6-features.js

# Array & Object exercises
node 02-array-methods/exercises.js
node 02-array-methods/object-manipulation.js

# Async examples
node 04-async-examples/01-callbacks.js
node 04-async-examples/02-promises.js
node 04-async-examples/03-async-await.js
node 04-async-examples/04-fetch-api.js
node 04-async-examples/05-error-handling.js
```

### Running Interactive Web Applications
Because ES modules (`type="module"`) are used, browser projects must be served via a local HTTP server:
- Open folder in VS Code and start **Live Server** (default port `5500`), or
- Run `npx serve .` inside `Day-02/`.

Projects hub: `projects/index.html`

---

## 2. Concept → Where I Used It

*(To be populated from `// CONCEPT:` markers as milestones are implemented)*

| Task Concept | File & Line | Description / Context |
|---|---|---|
| *(Pending milestone implementations)* | | |

---

## 3. Projects

### 3.1 Habit Tracker with Streaks (`projects/habit-tracker`)
- **Status:** Scaffolding ready (M0)
- **Key Concepts:** ES Modules, local date arithmetic (`YYYY-MM-DD`), streak calculations (`while`, `Set`), immutability, `localStorage` wrapper.

### 3.2 Typing Speed Test (`projects/typing-test`)
- **Status:** Scaffolding ready (M0)
- **Key Concepts:** Timers (`setInterval`), `input` events, live character validation (`classList`), `switch` difficulty selection.

### 3.3 Pokédex Search (`projects/pokedex`)
- **Status:** Scaffolding ready (M0)
- **Key Concepts:** Promises (`.then/.catch/.finally`), `async/await`, `fetch`, `Promise.all`, in-memory `Map` cache, PokeAPI.

### 3.4 Flashcards (`projects/flashcards`)
- **Status:** Scaffolding ready (M0)
- **Key Concepts:** Immutable state updates, Fisher–Yates shuffle, filtering (`known`/`unknown`), keyboard navigation, `localStorage`.

---

## 4. What I Learned
*(Reflections and lessons learned will be recorded here at milestone completion)*

---

## 5. Tools & Methodology
- Planning and specifications: BMAD workflow (`PRD.md`, `ARCHITECTURE.md`, `SUCCESS_MATRIX.md`, `GUIDELINES.md`).
- Coding style: Vanilla JavaScript (ES2020+), CSS custom properties, semantic HTML5, zero build tools.
- Pair programming mentor: AI assistant in strict Teaching Mode with incremental checkpoints.
