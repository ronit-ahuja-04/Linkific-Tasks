# Verifiable System Facts & Audit Trail: HackHQ (Day 5)

| Metric                      | Target                          | Actual Empirical Value                                  | Verification Command                                                                                         |
| --------------------------- | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **P0 Requirements Passed**  | 100%                            | 100% (SH, CI, CL, TM, SW, TH)                           | Manual test script & automated test suite                                                                    |
| **Banned Hooks Grep**       | 0 occurrences                   | 0 occurrences                                           | `grep -rnE "use(Effect\|Reducer\|Context\|Ref\|Memo\|Callback\|LayoutEffect)" src/`                          |
| **Banned Libraries Grep**   | 0 external libraries            | 0 external libraries                                    | `grep -rnE "redux\|zustand\|jotai\|mobx\|formik\|react-hook-form\|zod\|immer\|@radix-ui\|@mui" package.json` |
| **Unit Tests Passing**      | >= 20 tests                     | 58 passing tests                                        | `npm test`                                                                                                   |
| **Test Suites**             | 4 suites                        | 4 passed (`counter`, `checklist`, `validation`, `cart`) | `vitest run`                                                                                                 |
| **ESLint Warnings/Errors**  | 0 errors, 0 warnings            | 0 errors, 0 warnings                                    | `npm run lint`                                                                                               |
| **Production Bundle JS**    | < 200 KB (gzipped)              | 92.04 KB (gzipped)                                      | `npm run build`                                                                                              |
| **Production Bundle CSS**   | < 50 KB (gzipped)               | 8.44 KB (gzipped)                                       | `npm run build`                                                                                              |
| **Station Persistence**     | Zero state loss on switch       | Verified (`hidden` attribute used in `App.jsx`)         | Manual verification & grep                                                                                   |
| **Touch Target Dimensions** | >= 44x44px for primary controls | Verified in `src/index.css`                             | DevTools audit                                                                                               |
| **Focus Indication**        | Visible 2px lanyard ring        | Verified `:focus-visible` in `src/index.css`            | Keyboard Tab navigation                                                                                      |

---

## Component Inventory (10 Modules)

1. `src/App.jsx`: Root application coordinator holding global UI state (`theme`, `activeStation`, `xrayOn`, `toasts`).
2. `src/components/Header.jsx`: Control room header with venue wordmark, active station pill, live X-ray toggle, and accessible theme switch.
3. `src/components/Navigation.jsx`: Responsive dual-mode navigation (desktop left rail >= 1024px, mobile bottom bar < 1024px).
4. `src/components/ToastContainer.jsx`: Polite notification manager supporting auto-dismiss `setTimeout` and interactive action callbacks.
5. `src/components/StateXray.jsx`: Live telemetry inspector with syntax token color highlighting for station state payloads.
6. `src/components/stations/CheckInStation.jsx`: Venue attendee counter with clamped capacity guards and multi-variable state architecture.
7. `src/components/stations/SplitFlapBoard.jsx`: Hardware-inspired split-flap departure board with CSS keyframe flip remounting (`key={digit}`).
8. `src/components/stations/ChecklistStation.jsx`: Whiteboard setup task manager with immutable array CRUD, undo delete, and celebration confetti.
9. `src/components/stations/TeamsStation.jsx`: Dynamic team registration form featuring nested contact info, member rows (1-4), and pure validation.
10. `src/components/stations/TeamBadgePreview.jsx`: Physical lanyard badge preview reflecting keystroke state in real time.
11. `src/components/stations/SwagStation.jsx`: Pop-up swag counter with 6 products catalog, line quantity controls, coupon engine, and thermal receipt.
12. `src/components/stations/StateLabStation.jsx`: Side-by-side interactive laboratories demonstrating _In-Place Mutation vs Spread_ and _Direct Value vs Functional Batching_.

---

## Test Suite Breakdown (58 Unit Tests)

- `test/counter.test.js` (17 tests):
  - `clampCount`: 4 tests (negatives, capacity overflow, bounds, non-numeric guards)
  - `calculateCapacityPercentage`: 3 tests (valid ratios, 100% cap, zero division guards)
  - `getCapacityStatus`: 3 tests (Plenty of room, Nearly full, Full)
  - `formatFlapDigits`: 3 tests (zero padding, 3-digit strings, non-numeric fallbacks)
  - `parseCapacityInput`: 4 tests (string conversion, lower bound 1, upper bound 1000, fallback)
- `test/checklist.test.js` (15 tests):
  - `createTask`: 1 test (object structure, ID, trimmed text)
  - `filterTasks`: 4 tests (all, open, done, null guards)
  - `calculateProgress`: 3 tests (empty list, correct ratios, completion threshold >= 3)
  - `insertTaskAtIndex`: 3 tests (beginning, middle, end for undo restoration)
  - `swapTaskPosition`: 2 tests (adjacent swapping, out of bounds immutability)
  - `mergeStarterTasks`: 2 tests (appending non-existing items, duplicate prevention)
- `test/validation.test.js` (12 tests):
  - `isValidEmail`: 2 tests (valid RFC patterns, invalid format rejection)
  - `isValidPhone`: 3 tests (10 digits, optional blank allowance, incorrect length rejection)
  - `isDuplicateTeamName`: 2 tests (case-insensitive detection, unique name allowance)
  - `validateTeam`: 5 tests (sample team pass, missing fields, name length, duplicates, member counts)
- `test/cart.test.js` (14 tests):
  - `calculateSubtotal`: 2 tests (empty cart, multi-item reduce)
  - `calculateDiscount & calculateTotal`: 2 tests (10% coupon math, zero discount fallback)
  - `calculateTotalItemCount`: 1 test (quantity summation via reduce)
  - `addToCart`: 3 tests (new line, increment existing line, 10-item cap)
  - `updateCartQuantity`: 2 tests (inc/dec, auto-remove line on <= 0)
  - `removeFromCart`: 1 test (immutable line deletion)
  - `validateCoupon`: 2 tests (case-insensitive `HACK10`, invalid codes)
  - `formatCurrencyINR`: 1 test (Intl formatting with commas and ₹)
