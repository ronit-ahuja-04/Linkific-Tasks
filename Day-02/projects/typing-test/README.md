# Developer Typing Speed Test (`projects/typing-test`)

Frontend JavaScript Applications · Portfolio Project  
**Owner:** Ronit Ahuja  
**Tech:** Vanilla JavaScript (ES2020+), HTML5, CSS3, `localStorage`

---

## 1. Overview & How to Run

An interactive, responsive typing speed test designed for software developers, featuring technical JavaScript passages, selectable difficulty tiers, real-time character-level accuracy highlighting, countdown timers, and persistent personal records.

### How to Run Locally
Typing Test uses classic script inclusion (`<script src="script.js"></script>`) and can be opened directly or via a local HTTP server:
```bash
# Option 1: Using npx serve from Day-02 root
npx serve .

# Option 2: Live Server in VS Code
# Right click projects/typing-test/index.html -> "Open with Live Server"
```
Direct URL in browser: `http://localhost:5500/projects/typing-test/index.html` (or port 3000 for `npx serve`).

---

## 2. Implemented Features

### Must Requirements (All Implemented)
- **TT-1: 12 Original Technical Passages:** 4 easy, 4 medium, and 4 hard technical passages authored specifically around JavaScript fundamentals, ES6+ features, and browser mechanics.
- **TT-2: First-Keystroke Interval Timer:** Timer does NOT begin on page load; it triggers strictly on the user's first input keystroke. Selectable between 30 s and 60 s. Interval is safely cleared on finish or restart.
- **TT-3: Real-Time Character Feedback:** Live feedback per character using `classList`:
  - `pending`: Unreached characters.
  - `current`: The active character highlighted with background and cursor underline.
  - `correct`: Green character on exact match.
  - `incorrect`: Red character with underline on typo.
- **TT-4: Accurate Metric Calculation:** Computes Net WPM (penalizing uncorrected errors), Accuracy %, and total error counts.
- **TT-5: Complete Restart Cycle:** Restarts cleanly mid-test or post-test, clearing timers, resetting inputs, and picking a new passage.
- **TT-6: Switch-Based Difficulty Engine:** Selection between easy, medium, and hard pools executed using a clean `switch` control statement.

### Should & Usability Enhancements
- **TT-7: Best WPM Persisted:** Best Net WPM score per difficulty tier persisted to `localStorage` under `day2.typing.best.v1`.
- **TT-8: Anti-Cheat & Accessibility:**
  - Clipboard paste blocked on the typing textarea (`event.preventDefault()`).
  - Final results announced through an `aria-live="polite"` region.

---

## 3. Metrics & Formulas

- **Standard Word Length:** 5 characters (including spaces and punctuation).
- **Elapsed Time:** Measured in elapsed seconds, clamped to a minimum of 1 second to prevent division by zero.
- **Gross WPM:**
  $$\text{Gross WPM} = \frac{\text{Total Characters Typed} / 5}{\text{Elapsed Seconds} / 60}$$
- **Net WPM (Speed with Accuracy Penalty):**
  $$\text{Net WPM} = \max\left(0, \frac{(\text{Total Characters Typed} - \text{Uncorrected Errors}) / 5}{\text{Elapsed Seconds} / 60}\right)$$
- **Accuracy Percentage:**
  $$\text{Accuracy} = \frac{\text{Correct Characters}}{\text{Total Typed Characters}} \times 100$$

---

## 4. Concepts Demonstrated

| Concept | Location | Implementation Detail |
|---|---|---|
| **Timers (`setInterval` / `clearInterval`)** | `script.js:159` | Countdown interval that starts on the first input and halts on zero or reset |
| **`switch` Statement** | `script.js:95` | Difficulty passage selection (`easy`, `medium`, `hard`) |
| **Character Feedback (`classList`)** | `script.js:203` | Live DOM manipulation applying `correct`, `incorrect`, `current` |
| **Event Handling (`input`, `paste`)** | `script.js:283` | First-keystroke detection and paste prevention |
| **Persistence (`localStorage`)** | `script.js:58` | Loading and saving high scores under `day2.typing.best.v1` |
| **Accessibility (`aria-live`)** | `script.js:256` | Live result announcement without visual disruption |
