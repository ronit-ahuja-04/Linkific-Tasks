# Tech Stack & Architecture: HackHQ (Day 5)

## 1. System Overview

HackHQ is designed as a single-page hackathon control room delivering five core stations and an interactive learning layer. The architecture strictly adheres to Day 5 training boundaries: state management using only `useState` and `useId`, zero banned hooks, zero external state libraries, and zero form libraries.

```
App (src/App.jsx) [Global UI State: theme, activeStation, xrayOn, toasts]
├── Header (Wordmark, Active Station pill, State X-ray Switch, Theme Switch)
├── Navigation (Desktop Left Rail / Mobile Bottom Tab Bar)
├── Main Workspace (Persistent Mounted Stations with hidden={activeStation !== id})
│   ├── CheckInStation (Counter, Capacity, SplitFlapBoard, Progress bar)
│   ├── ChecklistStation (Todo List, Filter Pills, Add Form, Undo Toast, Confetti)
│   ├── TeamsStation (Multi-field Form, Members Array, Interests, Live Badge Preview)
│   ├── SwagStation (Product List, Shopping Cart, Discount Coupon, Thermal Receipt)
│   └── StateLabStation (Interactive Immutability & State Batching Demonstrations)
├── StateXray (Live JSON Telemetry Inspector for Active Station)
└── ToastContainer (Notification Toasts with Auto-Dismiss & Action Callbacks)
```

## 2. Technology Stack

| Layer                     | Technology                                                    | Rationale                                                              |
| ------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Runtime & Framework**   | React 19.0.0 (`react`, `react-dom`)                           | Standard Linkific internship framework                                 |
| **Build Tooling**         | Vite 5.4.x with `@vitejs/plugin-react`                        | Instant HMR, rapid bundling, standard modern ESM build pipeline        |
| **Typography**            | `@fontsource/barlow-condensed`, `@fontsource/public-sans`     | Self-hosted wayfinding display and body fonts; 0 external CDN requests |
| **Styling**               | Native CSS Design Tokens (`src/index.css`)                    | Zero runtime overhead, native `:focus-visible`, fluid CSS grid/flexbox |
| **Icons**                 | `lucide-react`                                                | Clean, accessible venue-signage iconography with strict SVG sizing     |
| **Delight / Celebration** | `canvas-confetti`                                             | Lightweight event-driven confetti burst on 100% checklist completion   |
| **Testing**               | `vitest`                                                      | Fast unit test runner for 100% pure business logic in `src/lib/`       |
| **Code Quality**          | ESLint 9 (`eslint-plugin-react`, `eslint-plugin-react-hooks`) | Zero lint errors, strict hooks verification                            |

## 3. Strict Scope & Guardrail Compliance

To satisfy the pedagogical goals of Day 5 (State and Event Handling), the following constraints are enforced:

- **Allowed Hooks**:
  - `useState`: Used for local station state, lifted application UI state, lazy initial state (`theme`), and functional state updates (`setX(prev => ...)`).
  - `useId`: Used strictly for accessible linking between form `<label>` and `<input>`.
- **Prohibited Hooks**:
  - NO `useEffect` (timers are handled inside event callbacks like `setTimeout` in `onNotify`).
  - NO `useReducer`, `useContext`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect`.
- **Prohibited Libraries**:
  - NO Redux, Zustand, MobX, Jotai.
  - NO React Router (navigation is handled via `activeStation` state).
  - NO Formik, react-hook-form, Zod, Yup, Immer.
  - NO UI libraries (shadcn/ui, Radix, MUI, Chakra).

## 4. State vs Props Architecture

### Lifted Application State (`App.jsx`)

1. `theme` (`'light' | 'dark'`): Toggled via accessible switch; initialized lazily from `window.matchMedia`.
2. `activeStation` (`'checkin' | 'checklist' | 'teams' | 'swag' | 'lab'`): Drives current active view.
3. `xrayOn` (`boolean`): Controls visibility of live state telemetry inspector.
4. `toasts` (`Array<{ id, message, action, type }>`): Application notification queue.

### Station Local State (Encapsulated)

- **Check-in**: Separate `count` (number) and `capacity` (number) variables.
- **Checklist**: `tasks` (array of objects), `newTaskText` (string), `filter` (`'all' | 'open' | 'done'`), `editingId` (`string | null`), `editText` (string).
- **Teams**: Single `form` object containing strings, arrays, and nested contact info; plus `touched` object, `registeredTeams` array, and submission status.
- **Swag Shop**: `cart` array of line items (`{ productId, quantity }`), `couponInput` string, `appliedCoupon` object.
- **State Lab**: Mutation demo state and Batching counter state.

## 5. Station Persistence Model (SH-1)

Rather than unmounting components on station changes (which discards local `useState`), all stations remain mounted within the DOM, toggled via the native HTML `hidden` attribute:

```jsx
<div hidden={activeStation !== 'checkin'}>
  <CheckInStation onNotify={notify} xrayOn={xrayOn} />
</div>
```

This guarantees zero state loss when organizers navigate between stations during the hackathon.

## 6. Pure Library Architecture (`src/lib/`)

All calculation, validation, formatting, and transformation logic is extracted into pure, side-effect-free functions covered by Vitest tests:

1. `src/lib/counter.js`: Clamping logic, capacity warnings, flap digit formatting.
2. `src/lib/checklist.js`: Filter predicates, completion calculations, array insertion with undo index restoration.
3. `src/lib/validation.js`: Pure `validateTeam(values)` returning granular field error objects.
4. `src/lib/cart.js`: Subtotal calculation, discount resolution, total computation, and INR currency formatting.
