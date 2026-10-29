# HackHQ · Hackathon Control Room & React 19 State Architecture

> **Linkific Internship Training — Day 5: React State & Event Handling**  
> **Author:** Ronit Ahuja  
> **Date:** Thursday, 29 October 2026  
> **Stack:** React 19, Vite 5, Native CSS Design Tokens, Fontsource Typography, Vitest  
> **Live Stations:** Check-in (Counter), Checklist (Todo), Teams (Form & Validation), Swag Shop (Cart & Thermal Receipt), State Lab (Mutation & Batching Experiments), State X-ray (Live JSON Telemetry)

---

## 📋 Table of Contents
1. [Overview & Concept](#overview--concept)
2. [Task Coverage Matrix & Reference Map](#task-coverage-matrix--reference-map)
3. [Strict Scope Guardrails (Zero Banned Hooks)](#strict-scope-guardrails-zero-banned-hooks)
4. [Component Inventory](#component-inventory)
5. [The 5 Stations & The Learning Layer](#the-5-stations--the-learning-layer)
   - [Station 1: Check-in (Split-Flap Counter & Capacity)](#station-1-check-in-split-flap-counter--capacity)
   - [Station 2: Checklist (Whiteboard Task Manager & Undo)](#station-2-checklist-whiteboard-task-manager--undo)
   - [Station 3: Teams (Registration Form & Live Lanyard Badge)](#station-3-teams-registration-form--live-lanyard-badge)
   - [Station 4: Swag Shop (Pop-up Store & Thermal Receipt)](#station-4-swag-shop-pop-up-store--thermal-receipt)
   - [Station 5: Dark Mode & Accessible Theme Switch](#station-5-dark-mode--accessible-theme-switch)
   - [Learning Layer: State X-ray & State Lab](#learning-layer-state-x-ray--state-lab)
6. [State Architecture & Immutability Patterns](#state-architecture--immutability-patterns)
7. [Design Tokens & Venue Signage Vernacular](#design-tokens--venue-signage-vernacular)
8. [Testing Suite & Quality Verification (58 Tests)](#testing-suite--quality-verification-58-tests)
9. [Local Development & Build Instructions](#local-development--build-instructions)
10. [Daily Tech Meet Standup Playbook (4-Minute Script)](#daily-tech-meet-standup-playbook-4-minute-script)

---

## 🚀 Overview & Concept

**HackHQ** unifies the five standalone projects of the Day 5 task into a cohesive, single-page hackathon organizer control room:
1. **Check-in**: Real-time attendee counter with physical split-flap departure board blades and capacity throttling.
2. **Checklist**: Venue operational checklist with segmented filtering, inline editing, toast-based Undo, and completion confetti.
3. **Teams**: Dynamic team registration form featuring nested contact state, 1–4 member rows, interest tagging, pure validation, and a live physical lanyard badge preview.
4. **Swag Shop**: Pop-up merchandise counter with item quantity caps, coupon resolution, pure `reduce` totals, and an authentic thermal receipt.
5. **Theme Switch**: Accessible dark mode switch reading OS system preference lazily.
6. **State X-ray & State Lab**: Real-time syntax-highlighted JSON state inspector alongside interactive experiments proving reference equality in mutations and update queueing in batching.

---

## 🗺️ Task Coverage Matrix & Reference Map

Every single core requirement and pedagogical deliverable from the Day 5 specification is implemented with handcrafted, explainable code:

| Day 5 Task Requirement | Concrete Implementation | Primary Source File(s) |
|---|---|---|
| **What state is** | Local component data driving re-renders across all stations | [`CheckInStation.jsx`](src/components/stations/CheckInStation.jsx), [`App.jsx`](src/App.jsx) |
| **State vs Props** | `theme`, `xrayOn`, `activeStation` lifted to `App`; station datasets encapsulated | [`App.jsx`](src/App.jsx), [`Header.jsx`](src/components/Header.jsx) |
| **When to use state** | Interactive mutable values; derived values (progress, subtotal, status) computed during render | [`ChecklistStation.jsx`](src/components/stations/ChecklistStation.jsx), [`SwagStation.jsx`](src/components/stations/SwagStation.jsx) |
| **State is immutable** | Every array update uses `map`, `filter`, spread; Lab mutation experiment | [`StateLabStation.jsx`](src/components/stations/StateLabStation.jsx), [`checklist.js`](src/lib/checklist.js) |
| **Re-render on state change** | Live DOM updates; State Lab demo proves missed re-renders on mutation | [`StateLabStation.jsx`](src/components/stations/StateLabStation.jsx) |
| **Import & use `useState`** | Primitive, object, array, and functional initializers across stations | [`App.jsx`](src/App.jsx), [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx) |
| **Different data types** | number (`count`), string (`filter`), boolean (`xrayOn`), object (`form`), array (`tasks`, `cart`) | [`CheckInStation.jsx`](src/components/stations/CheckInStation.jsx), [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx) |
| **Multi-variable vs Single Object** | Check-in uses separate `count`/`capacity`; Teams uses single `form` object | [`CheckInStation.jsx`](src/components/stations/CheckInStation.jsx), [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx) |
| **Functional state updates** | `setX(prev => ...)` throughout all handlers; Lab batching demo (+3) | [`StateLabStation.jsx`](src/components/stations/StateLabStation.jsx), [`cart.js`](src/lib/cart.js) |
| **Event handling** | `onClick`, `onChange`, `onSubmit`, `onBlur`, `onKeyDown` | [`ChecklistStation.jsx`](src/components/stations/ChecklistStation.jsx), [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx) |
| **Event object patterns** | `e.preventDefault()`, `e.target.value`, `e.target.checked` | [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx), [`SwagStation.jsx`](src/components/stations/SwagStation.jsx) |
| **Passing arguments** | `onClick={() => handleRemove(task.id)}`, `onClick={() => handleStep(id, -1)}` | [`ChecklistStation.jsx`](src/components/stations/ChecklistStation.jsx), [`SwagStation.jsx`](src/components/stations/SwagStation.jsx) |
| **Controlled components** | Team name, contact inputs, capacity input, task input, coupon input | [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx), [`CheckInStation.jsx`](src/components/stations/CheckInStation.jsx) |
| **Array manipulations** | Add (`[...prev, item]`), Remove (`filter`), Update (`map`), Swap (`swapTaskPosition`) | [`checklist.js`](src/lib/checklist.js), [`cart.js`](src/lib/cart.js) |
| **Object manipulations** | Nested contact update (`contact: { ...prev.contact, city }`), spread updates | [`TeamsStation.jsx`](src/components/stations/TeamsStation.jsx), [`validation.js`](src/lib/validation.js) |
| **Split-flap flip animation** | Remounting blades with `key={digit}` to replay CSS `@keyframes flapFlip` | [`SplitFlapBoard.jsx`](src/components/stations/SplitFlapBoard.jsx) |
| **Station Persistence** | Inactive stations preserved via HTML `hidden` attribute (SH-1) | [`App.jsx`](src/App.jsx) |

---

## 🛡️ Strict Scope Guardrails (Zero Banned Hooks)

In strict adherence to the pedagogical guidelines for Day 5:
- **Allowed Hooks**: `useState` (all data types, lazy initializers, functional updates) and `useId` (strictly for linking `<label>` and `<input>`).
- **Zero Forbidden Hooks**: Grep verified `0` occurrences of `useEffect`, `useReducer`, `useContext`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect`.
- **Zero Form / State Libraries**: Handcrafted state transitions without Redux, Zustand, Formik, react-hook-form, or Zod.
- **Zero UI Kits**: Custom semantic layout and design tokens without shadcn/ui, Radix, MUI, or Chakra.
- **Event-Driven Asynchrony**: Toast timeouts and confetti bursts execute directly inside event handlers.

---

## 📦 Component Inventory

```text
src/
├── App.jsx                       # Root coordinator: theme, activeStation, xrayOn, toasts
├── index.css                     # Native design tokens, typography, keyframes, focus styles
├── main.jsx                      # React 19 root bootstrap in StrictMode
├── components/
│   ├── Header.jsx                # Brand wordmark, active station pill, X-ray toggle, theme switch
│   ├── Navigation.jsx            # Dual layout navigation (desktop left rail / mobile bottom bar)
│   ├── ToastContainer.jsx        # Polite live notifications with auto-dismiss and Undo action
│   ├── StateXray.jsx             # Live JSON telemetry inspector with syntax token highlights
│   └── stations/
│       ├── CheckInStation.jsx    # Counter (+1, -1, +5, reset), capacity control, progress bar
│       ├── SplitFlapBoard.jsx    # 3-digit departure board with physical blade animations
│       ├── ChecklistStation.jsx  # Whiteboard task manager, segmented filters, undo, confetti
│       ├── TeamsStation.jsx      # Multi-field form, 1-4 member rows, interests, duplicate check
│       ├── TeamBadgePreview.jsx  # Sticky physical event badge updating live on keystroke
│       ├── SwagStation.jsx       # 6 products catalog, quantity caps, coupon code, thermal receipt
│       └── StateLabStation.jsx   # Interactive mutation vs spread & batching +3 demonstrations
├── lib/                          # Pure business logic (100% test coverage)
│   ├── counter.js                # clampCount, getCapacityStatus, formatFlapDigits, parseCapacity
│   ├── checklist.js              # filterTasks, calculateProgress, insertTaskAtIndex, swapPosition
│   ├── validation.js             # validateTeam, isValidEmail, isValidPhone, isDuplicateTeamName
│   └── cart.js                   # calculateSubtotal, calculateDiscount, calculateTotal, addToCart
└── data/
    ├── stations.js               # Station definitions and icons
    ├── starterTasks.js           # 6 operational setup tasks for hack day
    └── products.js               # 6 curated merchandise items with INR pricing
```

---

## 🏢 The 5 Stations & The Learning Layer

### Station 1: Check-in (Split-Flap Counter & Capacity)
- **Separate State Architecture**: Demonstrates holding independent state variables (`count` and `capacity`) vs single objects.
- **Boundary Clamping**: Pure helper `clampCount` guarantees count never drops below 0 or exceeds capacity.
- **Controlled Capacity**: Lowering capacity below the active count automatically throttles the count and notifies the user with a warning toast.
- **Split-Flap Animation**: Fixed-width blade slots remount with `key={digit}` to re-trigger a 260ms 3D CSS flip animation without layout shift.
- **Accessibility**: Screen readers receive polite live updates via `aria-live="polite"` (`"127 of 200 inside venue"`), while animated blades remain `aria-hidden="true"`.

### Station 2: Checklist (Whiteboard Task Manager & Undo)
- **Whiteboard Strip Design**: Ruled strips separated by 1px hairlines without boxed card wrappers.
- **Controlled Add Task**: Validates 1–80 character length, trims whitespace, and rejects empty inputs with inline errors.
- **Toast-Based Undo**: Deleting a task stores the task snapshot and its index, offering an interactive "Undo" action in the toast that restores it via array insertion spread:
  ```js
  setTasks(prev => [...prev.slice(0, index), taskToRestore, ...prev.slice(index)]);
  ```
- **Segmented Filter**: Segmented tabs for "All", "Open", and "Done" with real-time count badges; filtered view is derived during render.
- **Completion Confetti**: Triggered directly inside the checkbox toggle handler when the final task is completed (minimum 3 tasks), honoring `prefers-reduced-motion`.

### Station 3: Teams (Registration Form & Live Lanyard Badge)
- **Single Form Object State**: Manages complex form state in one object with nested contact fields (`contact: { email, phone, city }`).
- **Dynamic Member Rows (1–4)**: Add member button is disabled at 4; remove button is disabled at 1. Each member's name and role are updated immutably using array `map`.
- **Pure Validation Engine**: Pure `validateTeam(form, registeredTeams)` returns field-specific errors, touch state determines error visibility, and duplicate team names (case-insensitive) are rejected.
- **Live Lanyard Badge**: A physical paper badge card with top lanyard cutout slot, track accent banner, and roster updating on every keystroke.

### Station 4: Swag Shop (Pop-up Store & Thermal Receipt)
- **Ruled Catalog**: 6 curated products displayed in a minimal wayfinding list with price right-aligned and stock limits (max 10 items per product).
- **Thermal Receipt Layout**: Physical off-white receipt paper (`#FCFBF7`) with sawtooth zigzag perforated edges, dashed dividers, tabular numerals, and barcode graphics.
- **Auto-Pruning Decrement**: Decrementing quantity below 1 automatically prunes the line item from the cart.
- **Pure `reduce` Calculations**: Subtotal, coupon discount (`HACK10`), and grand total are computed purely during render. Zero totals stored in state.

### Station 5: Dark Mode & Accessible Theme Switch
- **Lazy Initialization**: Initializes theme state by querying system preferences without blocking first render:
  ```js
  const [theme, setTheme] = useState(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  ```
- **Accessible Switch**: Semantic `role="switch"` with `aria-checked` and full keyboard support (Space / Enter).
- **Instant Token Adaptation**: 200ms theme transition across design tokens with reduced motion overrides.

### Learning Layer: State X-ray & State Lab
- **State X-ray**: Live sidebar/sheet inspector displaying the active station's state as formatted JSON with token-based syntax highlighting (keys in lanyard, numbers in tape, strings in mint, booleans in signal).
- **State Lab (Experiment 1 — In-Place Mutation)**: Demonstrates why `.push()` followed by `setItems(items)` fails to re-render (same object reference), and shows how spread `[...items, newItem]` triggers immediate reconciliation. Includes a "Force Re-render" button that proves the mutated items were in memory all along.
- **State Lab (Experiment 2 — State Batching)**: Proves state snapshots: calling `setCount(count + 1)` three times only increments by +1, whereas functional updaters `setCount(prev => prev + 1)` properly queue updates to increment by +3.

---

## 🎨 Design Tokens & Venue Signage Vernacular

HackHQ embraces an authentic **Venue Signage** visual identity inspired by wayfinding displays, name badges on lanyards, and thermal receipts:

| Token | Light Theme | Dark Theme | Role & Purpose |
|---|---|---|---|
| `--color-paper` | `#F2F4F0` | `#0F1720` | Cool venue page backdrop |
| `--color-ink` | `#15202B` | `#E7ECEF` | High-contrast signage typography |
| `--color-rule` | `#D5DAD2` | `#26323F` | 1px hairlines and whiteboard dividers |
| `--color-lanyard` | `#2F5BFF` | `#8AA2FF` | Primary actions, links, active rings |
| `--color-tape` | `#FFC93C` | `#FFC93C` | Gaffer-tape yellow flap digits & highlights |
| `--color-signal` | `#C42B31` | `#FF6B70` | Errors, capacity full, destructive actions |
| `--color-mint` | `#0F7A64` | `#3DD6B0` | Completed tasks, coupon success |
| `--color-board` | `#101820` | `#0A1118` | Split-flap display & State X-ray surface |

- **Display Typography**: *Barlow Condensed* (600, 700) self-hosted via `@fontsource/barlow-condensed`.
- **Body Typography**: *Public Sans* (400, 500, 600) self-hosted via `@fontsource/public-sans`.
- **Focus Indicator**: 2px solid lanyard outline with 2px offset, fully visible on keyboard navigation.

---

## 🧪 Testing Suite & Quality Verification (58 Tests)

All business logic is isolated into pure helper modules under `src/lib/` and verified with 58 Vitest tests:

```bash
$ npm test

 RUN  v2.1.9 /Users/ronitahuja/Desktop/Linkific-Tasks/Day-05

 ✓ test/counter.test.js (17 tests)
   - clampCount boundaries, negative numbers, capacity overflow
   - calculateCapacityPercentage ratios and division-by-zero guards
   - getCapacityStatus threshold states ("Plenty of room", "Nearly full", "Full")
   - formatFlapDigits 3-digit zero padding and string extraction
   - parseCapacityInput bounds (1 to 1000) and NaN fallback recovery

 ✓ test/checklist.test.js (15 tests)
   - createTask ID generation and trimmed text structure
   - filterTasks status predicate matching (all, open, done)
   - calculateProgress completion percentages and threshold detection (>= 3)
   - insertTaskAtIndex exact index restoration for Undo delete
   - swapTaskPosition immutable ordering transitions
   - mergeStarterTasks duplicate prevention logic

 ✓ test/validation.test.js (12 tests)
   - isValidEmail RFC standard pattern checks
   - isValidPhone 10-digit format and optional blank checks
   - isDuplicateTeamName case-insensitive collision detection
   - validateTeam comprehensive schema verification across fields

 ✓ test/cart.test.js (14 tests)
   - calculateSubtotal line price multiplication via reduce
   - calculateDiscount & calculateTotal HACK10 coupon arithmetic
   - calculateTotalItemCount item sum calculation
   - addToCart line creation and 10-item cap enforcement
   - updateCartQuantity step updates and automatic line pruning on 0
   - removeFromCart immutable line deletion
   - validateCoupon coupon code verification and error messages
   - formatCurrencyINR Indian Rupee symbol and digit formatting

Test Files  4 passed (4)
Tests       58 passed (58)
Duration    ~300ms
```

---

## 💻 Local Development & Build Instructions

### Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Test Suite
```bash
npm test
```

### 4. Run Code Linter
```bash
npm run lint
```

### 5. Production Build & Preview
```bash
npm run build
npm run preview
```

---

## 🎙️ Daily Tech Meet Standup Playbook (4-Minute Script)

**Time Target:** 3 minutes 45 seconds  
**Tone:** Confident, structured, direct, demonstrating deep understanding of React state mechanics.

### 0:00 - 0:40 | The Hook & Architectural Overview
> *"Good evening everyone. Today for Day 5, I built **HackHQ** — an organizer control room for the day of a hackathon.*  
> *Instead of building five disconnected tutorial widgets, I unified all five requirements into five operational stations: **Check-in** for attendee counting, **Checklist** for venue setup, **Teams** for registration, **Swag Shop** for merchandise, and an accessible **Theme Switch**.*  
> *On top of these sits a learning layer: a live **State X-ray** inspector and a **State Lab** that makes React's internal state mechanics and re-rendering visible to anyone watching."*

### 0:40 - 1:30 | Station Highlights (State Patterns in Action)
> *"Let's look at the state architecture:*  
> 1. *In **Check-in**, count and capacity are separate state variables. Notice the split-flap board: each blade remounts with `key={digit}` to re-trigger a 3D flip keyframe. The capacity bar and status ('Plenty of room', 'Nearly full', 'Full') are derived during render — zero redundant state. Screen readers get polite live announcements while the blades stay `aria-hidden`.*  
> 2. *In **Checklist**, tasks are an immutable array. When I delete a task, watch the toast: clicking 'Undo' restores the task at its exact original position using array slice and spread insertion. When I check off the final task, a celebratory confetti burst fires directly from the event handler.*  
> 3. *In **Teams**, we demonstrate a single `form` object with nested contact fields, dynamic 1 to 4 member rows, and interest checkboxes. As I type, the physical lanyard badge updates live on every keystroke.*  
> 4. *In **Swag Shop**, product limits cap items at 10. Decreasing quantity from 1 automatically prunes the line. Subtotals, the 10% `HACK10` coupon, and totals are computed with pure `reduce` and rendered onto an authentic thermal receipt."*

### 1:30 - 2:40 | The Core Proof: The State Lab
> *(Navigate to State Lab)*  
> *"Now for the technical core of Day 5: **State Lab**.*  
> *In Experiment 1, we prove **Reference Equality**. When I click 'Push item', the handler mutates the array in-place with `.push()` and calls `setItems(items)`. Notice the screen does not update! Why? Because React compares state using `Object.is()`. Since the memory pointer didn't change, React skips re-rendering. Now watch: when I click 'Trigger unrelated re-render', the hidden mutated items suddenly appear! The right way creates a new array reference with spread `[...items, newBadge]`, which reconciles immediately.*  
> *In Experiment 2, we demonstrate **Automatic Batching and Snapshots**. When I click 'Add 3 (Direct)', it calls `setCount(count + 1)` three times, but the counter only increases by +1 because all three calls read the identical stale render snapshot. In contrast, 'Add 3 (Functional)' passes updater callbacks `prev => prev + 1` into React's pending queue, correctly incrementing by +3."*

### 2:40 - 3:20 | Scope Integrity & Engineering Rigor
> *"Behind this is strict engineering discipline:*  
> - *Every station is preserved across navigation using the HTML `hidden` attribute, so station state is never lost.*  
> - *We strictly adhered to the Day 5 guardrails: only `useState` and `useId`. Zero `useEffect`, zero `useReducer`, zero external state or form libraries.*  
> - *All calculations, clamping, and validation are in pure functions in `src/lib/`, covered by **58 Vitest unit tests** with 100% pass rate.*  
> - *0 ESLint warnings, production bundle gzipped under 93 KB, and full keyboard navigation with visible focus rings."*

### 3:20 - 3:45 | Closing
> *"HackHQ fulfills every Day 5 deliverable while making state, immutability, and batching tangible and explainable. Happy to answer any questions or walk through any handler in the codebase. Thank you!"*
