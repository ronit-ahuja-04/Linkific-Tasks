# Daily Habit Tracker with Streaks (`projects/habit-tracker`)

Linkific Internship Training · Day 2  
**Owner:** Ronit Ahuja  
**Tech:** Vanilla JavaScript (ES2020+), ES Modules, HTML5, CSS3, `localStorage`

---

## 1. Overview & How to Run

An interactive habit tracker application demonstrating daily consistency tracking, local calendar date arithmetic, current and longest streak calculations, and performance analytics.

### How to Run Locally
Because this project utilizes standard browser ES Modules (`type="module"`), it must be served via a local web server:
```bash
# Option 1: Using npx serve from Day-02 root
npx serve .

# Option 2: Using VS Code Live Server extension
# Right click projects/habit-tracker/index.html -> "Open with Live Server"
```
Direct URL in browser: `http://localhost:5500/projects/habit-tracker/index.html` (or port 3000 for `npx serve`).

---

## 2. Implemented Features

### Must Requirements (All Implemented)
- **HT-1: Add Habit with Strict Validation:** Habit names trimmed, 1–40 characters validated, and case-insensitive duplicates (e.g. `Read` vs `read`) rejected with a visible status alert.
- **HT-2: Toggle Done Today:** Click to mark done or uncheck for today; state returns smoothly.
- **HT-3: Current & Longest Streak Engine:**
  - *Current Streak:* Consecutive days ending today. If today is unchecked, counts backwards from yesterday (streak remains alive until day ends).
  - *Longest Streak:* Highest historical consecutive day run in the habit's timeline.
  - *Gap Handling:* A missing day resets the current streak to 0.
- **HT-4: Delete Habit:** Single-click deletion with immutable state filtering; stays deleted on reload.
- **HT-5: Resilient Storage:** Stored in `localStorage` under `day2.habits.v1`. Corrupted data or missing keys fall back to defaults gracefully without crashing.
- **HT-6: Strictly Local Dates:** Local `YYYY-MM-DD` formatting using `getFullYear()`, `getMonth()`, `getDate()`. Never uses UTC `toISOString()`.

### Should & Analytics Enhancements
- **HT-7: Performance Analytics Panel:**
  - Total lifetime check-ins across all habits (`reduce`).
  - Active habits counter.
  - Habits ranked by current active streak (`sort`).
  - Recent daily activity breakdown table with `Object.entries`.
  - Top active date detection using `for...in`.
- **HT-8: Last 7 Days Mini-Grid:** Visual 7-day dot trail on each card showing completion history at a glance.

---

## 3. Architecture & Concepts Demonstrated

```
projects/habit-tracker/
├── index.html        # Semantic HTML5 layout, ARIA status regions
├── style.css         # CSS custom properties, responsive 2-column grid
├── README.md         # Project documentation & streak logic breakdown
└── js/
    ├── main.js       # App controller: state, event delegation, persistence
    ├── dates.js      # Pure local date arithmetic (toDateKey, addDays, getLastNDays)
    ├── streaks.js    # Pure streak algorithms (getCurrentStreak, getLongestStreak)
    ├── state.js      # Pure state modifiers (addHabit, toggleCheckIn, deleteHabit)
    ├── stats.js      # Pure metrics & aggregations (reduce, rankByStreak, checkInsByDate)
    ├── storage.js    # Resilient localStorage wrapper with try/catch
    └── ui.js         # DOM updates using createElement and strict textContent
```

| Concept | Location | Implementation Detail |
|---|---|---|
| **Event Delegation** | `main.js:98` | Single parent listener on `habit-list` handling all toggles and deletes via `closest('[data-action]')` |
| **Local Dates (No UTC)** | `dates.js:14` | Local `YYYY-MM-DD` string generation avoiding timezone shifts |
| **Streak Engine (`while`)** | `streaks.js:33` | Backward day cursor traversal using `while (daysSet.has(cursor))` |
| **Longest Streak (`for...of`)** | `streaks.js:68` | Sorted date iteration tracking runs of consecutive calendar days |
| **Immutable Updates** | `state.js:52` | `map`, `filter`, and object spread (`{ ...habit, checkIns }`) |
| **Aggregations (`reduce`)** | `stats.js:18` | Total check-ins accumulator and computed property names dictionary |
| **XSS Safety** | `ui.js:51` | Habit names and user data rendered exclusively through `textContent` |

---

## 4. Streak Algorithm Breakdown

```
Current Streak (checkIns, today):
  days = Set(checkIns)
  cursor = days.has(today) ? today : addDays(today, -1)
  count = 0
  while days.has(cursor):
    count++
    cursor = addDays(cursor, -1)
  return count
```
