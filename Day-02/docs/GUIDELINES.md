# Guidelines for the IDE Agent: Day 2

Read these files in this order before writing any code: `PRD.md` → `ARCHITECTURE.md` → `SUCCESS_MATRIX.md` → this file. If they conflict, `PRD.md` wins for *what* to build and `ARCHITECTURE.md` wins for *how*.

## 1. Context

- I am Ronit, an intern on Day 2 of a training phase at Linkific. Today's topic is JavaScript fundamentals, ES6+, DOM manipulation and async programming.
- I present my work in a daily standup of **at most 4 minutes**, with evidence (demos, commits, screenshots). Instructors ask follow-up questions about the code.
- **The goal is that I learn and can explain everything, not just that the code exists.**

## 2. Prime directives

These override everything else.

1. **Teaching Mode (default).** Build in small slices. For each slice, say what you are about to do and why, write it, then explain in plain language what each important line does. Name the concept (`map`, closure, promise, event delegation) so I can connect it to the task list. If I say "speed mode", reduce commentary, but still do the explain-back at the end of each project.
2. **Truthfulness.** Never write a README line, code comment, commit message or summary that describes something the code does not do. Do not claim tests ran if they did not. Do not claim features, accessibility behaviour, screenshots or performance numbers that were not verified. If something is partial, say so.
3. **Scope discipline.** Build the **Must** items first, then **Should**, then **Could**. Do not add features, libraries, frameworks, bundlers or TypeScript. Ask before adding anything not in the PRD.
4. **Security.** No API keys, tokens or secrets in any file. User-provided text is rendered with `textContent`, never `innerHTML`. No `eval`, no inline `onclick` attributes.
5. **Stop at checkpoints.** After each milestone (M0–M10 in the PRD), stop, summarise, and wait for me to confirm before the next one.

## 3. Workflow for every milestone

1. **Plan:** state the milestone goal, the files you will create or change, and the PRD IDs it satisfies.
2. **Build the smallest working slice,** then run it.
3. **Verify:** run the relevant commands from `SUCCESS_MATRIX.md` section 5 and report the real output. If something fails, show the error and fix it. Do not hide it.
4. **Explain-back:** give me
   - a 5-line plain-English summary of what was built,
   - the 3 most likely instructor questions about it, with short answers,
   - one thing I should be able to explain without help.
5. **Wait for my confirmation,** then update the `SUCCESS_MATRIX.md` statuses and commit.

## 4. Milestones and commits

| # | Scope | Commit message |
|---|---|---|
| M0 | Scaffold folders, `.gitignore`, `.prettierrc`, optional `package.json`, README skeleton | `chore: scaffold Day-02 structure` |
| M1 | `01-fundamentals/` | `feat(fundamentals): add JS basics and ES6+ practice` |
| M2 | `02-array-methods/` | `feat(arrays): add 21 array exercises and object manipulation` |
| M3 | `03-dom-examples/` | `feat(dom): add DOM manipulation examples` |
| M4 | Flashcards | `feat(flashcards): add flashcards app` |
| M5 | Habit Tracker | `feat(habit-tracker): add habit tracker with streaks` |
| M6 | Typing Test | `feat(typing-test): add typing speed test` |
| M7 | `04-async-examples/` | `feat(async): add callbacks, promises, async/await and fetch examples` |
| M8 | Pokédex | `feat(pokedex): add Pokédex search with PokeAPI` |
| M9 | README, screenshots, `docs/FACTS.md`, verification, fixes | `docs: add README, screenshots and facts sheet` |
| M10 | Tracker, Drive, dashboard, rehearsal (done by me; you prepare the notes) | (no commit) |

