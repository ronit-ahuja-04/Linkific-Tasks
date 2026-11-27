# SkillForge UI Component Library & Layout System

**Live Interactive Showcase:** `/components` ([`ComponentLibraryPage.tsx`](skillforge-lms/src/features/ui/ComponentLibraryPage.tsx))  
**Source Directory:** [`skillforge-lms/src/components/ui/`](skillforge-lms/src/components/ui/) and [`skillforge-lms/src/components/layout/`](skillforge-lms/src/components/layout/)  
**Design Tokens:** [`skillforge-lms/src/styles/index.css`](skillforge-lms/src/styles/index.css) (`--bg`, `--surface`, `--surface-2`, `--line`, `--ink`, `--muted`, `--brand`, `--gold`, `--good`, `--warn`, `--danger`)

---

## 1. Architecture & Conventions

- **Strict TypeScript:** Every component exports an explicit TypeScript interface (`ButtonProps`, `CardProps`, `InputProps`, `ModalProps`, etc.) with zero `any`.
- **Clean ESLint / React Refresh Boundary:** Style builders (`buttonClasses`, `cardClasses`, `badgeClasses`) live in [`variants.ts`](skillforge-lms/src/components/ui/variants.ts) so `.tsx` modules only export React components and erased TypeScript types (`oxlint` `react/only-export-components` stays at 0 warnings).
- **Accessible by Default:** Form fields automatically wire `useId()` to `<label>`, `aria-invalid`, and `aria-describedby`; dialogs manage focus restoration and `Escape` dismissal; loaders and errors expose `role="status"` / `role="alert"`.
- **Reduced Motion Safe:** Animated overlays respect `<MotionConfig reducedMotion="user">` and `useReducedMotion()`.

---

## 2. UI Primitives (`src/components/ui/`)

### `Button` ([Button.tsx](skillforge-lms/src/components/ui/Button.tsx))

Interactive tactile RPG button extending `ButtonHTMLAttributes<HTMLButtonElement>`. Defaults `type` to `"button"` to avoid accidental form submissions.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'gold' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Visual surface and 3D shadow treatment |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding, radius, and font size preset |
| `loading` | `boolean` | `false` | Renders spinner, sets `aria-busy="true"`, and disables clicks |
| `loadingText` | `string` | `undefined` | Optional text displayed instead of `children` while loading |
| `leftIcon` | `ReactNode` | `undefined` | Decorative leading icon (`aria-hidden="true"`) |
| `rightIcon` | `ReactNode` | `undefined` | Decorative trailing icon (`aria-hidden="true"`) |
| `fullWidth` | `boolean` | `false` | Expands button to `w-full` |

> **Link Styling Helper:** Use `buttonClasses({ variant, size, fullWidth, className })` from `src/components/ui` when styling a React Router `<Link>` as a button without nesting interactive elements.

```tsx
import { Sparkles } from 'lucide-react';
import { Button } from '../../components/ui';

<Button variant="gold" size="lg" leftIcon={<Sparkles className="h-4 w-4" />} loading={saving}>
  Start My Quest
</Button>
```

---

### `Card`, `CardHeader`, `CardBody`, `CardFooter` ([Card.tsx](skillforge-lms/src/components/ui/Card.tsx))

Composable surface container extending `HTMLAttributes<HTMLDivElement>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `as` | `'div' \| 'section' \| 'article' \| 'aside'` | `'div'` | Semantic HTML landmark tag |
| `variant` | `'default' \| 'elevated' \| 'muted' \| 'brand' \| 'gold'` | `'default'` | Surface color, gradient, or border accent |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Inner spacing (`none` recommended with `CardHeader` / `CardBody`) |
| `interactive` | `boolean` | `false` | Adds hover lift (`-translate-y-0.5`) and brand border highlight |

```tsx
<Card as="article" padding="none" interactive>
  <CardHeader><h2>Quest Summary</h2></CardHeader>
  <CardBody><p>Details</p></CardBody>
  <CardFooter>Meta</CardFooter>
</Card>
```

---

### `Badge` ([Badge.tsx](skillforge-lms/src/components/ui/Badge.tsx))

Pill indicator for skill tags, XP rewards, role markers, and HTTP/404 statuses.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tone` | `'brand' \| 'gold' \| 'good' \| 'warn' \| 'danger' \| 'neutral'` | `'brand'` | Semantic color scheme |
| `size` | `'sm' \| 'md'` | `'md'` | Compact or standard badge padding |
| `icon` | `ReactNode` | `undefined` | Optional leading icon (`aria-hidden="true"`) |

