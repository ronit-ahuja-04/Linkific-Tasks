# Success Matrix: Day 2 – JavaScript Fundamentals & ES6+

Companion to `PRD.md` and `ARCHITECTURE.md`. This is a self-assessment sheet. It defines what "done" means, how to prove it, and what evidence to show in the standup.

Fill in the **Evidence** and **Status** columns as you go (`☐` not done, `◐` partial, `☑` done). Only mark `☑` after running the verification step.

## 1. Scorecard

| Area | Weight | Score | Notes |
|---|---|---|---|
| T1: Fundamentals and ES6+ practice files | 5 | | |
| D1: Repository hygiene | 5 | | |
| D2: Four projects (10 each) | 40 | | |
| D3: Array and object exercises | 10 | | |
| D4: DOM examples | 7 | | |
| D5: Async examples with API calls | 13 | | |
| D6: README | 10 | | |
| P: Process and standup | 10 | | |
| **Total** | **100** | | |

**Ready to present as complete:** every P0 item below is `☑` and the total is at least 85.
**Below 85:** present honestly as partial, say what is missing and when it will be finished.

## 2. Criteria by area

P0 = must pass for the day to count as complete.

### T1: Fundamentals and ES6+ (5)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| T1-1 | P0 | 4 files plus `modules-demo/` exist and every `.js` file runs without errors | `node 01-fundamentals/<file>.js` for each | ☐ |
| T1-2 | P0 | Covers: `let`/`const`/`var`, all data types, operators, `if/else`, `switch`, ternary, all 5 loop types, 3 function styles | Coverage table in section 3 | ☐ |
| T1-3 | P0 | Covers: arrow functions with implicit return, template literals, array and object destructuring, spread, rest, default parameters, object shorthand, modules | Coverage table in section 3 | ☐ |

### D1: Repository hygiene (5)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| D1-1 | P0 | `Day-02/` is pushed to the public `Linkific-Tasks` repo, layout matches `ARCHITECTURE.md` | Open the repo in an incognito window | ☐ |
| D1-2 | P1 | At least 10 commits today with descriptive messages | `git log --oneline --since="today" \| wc -l` | ☐ |
| D1-3 | P0 | No secrets, `.env`, `.DS_Store` or `node_modules` committed | Commands in section 5 | ☐ |

### D2: Projects (10 each)

Scoring per project: Must requirements 7 points (proportional), quality 2 points, evidence 1 point.

| Quality item (2 points) | How to verify |
|---|---|
| Runs on Live Server with zero console errors | DevTools Console |
| Responsive at 375, 768, 1280 px with no horizontal scroll | DevTools device toolbar |
| Fully keyboard operable, visible focus, labels on inputs | Tab through the page |

| Evidence item (1 point) | |
|---|---|
| 3 screenshots (or a short GIF) in `screenshots/`, a project `README.md`, and the explain-back from `GUIDELINES.md` done | |

**Habit Tracker (HT)**

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| HT-1 | P0 | Add habit, validated, duplicates rejected | Try empty, 41 characters, `Read` then `read` | ☐ |
| HT-2 | P0 | Toggle done today | Click twice; state returns | ☐ |
| HT-3 | P0 | Current and longest streak correct | Seed `checkIns` for yesterday and the day before; expect streak 3 after checking today. Gap test: a missing day resets the current streak | ☐ |
| HT-4 | P0 | Delete habit | Reload; it stays deleted | ☐ |
| HT-5 | P0 | Persists; survives corrupt data | In DevTools set `localStorage['day2.habits.v1'] = '{bad'`, reload, no crash | ☐ |
| HT-6 | P0 | Local `YYYY-MM-DD` keys | `grep -rn "toISOString" projects/habit-tracker` finds nothing | ☐ |
| HT-7 | P1 | Stats: total, ranking, per-date | Visual check | ☐ |
| HT-8 | P1 | Last-7-days indicator | Visual check | ☐ |

