# Pokédex Explorer (`projects/pokedex`)

Linkific Internship Training · Day 2  
**Owner:** Ronit Ahuja  
**Tech:** Vanilla JavaScript (ES2020+), ES Modules, HTML5, CSS3, PokeAPI

---

## 1. Overview & How to Run

An interactive Pokémon encyclopedia application connecting to the public RESTful PokeAPI. Demonstrates two distinct asynchronous programming paradigms, in-memory caching with ES6 `Map`, and event delegation.

### How to Run Locally
Because this project utilizes standard browser ES Modules (`type="module"`), it must be served via a local web server:
```bash
# Option 1: Using npx serve from Day-02 root
npx serve .

# Option 2: Live Server in VS Code
# Right click projects/pokedex/index.html -> "Open with Live Server"
```
Direct URL in browser: `http://localhost:5500/projects/pokedex/index.html` (or port 3000 for `npx serve`).

---

## 2. Implemented Features

### Must Requirements (All Implemented)
- **PK-1: Search by Name or Numeric ID:** Supports search queries like `pikachu`, `Pikachu `, or `25`. Renders sprite, name, ID badge, types, height (m), weight (kg), and base stats.
- **PK-2: Five Visible Application States:**
  - `idle`: Default clean view.
  - `loading`: Visual indicator while fetching.
  - `success`: Card successfully rendered.
  - `notFound`: Custom 404 message when query does not match any Pokémon.
  - `error`: Network failure message.
  - Explicit `response.ok` status verification before parsing JSON.
- **PK-3: Browse Grid with Offset Paging (Promise Chains):** Loads 20 Pokémon per batch using a **promise chain** (`.then/.catch/.finally`) and resolves details concurrently with `Promise.all`.
- **PK-4: Search Engine (async / await):** Search path implemented using modern `async/await` and `try/catch/finally` control flow.
- **PK-5: In-Memory `Map` Cache:** Prevents duplicate network requests. Repeated searches or grid clicks resolve instantaneously from local memory.
- **PK-6: Event Delegation on Grid:** Single event listener on `#pokemon-grid` captures clicks on any child card via `event.target.closest('.grid-card')` and displays its full detail card.

### Should & Usability Enhancements
- **PK-7: Type Filter:** Dropdown filtering loaded Pokémon by elemental type (Fire, Water, Grass, Electric, etc.).
- **PK-9: Visual Stat Progress Bars:** Animated progress bars for HP, Attack, Defense, Special Attack, Special Defense, and Speed.
- **PK-10: Sort Options:** Client-side sorting on loaded cards by ID (ascending) or Name (alphabetical A–Z).

---

## 3. Dual Asynchronous Architecture

To demonstrate both core asynchronous styles side-by-side:

```
projects/pokedex/
├── index.html        # Semantic layout, accessible form & regions
├── style.css         # CSS custom properties, responsive auto-fill grid
├── README.md         # Project documentation & async paradigms breakdown
└── js/
    ├── main.js       # App controller: wires the two async flows & event delegation
    ├── api.js        # Pure API layer: Map cache, fetchJson, toPokemonView, endpoints
    └── ui.js         # DOM updates: detail card, base stat bars, type badge colors
```

### 1. Promise Chains (`.then/.catch/.finally`) & `Promise.all`
Used exclusively for browsing and pagination (`loadMorePokemon()`):
```javascript
getPokemonPage(state.offset, 20)
  .then(results => Promise.all(results.map(item => getPokemon(item.name))))
  .then(newDetails => {
    state.list = [...state.list, ...newDetails];
    state.offset += 20;
    updateGridView();
  })
  .catch(showError)
  .finally(hideLoader);
```

### 2. `async / await` & `try / catch / finally`
Used exclusively for single Pokémon search lookups (`handleSearch(query)`):
```javascript
async function handleSearch(query) {
  renderState('loading');
  try {
    const pokemon = await getPokemon(query);
    renderDetailCard(pokemon);
    renderState('success');
  } catch (err) {
    renderState(err.status === 404 ? 'notFound' : 'error');
  } finally {
    enableSearchButton();
  }
}
```

---

## 4. Verification Evidence
- **Network Cache:** Verified via DevTools Network tab that searching `pikachu` twice triggers only 1 network request.
- **Error Handling:** Verified that typing non-existent names (e.g. `fakepokemon123`) intercepts 404 status via `response.ok` without crashing.
- **Accessibility:** Semantic headings, `aria-live` state banner, labels on all interactive elements.
