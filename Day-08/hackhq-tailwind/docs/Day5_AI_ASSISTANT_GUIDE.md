# AI Assistant Guide & Verification Checklist (Day 5)

## 1. Primary Directives

1. **Strict Day 5 Hook Scope**: Only `useState` and `useId` are permitted. Any appearance of `useEffect`, `useReducer`, `useContext`, `useRef`, `useMemo`, `useCallback`, or `useLayoutEffect` constitutes an immediate critical failure.
2. **Zero Form or State Libraries**: All state transformations must be plain JavaScript (`map`, `filter`, spread operator, object property updates).
3. **No UI Component Frameworks**: All visual components must be handcrafted using CSS tokens in `src/index.css`.
4. **Teaching Mode & Explainability**: The codebase must be clean, readable, and structured so the author can explain any state handler during the standup without hesitation.

## 2. Automated Grep Verification Checks

Before submitting any milestone, the following grep assertions must pass:

```bash
# 1. Verify NO prohibited hooks exist in src/
grep -rnE "use(Effect|Reducer|Context|Ref|Memo|Callback|LayoutEffect)" src/
# Expected: EMPTY OUTPUT

# 2. Verify NO banned state or form libraries exist in package.json
grep -rnE "redux|zustand|jotai|recoil|mobx|formik|react-hook-form|zod|yup|immer|@radix-ui|@chakra-ui|@mui" package.json
# Expected: EMPTY OUTPUT

# 3. Verify station preservation (hidden attribute used)
grep -rn "hidden=" src/App.jsx
# Expected: Multiple occurrences matching activeStation checks

# 4. Verify pure functions in src/lib have no React hooks
grep -rnE "use[A-Z]" src/lib/
# Expected: EMPTY OUTPUT
```

## 3. Git Workflow Rules

- **Branching**: Each milestone must be developed on its own dedicated branch (e.g. `day5/setup-and-shell`, `day5/checkin-counter`).
- **Commit Messages**: Strictly follow Conventional Commits format:
  - `feat(station): ...`
  - `fix(station): ...`
  - `test(lib): ...`
  - `docs(day5): ...`
  - `chore(day5): ...`
- **Integrity**: Never squash or create empty/fake commits. Every commit must reflect actual, working code.