**Typing Test (TT)**

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| TT-1 | P0 | At least 10 own texts, at least 3 per level | Count the arrays | ☐ |
| TT-2 | P0 | Timer starts on the first keystroke only; interval cleared | Wait 5 s before typing; the timer must not move. Restart repeatedly; no double speed | ☐ |
| TT-3 | P0 | Live correct / incorrect / pending feedback | Type right and wrong characters | ☐ |
| TT-4 | P0 | WPM, accuracy, errors correct | Type 50 correct characters in 30 s → WPM 20, accuracy 100% | ☐ |
| TT-5 | P0 | Restart resets everything | Restart mid-test and after finishing | ☐ |
| TT-6 | P0 | Difficulty uses `switch` | `grep -n "switch" projects/typing-test/script.js` | ☐ |
| TT-7 | P1 | Best WPM persisted | Reload | ☐ |
| TT-8 | P1 | `aria-live` results; paste blocked | Inspect the element; try pasting | ☐ |

**Pokédex (PK)**

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| PK-1 | P0 | Search by name and by ID shows the full card | Try `pikachu`, `Pikachu `, `25` | ☐ |
| PK-2 | P0 | All five states visible; `response.ok` checked | Search `notapokemon` (404); toggle DevTools offline (error) | ☐ |
| PK-3 | P0 | Browse grid with Load more, built from `.then/.catch/.finally` and `Promise.all` | Commands in section 5 | ☐ |
| PK-4 | P0 | Search uses `async/await` with `try/catch/finally` | Commands in section 5 | ☐ |
| PK-5 | P0 | Cache prevents repeat requests | DevTools Network: search the same Pokémon twice, one request | ☐ |
| PK-6 | P0 | Clicking a card shows detail | Click several | ☐ |
| PK-7 to PK-10 | P1 | Type filter, debounce or button, stat bars, sort | Visual check | ☐ |

**Flashcards (FC)**

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| FC-1 | P0 | At least 10 starter cards with the correct shape | Inspect the deck | ☐ |
| FC-2 | P0 | Flip works by mouse and keyboard; Prev/Next | Tab to the flip button; press Enter and Space | ☐ |
| FC-3 | P0 | Known/unknown toggles without mutating the original | Check that `deck.js` uses spread and `map` | ☐ |
| FC-4 | P0 | Filters with counts and an empty message | Mark none known, choose "known" | ☐ |
| FC-5 | P0 | Fisher–Yates shuffle on a copy; order can be reset | `grep -n "Math.random() - 0.5"` finds nothing | ☐ |
| FC-6 | P0 | Add and delete cards | Add, then delete the last card; `index` stays valid | ☐ |
| FC-7 | P0 | Persistence and Reset deck | Reload; reset | ☐ |
| FC-8, FC-9 | P1 | Progress with `every`; keyboard shortcuts | Visual check | ☐ |

### D3: Array and object exercises (10)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| D3-1 | P0 | At least 20 numbered exercises; coverage: `map` 4, `filter` 4, `reduce` 4, `find`/`findIndex` 2, `some`/`every` 2, `sort` 4 | `grep -cE "^// Exercise [0-9]+" 02-array-methods/exercises.js` is 20 or more | ☐ |
| D3-2 | P0 | Runs with `node` and prints each result next to an `// Expected:` comment that matches | Run it and compare | ☐ |
| D3-3 | P0 | No exercise mutates its input (except where the exercise says so) | Read the `sort` and removal exercises | ☐ |
| D3-4 | P0 | O1–O3 exist and run | `node 02-array-methods/object-manipulation.js` | ☐ |

### D4: DOM examples (7)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| D4-1 | P0 | All six sections are present and interactive | Click through each | ☐ |
| D4-2 | P0 | `textContent` vs `innerHTML` demo explains the risk with user input | Read the demo text | ☐ |
| D4-3 | P1 | Event delegation works on items added after page load | Add an item, click it | ☐ |

### D5: Async examples (13)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| D5-1 | P0 | 5 files run and print labelled traces | `node 04-async-examples/<file>.js` | ☐ |
| D5-2 | P0 | At least two real API calls (JSONPlaceholder and PokeAPI) | Read `04-fetch-api.js` | ☐ |
| D5-3 | P0 | 404 handled through `response.ok`; network failure handled through `catch` | Run `05-error-handling.js` | ☐ |
| D5-4 | P0 | Each concept appears: callbacks, `.then/.catch/.finally`, `Promise.all`, `async/await`, `try/catch/finally` | Section 3 table | ☐ |