---

### `Input`, `Select`, `Textarea` ([Input.tsx](skillforge-lms/src/components/ui/Input.tsx), [Select.tsx](skillforge-lms/src/components/ui/Select.tsx), [Textarea.tsx](skillforge-lms/src/components/ui/Textarea.tsx))

Accessible form controls sharing consistent label/hint/error wiring via `useId()`.

| Prop | Component | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | All three | `string` | `undefined` | Linked `<label htmlFor={id}>` text |
| `hideLabel` | All three | `boolean` | `false` | Applies `sr-only` for compact filter bars |
| `hint` | All three | `string` | `undefined` | Helper message linked via `aria-describedby` |
| `error` | All three | `string` | `undefined` | Renders `role="alert"` message and sets `aria-invalid="true"` |
| `leftIcon` | `Input` | `ReactNode` | `undefined` | Leading icon inside the input field |
| `rightSlot` | `Input` | `ReactNode` | `undefined` | Trailing control slot (e.g., show/hide password toggle) |
| `options` | `Select` | `readonly SelectOption[]` | `undefined` | Declarative `{ value, label }[]` options (or use `children`) |
| `containerClassName` | All three | `string` | `''` | Wrapper class override |

---

### `Modal` ([Modal.tsx](skillforge-lms/src/components/ui/Modal.tsx))

Accessible dialog overlay built with `motion/react` `AnimatePresence` (`useReducedMotion()`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | Required | Controls mount/unmount animation state |
| `onClose` | `() => void` | Required | Called on `Escape`, close button, or backdrop click |
| `title` | `string` | Required | Dialog heading wired to `aria-labelledby` |
| `description` | `string` | `undefined` | Subtitle wired to `aria-describedby` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Panel max-width (`max-w-md` / `max-w-lg` / `max-w-2xl`) |
| `closeLabel` | `string` | `'Close dialog'` | Accessible label for top-right dismiss icon |
| `hideCloseButton` | `boolean` | `false` | Hides top-right `X` button |
| `closeOnBackdrop` | `boolean` | `true` | Enables clicking outside the panel to dismiss |
| `footer` | `ReactNode` | `undefined` | Bottom action bar |

---

### `LoadingState` ([LoadingState.tsx](skillforge-lms/src/components/ui/LoadingState.tsx))

Status-announced loading feedback (`role="status"`, `aria-live="polite"`).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'spinner' \| 'skeleton-cards' \| 'skeleton-rows'` | `'spinner'` | Inline spinner or animated skeleton layout |
| `label` | `string` | `'Loading...'` | Visible or `sr-only` status message |
| `count` | `number` | `3` | Number of placeholder cards/rows in skeleton modes |

---

### `ErrorState` ([ErrorState.tsx](skillforge-lms/src/components/ui/ErrorState.tsx))

Consistent error reporting (`role="alert"`) with optional recovery actions.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | `'Something went wrong'` | Heading shown in `panel` variant |
| `message` | `string` | Required | Human-readable explanation |
| `code` | `string` | `undefined` | Monospace error code label |
| `variant` | `'inline' \| 'panel'` | `'inline'` | Compact alert banner or full centered error panel |
| `actionLabel` | `string` | `'Try again'` | Retry button label when `onRetry` is provided |
| `onRetry` | `() => void` | `undefined` | Optional recovery callback |
| `actionSlot` | `ReactNode` | `undefined` | Additional action link/button slot |

---

## 3. Layout Components (`src/components/layout/`)

| Component | File | Purpose |
| --- | --- | --- |
| `AppShell` | [AppShell.tsx](skillforge-lms/src/components/layout/AppShell.tsx) | Full-height flex column shell with Skip Link, `Navbar`, `<main>` + `AppErrorBoundary`, `Footer`, `RewardOverlay`, and live toast stack |
| `Navbar` | [Navbar.tsx](skillforge-lms/src/components/layout/Navbar.tsx) | Sticky header with SkillForge brand, Demo/Live mode badge, spring active nav pill, Lv/XP/Streak HUD, sound/theme toggles, and sign-in / sign-out controls |
| `Footer` | [Footer.tsx](skillforge-lms/src/components/layout/Footer.tsx) | Semantic `<footer>` with Explore Realms links (including `/components`), Adventurer Account links, and tech stack metadata |
| `PageHeader` | [PageHeader.tsx](skillforge-lms/src/components/layout/PageHeader.tsx) | Reusable page heading with optional back breadcrumb, eyebrow icon/label, title, description, and right-aligned actions slot |
