# Milestones & Execution Plan: HackHQ (Day 5)

## Milestone Roadmap

| Milestone | Scope & Deliverable | Git Branch | PR Target |
|---|---|---|---|
| **M0** | Scaffolding, dependencies, design tokens, responsive App shell, navigation, toasts, and companion docs | `day5/setup-and-shell` | `main` |
| **M1** | Check-in station: counter (+1, -1, +5, reset), capacity control, split-flap board animation, aria-live | `day5/checkin-counter` | `main` |
| **M2** | Checklist station: todo CRUD, filter tabs, progress bar, starter tasks, undo delete toast, completion confetti | `day5/checklist-todo` | `main` |
| **M3** | Teams station: multi-input form, nested contact, member rows (1-4), interests array, pure validation, live badge preview | `day5/teams-registration` | `main` |
| **M4** | Swag Shop station: 6 products catalog, shopping cart, quantity updates, coupon code (`HACK10`), thermal receipt | `day5/swag-shop` | `main` |
| **M5** | Learning Layer: State X-ray live JSON telemetry and State Lab interactive mutation & batching experiments | `day5/learning-layer` | `main` |
| **M6** | Vitest suite (>= 20 tests), `docs/FACTS.md`, production build, zero lint errors, comprehensive README | `day5/testing-and-docs` | `main` |

---

## Acceptance Criteria & Test Verification

### M0: Setup & Shell
- [x] Vite 5 + React 19 bootstrapped cleanly in `Linkific-Tasks/Day-05`.
- [x] Fontsource packages installed for Barlow Condensed and Public Sans.
- [x] CSS design tokens defined for light/dark modes (`paper`, `ink`, `rule`, `lanyard`, `tape`, `signal`, `mint`, `board`).
- [x] App shell navigation works smoothly across mobile (< 1024px bottom bar) and desktop (>= 1024px sidebar).
- [x] Stations preserved via `hidden` attribute so switching never wipes state.
- [x] Toast notification queue supports message, action ("Undo"), and auto-dismiss after timeout.

### M1: Check-in Station (CI-1 to CI-7)
- [ ] Count starts at 0, cannot go below 0 (`-1` disabled), cannot exceed capacity.
- [ ] Buttons (+1, -1, +5 group, Reset) update state cleanly.
- [ ] Capacity is controlled (1-1000, default 200). Lowering capacity below count clamps count and warns via toast.
- [ ] Split-flap board displays 3 digits in tape yellow with center horizontal seam and flip keyframe animation.
- [ ] Screen readers receive polite live announcements: `"X of Y inside"`.

### M2: Checklist Station (CL-1 to CL-11)
- [ ] Add task controlled input rejects empty/whitespace input with clear validation error.
- [ ] Checkbox toggles task status immutably (`map`).
- [ ] Delete removes task immutably (`filter`).
- [ ] Undo delete via toast action restores task at exact original index.
- [ ] Segmented filter (All / Open / Done) displays count badges; visible list is purely derived.
- [ ] "Add starter tasks" button adds hack-day checklist items without creating duplicates.
- [ ] Inline task editing allows saving via Enter and canceling via Escape.
- [ ] Confetti celebration triggers when completing all tasks (minimum 3 tasks).

### M3: Teams Station (TM-1 to TM-10)
- [ ] Form values live in single `form` object with nested `contact` (`email`, `phone`, `city`).
- [ ] Dynamic member rows (1 to 4): Add disabled at 4, Remove disabled at 1.
- [ ] Interests checkboxes add/remove strings immutably.
- [ ] Agreement checkbox is mandatory for submission.
- [ ] Pure `validateTeam(values)` checks all constraints and renders specific error messages.
- [ ] Duplicate team names (case-insensitive) are prevented with inline warning.
- [ ] "Fill sample team" button loads complete valid dataset.
- [ ] Sticky Name Badge preview updates in real time on every keystroke.

### M4: Swag Shop Station (SW-1 to SW-9)
- [ ] 6 sample products displayed in ruled layout with image/icon, description, price, and add button.
- [ ] Add to cart adds new line or increments existing line (capped at 10 items per product).
- [ ] Quantity controls (+, -) update count; reducing below 1 removes line item.
- [ ] Subtotal, discount, and total are computed purely via `reduce` during render.
- [ ] Coupon code `HACK10` provides 10% discount; invalid code displays error message.
- [ ] Thermal receipt displays perforated jagged edge, tabular figures, and "Place order" action that triggers confirmation toast.

### M5: Learning Layer (LB-1 to LB-4)
- [ ] State X-ray displays active station's live state formatted as JSON with syntax tokens.
- [ ] Mutation Demo compares `.push()` in-place (no re-render) vs `[...arr, item]` (immediate re-render).
- [ ] Batching Demo compares `setCount(count + 1)` x3 (+1) vs `setCount(prev => prev + 1)` x3 (+3).
- [ ] Clear 2-sentence explanations accompany each demo.

### M6: Testing & Quality (NFR-1 to NFR-12)
- [ ] At least 20 Vitest unit tests in `test/` passing cleanly.
- [ ] Zero ESLint errors or warnings.
- [ ] Production build (`npm run build`) generates clean bundle.
- [ ] `docs/FACTS.md` records verifiable facts matching the actual code.
- [ ] Comprehensive `README.md` explaining state, props, immutability, and architecture.