### D6: README (10)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| D6-1 | P0 | Every concept in the task has a row in the "Concept → where I used it" table with a real file path | Section 3 table matches the README | ☐ |
| D6-2 | P0 | **No claim without code.** Every feature listed exists | Verification commands plus `docs/FACTS.md` | ☐ |
| D6-3 | P0 | How to run (Live Server for projects, `node` for scripts) | Follow it on a fresh clone | ☐ |
| D6-4 | P1 | Screenshots for each project at 3 widths | Images render on GitHub | ☐ |
| D6-5 | P0 | Honest notes: tools used (BMAD, AI assistance), known limitations, what I would improve | Read it | ☐ |

### P: Process and standup (10)

| ID | Pri | Criterion | How to verify | Status |
|---|---|---|---|---|
| P-1 | P0 | Tracker row added (all 8 columns), shared as editor with `hr.linkific@gmail.com` and `tech.linkific@gmail.com` | Open the sheet | ☐ |
| P-2 | P0 | Drive file `Day 2` is in the single task folder | Open Drive | ☐ |
| P-3 | P0 | Links submitted on the dashboard and "Update Links" clicked; each link opens in incognito or shows an access request for a shared account | Test each link | ☐ |
| P-4 | P0 | Task submitted **before** presenting | Dashboard status | ☐ |
| P-5 | P0 | Rehearsed update runs under 3:45 | Timer | ☐ |

## 3. Concept coverage matrix

Fill **Actual location** with the real file and line once built. Every row must be `☑` before the README is final.

| Task concept | Planned location | Actual location | ☑ |
|---|---|---|---|
| `let` / `const` / `var` | `01-fundamentals/01-variables-and-types.js` | | ☐ |
| Data types, `null` vs `undefined` | `01-fundamentals/01-variables-and-types.js` | | ☐ |
| Operators | `01-fundamentals/02-operators-conditionals-loops.js` | | ☐ |
| `if/else` | `01-fundamentals/02-...`, Habit Tracker | | ☐ |
| `switch` | `01-fundamentals/02-...`, Typing Test `pickText` | | ☐ |
| Ternary | `01-fundamentals/02-...`, `streaks.js` | | ☐ |
| `for` | `01-fundamentals/02-...` | | ☐ |
| `while` | `streaks.js` | | ☐ |
| `forEach` | `01-fundamentals/02-...` | | ☐ |
| `for...of` | Typing Test, `streaks.js` | | ☐ |
| `for...in` | `01-fundamentals/02-...`, Habit Tracker stats | | ☐ |
| Function declaration, expression, arrow | `01-fundamentals/03-functions.js` | | ☐ |
| Implicit return | `01-fundamentals/03-functions.js`, `exercises.js` | | ☐ |
| Template literals | `04-es6-features.js`, Pokédex `ui.js` | | ☐ |
| Destructuring (array, object) | `04-es6-features.js`, Pokédex `toPokemonView` | | ☐ |
| Spread | `state.js`, `deck.js` | | ☐ |
| Rest parameters | `03-functions.js` (`sum(...nums)`) | | ☐ |
| Default parameters | `dates.js` (`toDateKey`) | | ☐ |
| Object shorthand | `deck.js` (`createCard`) | | ☐ |
| Computed property names | `stats.js` (`checkInsByDate`), `object-manipulation.js` | | ☐ |
| Modules (`import`/`export`) | `modules-demo/`, Habit Tracker, Pokédex, Flashcards | | ☐ |
| `map` | `exercises.js` 1–4, Typing Test `renderChars` | | ☐ |
| `filter` | `exercises.js` 5–8, `deck.js` | | ☐ |
| `reduce` | `exercises.js` 9–12, `stats.js` | | ☐ |
| `find` | `exercises.js` 13, `state.js` | | ☐ |
| `some` / `every` | `exercises.js` 15–16, `streaks.js`, `getProgress` | | ☐ |
| `sort` | `exercises.js` 17–20, `stats.js` | | ☐ |
| `Object.keys/values/entries` | `object-manipulation.js` O1, Habit Tracker `ui.js` | | ☐ |
| Object spread and merge | `object-manipulation.js` O2 | | ☐ |
| `querySelector`, `getElementById` | `03-dom-examples/` | | ☐ |
| `textContent` vs `innerHTML` | `03-dom-examples/` | | ☐ |
| `classList.add/remove/toggle` | `03-dom-examples/`, Flashcards, Typing Test | | ☐ |
| Create and append elements | `03-dom-examples/`, Habit Tracker `ui.js` | | ☐ |
| Events: click, input, submit | `03-dom-examples/`, all projects | | ☐ |
| Callbacks | `01-callbacks.js`, Typing Test `setInterval` | | ☐ |
| Promises: `then/catch/finally` | `02-promises.js`, Pokédex browse | | ☐ |
| `async/await` | `03-async-await.js`, Pokédex search | | ☐ |
| Fetch API | `04-fetch-api.js`, Pokédex `api.js` | | ☐ |
| Error handling with `try/catch` | `05-error-handling.js`, Pokédex, storage wrapper | | ☐ |

