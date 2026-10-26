# JavaScript Mastery Flashcards (`projects/flashcards`)

Linkific Internship Training · Day 2  
**Owner:** Ronit Ahuja  
**Tech:** Vanilla JavaScript (ES2020+), ES Modules, HTML5, CSS3, `localStorage`

---

## 1. Overview & How to Run

An interactive, keyboard-accessible flashcards application designed for studying JavaScript fundamentals, scope rules, array mechanics, and ES6+ features.

### How to Run Locally
Because this project utilizes standard browser ES Modules (`type="module"`), it must be served via a local web server:
```bash
# Option 1: Using npx serve from Day-02 root
npx serve .

# Option 2: Using VS Code Live Server extension
# Right click projects/flashcards/index.html -> "Open with Live Server"
```
Direct URL in browser: `http://localhost:5500/projects/flashcards/index.html` (or port 3000 for `npx serve`).

---

## 2. Implemented Features

### Must Requirements (All Implemented)
- **FC-1: 12 Core Starter Flashcards** on JavaScript fundamentals, hoisting, closures, event delegation, strict equality, and data types.
- **FC-2: Single Card Viewer & Flip:** Interactive 3D flip card revealing question and answer with accessible button and smooth CSS transform.
- **FC-3: Immutable Mastery Toggle:** Toggle cards between "To Learn" and "Mastered" without mutating state.
- **FC-4: Study Filters & Counts:** Instant filtering by "All", "To Learn", and "Mastered", with live badge counters and empty state notifications.
- **FC-5: Uniform Fisher–Yates Shuffle:** True $O(n)$ unbiased permutation on a copied array (`[...deck]`), with a "Reset Order" feature to restore original sequence.
- **FC-6: Add & Delete Cards:** Form validation for custom flashcards; immutable addition and deletion.
- **FC-7: Persistent Storage with Safe Fallback:** Deck state automatically saved to `localStorage` under `day2.flashcards.v1`. "Reset Deck" restores default cards.

### Should & Usability Enhancements
- **FC-8: Mastery Progress Tracker:** Live progress bar with "X of Y cards mastered (Z%)" and congratulatory banner when all cards are mastered (`every`).
- **FC-9: Keyboard Shortcuts:**
  - <kbd>Space</kbd>: Flip card
  - <kbd>&larr;</kbd> (Left Arrow): Previous card
  - <kbd>&rarr;</kbd> (Right Arrow): Next card
  *(Disabled automatically when typing inside form inputs).*

---

## 3. Architecture & Concepts Demonstrated

```
projects/flashcards/
├── index.html        # Semantic HTML5 layout, accessible ARIA landmarks
├── style.css         # CSS custom properties, responsive 3D flip transform
├── README.md         # Project documentation & usage
└── js/
    ├── main.js       # App controller: state, event listeners, keyboard handlers
    ├── deck.js       # Pure business logic: create, filter, shuffle, progress
    ├── storage.js    # Resilient localStorage wrapper with try/catch
    └── ui.js         # DOM updates with strict textContent XSS protection
```

| Concept | Location | Implementation Detail |
|---|---|---|
| **ES Modules** | `js/*.js` | `import` and `export` separation across 4 dedicated modules |
| **Object Shorthand & Defaults** | `deck.js:101` | `createCard(front = '', back = '')` returning `{ id, front, back, known }` |
| **Immutable Updates** | `deck.js:124` | `deck.map(card => card.id === id ? { ...card, known: !card.known } : card)` |
| **Fisher–Yates Shuffle** | `deck.js:154` | Unbiased random swap loop on `[...deck]` |
| **Array Methods** | `deck.js` | `filter`, `every`, `map` for deck manipulation and progress metrics |
| **XSS Prevention** | `ui.js:98` | User content rendered exclusively through `textContent` |

---

## 4. Verification Evidence
- **Starter Deck Count:** Verified 12 cards in starter deck.
- **Fisher–Yates Check:** No biased `Math.random() - 0.5` sort used.
- **Browser Tested:** Fully keyboard operable, zero console errors, responsive across mobile, tablet, and desktop viewports.