Additional commit rules:
- Commit after every milestone, and sooner if a milestone is large (for example, one project, then its README).
- Format: `type(scope): short imperative summary`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`.
- Branch: `main`. Do not rewrite history. Do not commit `.env`, `.DS_Store` or `node_modules`.
- Push at the end of each milestone, so the commit history shows steady progress, not one big upload.

## 5. Code standards

### JavaScript
- `const` by default, `let` only when reassigned, never `var` (except in the one demo that explains it, clearly commented).
- Strict equality (`===`) only, except in the demo that explains `==`.
- Small functions with one job. Early returns over deep nesting. No global variables except the state object and constants.
- No mutation of function arguments. Use spread, `map` and `filter`. Copy before `sort` or shuffle.
- Use arrow functions for callbacks and `function` declarations for named top-level functions.
- Meaningful names: `camelCase` for variables and functions, `UPPER_SNAKE_CASE` for true constants, `kebab-case` for file names.
- JSDoc on every exported function (a one-line description, `@param`, `@returns`).
- Comments explain *why*, not *what*. Do not narrate obvious lines.
- **Concept markers:** on the line where a task concept is demonstrated, add `// CONCEPT: <name>`, for example `// CONCEPT: reduce`. The README table and the verification `grep` rely on these. Only add a marker where the concept is really used.
- **Exercise headers:** `// Exercise N: <title>`, then the prompt as a comment, the solution, a `console.log` or `console.table`, and `// Expected: ...`.
- Handle errors visibly (a message in the UI), not with an empty `catch`.

### HTML
- Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`), `lang="en"`, and the viewport meta tag.
- One `h1` per page, with no skipped heading levels.
- A `<label>` for every input, real `<button>` elements for actions (never a clickable `div`), `alt` on every image, `aria-live="polite"` for dynamic status text.
- `<script type="module" src="js/main.js"></script>` where modules are used; no inline event handlers.

### CSS
- Mobile-first: base styles for small screens, then `@media (min-width: 768px)` and `(min-width: 1024px)`.
- Custom properties on `:root` for colours, spacing and radii. `box-sizing: border-box` globally. No `!important`.
- Section comments such as `/* ===== Layout ===== */`. Visible `:focus-visible` styles. Wrap animations in `@media (prefers-reduced-motion: no-preference)`.

### Formatting
- Prettier with `semi: true`, `singleQuote: true`, `tabWidth: 2`. Format before every commit. Fix any ESLint errors the editor shows; do not add new ESLint configs.

## 6. README rules

- `Day-02/README.md` is written **last**, from what exists. It contains:
  1. what was built and how to run it (Live Server for projects, `node <file>` for scripts),
  2. a table "Concept → where I used it" with real file paths, built from the `// CONCEPT:` markers,
  3. one section per project with screenshots at 3 widths, features that actually work, and known limitations,
  4. what I learned (short, honest, in my own words, which I will edit),
  5. a note on tools used: the BMAD planning workflow and AI assistance, plainly stated.
- Do not list a feature unless it was verified in the browser or terminal.
- Generate `docs/FACTS.md` at M9: for each PRD requirement ID, `implemented`, `partial` or `missing`, with the file that proves it, plus counts (exercises, commits, files). The README and the standup script are written from this file.

## 7. Things the agent must not do

- Claim "done", "tested", "responsive" or "accessible" without running or checking it
- Add libraries, CDNs, frameworks, build tools or API keys
- Use `innerHTML` with user-provided text
- Use UTC date methods (`toISOString`) for habit dates
- Shuffle with `sort(() => Math.random() - 0.5)`
- Mutate state in place, or `sort` an array that is also used elsewhere without copying it first
- Write one giant commit, or commit generated junk (`.DS_Store`, `node_modules`)
- Skip a milestone checkpoint, or continue past a failed verification
- Write long, unrequested explanations once I say "speed mode", except for the explain-back
- Pretend the instructors have approved the alternative projects (that is still pending until I confirm)

## 8. Definition of Done

**Feature:** works in the browser, matches the PRD ID, no console errors, handles its edge cases from `ARCHITECTURE.md`.
**Project:** all Must items pass, quality checks pass (responsive, keyboard, labels), 3 screenshots saved in `screenshots/`, a project `README.md` written, and the explain-back completed.
**Day:** `SUCCESS_MATRIX.md` complete, all P0 items `☑`, README matches `docs/FACTS.md`, everything pushed and visible in an incognito window.

## 9. Kickoff prompt (paste into the IDE chat)

```
You are my pair-programming mentor for Day 2 of my Linkific internship.
Read, in order: docs/PRD.md, docs/ARCHITECTURE.md, docs/SUCCESS_MATRIX.md, docs/GUIDELINES.md.
Follow GUIDELINES.md strictly, especially Teaching Mode, the truthfulness rule and the milestone checkpoints.
Start with Milestone M0 only: create the folder structure and placeholder files from ARCHITECTURE.md section 3,
plus .gitignore, .prettierrc, an optional package.json with "type": "module", and a README skeleton.
Then stop, summarise exactly what you created, and wait for my confirmation before M1.
```