## 4. Quality gates

| Gate | Target | Required? |
|---|---|---|
| Console errors | 0 on every page | Yes |
| Horizontal scroll at 375 px | None | Yes |
| One `h1` per page, no skipped heading levels | Yes | Yes |
| Every `<img>` has `alt`; every input has a `<label>` | Yes | Yes |
| Prettier formatting applied | Yes | Yes |
| Lighthouse accessibility score | 90 or higher | Stretch |
| Dead code, commented-out blocks, stray `console.log` | Removed from projects | Yes |

## 5. Verification commands

Run from inside `Day-02/`. Each result should be explainable before it goes in the README.

```bash
# Repo hygiene (expect no output)
git ls-files | grep -E "\.env|\.DS_Store|node_modules"
grep -rniE "api[_-]?key|secret|token" --include=*.js --include=*.html .

# Commits today
git log --oneline --since="today" | wc -l

# D3: exercise count (expect 20 or more)
grep -cE "^// Exercise [0-9]+" 02-array-methods/exercises.js

# Concept markers (every claimed concept should show up here)
grep -rn "// CONCEPT:" . | sort | head -100

# Habit Tracker (HT-6: expect no output; modules: expect matches)
grep -rn "toISOString" projects/habit-tracker
grep -rln 'type="module"' projects

# Typing Test (TT-6)
grep -n "switch" projects/typing-test/script.js

# Pokédex (PK-2, PK-3, PK-4, PK-5)
grep -rnE "response\.ok|\.ok\b" projects/pokedex/js
grep -rnE "\.then\(|\.catch\(|\.finally\(" projects/pokedex/js
grep -rnE "async |await " projects/pokedex/js
grep -rn "Promise.all" projects/pokedex/js
grep -rn "new Map" projects/pokedex/js

# Flashcards (FC-5: expect no output)
grep -rn "Math.random() - 0.5" projects/flashcards

# innerHTML audit: review every hit. User text must never go through it
grep -rn "innerHTML" projects 03-dom-examples
```

## 6. Standup readiness (4-minute limit)

| Item | Ready? |
|---|---|
| Submitted on the dashboard before the meet | ☐ |
| Tabs open in demo order: repo → each project → README | ☐ |
| One-sentence answer to each of the 4 daily questions: assigned, completed, measurable progress, biggest challenge or learning | ☐ |
| Evidence ready: commits, screenshots or GIFs, live demos, docs | ☐ |
| For each project, one thing I can explain without help (a function, the algorithm, the pattern) | ☐ |
| Honest line about tools used (BMAD, AI assistance) | ☐ |
| Any unfinished item stated plainly with a finish time | ☐ |
| One specific question for the instructors | ☐ |
| Rehearsed with a timer, under 3:45 | ☐ |

**Likely questions, and the answer to prepare for each**
1. Why do you copy the array before `sort` or shuffle?
2. What is the difference between `.then` chains and `async/await`? Why use both here?
3. Why store dates as local strings instead of `toISOString()`?
4. Why `textContent` rather than `innerHTML` for user input?
5. What does `response.ok` do, and why does `fetch` not throw on a 404?
6. How does the streak function handle a missed day?
7. Why is the typing timer started on the first keystroke, and how do you stop two timers running?

## 7. Sign-off

| Check | Done |
|---|---|
| All P0 items `☑` | ☐ |
| Total score at least 85 (or an honest partial plan written) | ☐ |
| `docs/FACTS.md` generated and matches the README | ☐ |
| Final push done, and the repo opened in incognito | ☐ |
