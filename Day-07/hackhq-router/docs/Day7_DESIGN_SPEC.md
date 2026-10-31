# Design spec: HackHQ Router (Day 7)

Companion to `Day7_PRD.md`. Requirement IDs such as `NV-3` and wow items `W1`–`W5` refer to the PRD. This file covers the **Day 7 additions**: information architecture, navigation states, the five wow moments, and the new pages. For older stations, the tokens below describe what the code actually uses today.

## 1. Subject, audience and job

- **Subject:** the hackathon control room, now with an address for every station.
- **Audience:** organizers moving fast between tools, and reviewers watching a four-minute demo of routing concepts.
- **Primary job:** know where you are, get anywhere in one move, and never lose your place on refresh or Back.
- **Day 7 design idea:** _the URL is part of the interface._ Routes, params and history are shown, not hidden: the route badge prints the matched pattern, cards show their path, and the navigation patterns page draws the history stack.

## 2. Relationship to earlier specs (honest drift note)

`Day5_DESIGN_SPEC.md` described a "venue signage" look (cobalt, tape yellow, no shadows, no eyebrow labels, no monospace labels). During Day 6 the UI was restyled into a **violet/indigo glass control room** (gradient brand mark, frosted header and sidebar, rounded cards). Day 7 builds on that **Day 6 visual language as shipped**, not on the Day 5 spec. Several Day 5 "don'ts" are deliberately used on Day 7 because they now carry meaning:

| Day 5 rule             | Day 7 use                                             | Why it earns its place                         |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| No monospace labels    | Paths on cards, route badge, palette hints            | The path _is_ the content on a routing day     |
| No eyebrow labels      | One eyebrow on the Home hero ("Day 7 · React Router") | Sets context for the demo                      |
| Do not accent one word | Gradient on "an address."                             | The one headline that states the Day 7 promise |
| No arrows on buttons   | Arrow on card paths, pager, Back                      | Arrows indicate direction of navigation        |

## 3. Tokens (as used in `src/index.css`)

### Color (dark theme shown; light theme mirrors via `.dark` overrides)

| Token                               | Dark                       | Use on Day 7                                             |
| ----------------------------------- | -------------------------- | -------------------------------------------------------- |
| `--color-bg-base`                   | `#090c15`                  | Page background, with violet radial glows                |
| `--color-card-bg`                   | `rgba(16, 21, 35, 0.85)`   | Cards, hero, login, palette rows                         |
| `--color-card-border`               | `rgba(139, 92, 246, 0.22)` | Card and panel borders                                   |
| `--color-ink` / `--color-ink-muted` | `#f8fafc` / `#8e98b0`      | Text                                                     |
| `--color-lanyard`                   | `#818cf8`                  | Links, active accents, paths, focus ring                 |
| Brand gradient                      | `#7c3aed → #6366f1`        | Primary buttons, icon tiles, brand mark                  |
| `--color-board`                     | `#101522`                  | Route badge, code chips, 404 screen                      |
| `--color-tape`                      | `#fcd34d`                  | Param values in the route badge, missing path on the 404 |
| `--color-mint`                      | `#34d399`                  | Signed-in pill, success page                             |
| `--color-signal`                    | `#f87171`                  | Errors, demo-guard warning, 404 antenna                  |

Category tones for product visuals (W4): Stickers violet→indigo, Apparel indigo→sky, Drinkware teal→emerald, Hardware amber→rose, Accessories pink→violet.

### Typography

- Display and body: Public Sans, self-hosted at weights 400, 500 and 600 only. Day 7 headings ask for 700–800 with negative tracking (−0.03 to −0.06em), so the browser currently **synthesizes** the bolder weights. Follow-up: import `@fontsource/public-sans/700.css` (and 800 if kept) so the heavy headings render true. Barlow Condensed 600/700 is still imported (from Day 5), but no rule references it anymore, so it is dead weight in the bundle.
- Monospace (system) for paths, params, code snippets and keyboard hints.
- Tabular numerals for prices, counts and the product index ("02 / 06").

### Shape and depth

- Radius: 8 px controls, 12–18 px rows and pills, 20–22 px cards, full pill for badges.
- Depth: soft shadows on hero, palette, login and the sticky cart bar only. Everything else uses a border.

## 4. Information Architecture

```
Sidebar (order = priority)
  Mission control  /
  Directory        /directory(/:userId)
  Hack Clock       /clock
  Patterns         /patterns  (+ /patterns/navigation)
  Checklist        /checklist
  Teams            /teams
  Swag shop        /swag      (+ /swag/:productId)
  Organizer        /organizer (guarded: checkin, lab)
  Contact          /contact   (+ /contact/sent)
  About            /about
Header: logo → /, Jump to… (⌘K), Log in | Organizer·Log out, State X-ray, theme
```

- Check-in and State lab moved out of the public sidebar into the guarded Organizer area; their old URLs redirect.
- Child pages keep their parent highlighted (NV-3), so the sidebar always answers "where am I".
- Breadcrumbs mirror the URL: `CONTROL ROOM / SWAG / SWAG-TEE`.

## 5. Navigation States

| Element           | Default                              | Hover / focus                              | Active (current route)                                                                    |
| ----------------- | ------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Sidebar link      | Muted ink, no border                 | Faint violet fill                          | Violet tint fill, violet border, bold, glowing accent bar at right; `aria-current="page"` |
| Mobile bottom bar | Icon + small label, scrolls sideways | —                                          | Same tint, no accent bar                                                                  |
| Home card         | Card border                          | Lifts 4 px, violet glow, arrow slides 4 px | —                                                                                         |
| Pager link        | Card border                          | Slides 3 px toward its direction           | —                                                                                         |
| Palette row       | Muted                                | Pointer move = active                      | Violet tint + inset ring + ↵ icon                                                         |

## 6. Page Treatments

| Page                | Treatment                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mission control     | Hero with a slowly rotating conic glow, a gradient headline, and a three-stat row; a grid of station cards with stagger-in, each showing its path                                                                                     |
| Directory           | Day 6 two-column layout; the header gains Back (when a user is selected) and the route badge                                                                                                                                          |
| Product detail (W4) | Two-column hero: square gradient visual with pulsing and dashed rotating rings and a floating category icon; info column with category tag, large title, gradient price, three-up specs; wrap-around pager; sticky glass purchase bar |
| Product not found   | Calm empty state that explains "the route matched, the data didn't"                                                                                                                                                                   |
| Navigation patterns | Four cards with a code chip, one-line explanation, history-stack diagram (current entry highlighted, replaced entries struck through) and action buttons                                                                              |
| Contact             | Single card, two-up name/email, topic select, message with live character counter; inline errors                                                                                                                                      |
| Contact sent        | Mint-tinted card, pop-in check icon, explains `replace` and invites pressing Back                                                                                                                                                     |
| Login               | Centered card, gradient lock tile, password field with key icon, visible demo passcode, red-tinted "demo guard only" warning                                                                                                          |
| Organizer           | Guarded pill, explanation of the guard, two cards in the Home card style                                                                                                                                                              |
| 404 (W2)            | Dark board screen with animated static, scanlines and a sweeping band; glitching `404` (red/indigo split); "Signal lost"; the missing path in tape yellow; four suggested links                                                       |

## 7. Motion

| Motion          | Spec                                                                             | Trigger                                                        |
| --------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Page enter (W1) | 420 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, opacity 0→1, translateY 14→0, blur 4→0 | Every route mount; product hero also on product change (`key`) |
| Card stagger    | 520 ms rise, +45–60 ms per item                                                  | Home grid, patterns cards                                      |
| Palette         | Backdrop fade 160 ms; panel 220 ms scale 0.97→1                                  | Open                                                           |
| Product visual  | Icon float 5 s loop; inner ring pulse 4 s; outer dashed ring 30 s rotation       | Continuous                                                     |
| 404             | Static jitter 0.4 s steps; scan sweep 3.2 s; glitch bursts every 2.4 s           | Continuous                                                     |
| Success / lock  | 520 ms overshoot pop-in                                                          | Mount                                                          |

All animation is CSS. The Day 5 `prefers-reduced-motion` rule shortens every animation and transition to near zero, so continuous loops stop for users who ask.

## 8. Copy

- Voice: control-room, short, plain. "Signal lost", "Unlock organizer area", "Jump to…".
- Teaching copy is literal about the mechanism: "The form was submitted with `navigate('/contact/sent', { replace: true })`. Press Back: it skips the form you already sent."
- Error copy says what happened and what to do: "That passcode did not open the door." / "Write at least 20 characters."
- Honesty copy is visible, not buried: "Demo guard only. Anything in client JavaScript is public; real auth must be enforced by the server."

## 9. Accessibility Specifics

| Area              | Spec                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Links vs buttons  | Navigation is always an `<a>` (`Link`/`NavLink`); actions are `<button>`. No link wraps a button.                                                                                                                        |
| Current page      | `NavLink` sets `aria-current="page"`; tab roles removed from the sidebar                                                                                                                                                 |
| Palette           | `role="dialog"` + `aria-modal`; input `role="combobox"` with `aria-controls`, `aria-activedescendant`; list `role="listbox"`, rows `role="option"` + `aria-selected`; Esc closes; header trigger has `aria-keyshortcuts` |
| Forms             | Every input labelled via `useId`; `aria-invalid` + `aria-describedby`; errors in `role="alert"`                                                                                                                          |
| Route badge       | `aria-label="Matched route …"`                                                                                                                                                                                           |
| Decorative motion | Static, scanlines, rings and glows are `aria-hidden`                                                                                                                                                                     |
| Color             | Status always paired with text (Guarded, Organizer, Unknown participant)                                                                                                                                                 |

**Not yet done:** screen-reader walkthrough, measured contrast audit of the new gradients, focus trap inside the palette.

## 10. Responsive

| Width     | Behaviour                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| ≥ 1024 px | Floating sidebar rail, two-column product hero                                                             |
| < 1024 px | Bottom nav bar, horizontally scrollable (10 links); viewport badge and sticky cart bar lifted above it     |
| ≤ 900 px  | Product hero stacks; visual becomes 16:11 with rings kept circular (height-based)                          |
| ≤ 640 px  | Header controls become 40 px icon buttons (palette, auth, X-ray labels hidden); pager stacks; specs two-up |

Checked at 1440 px and 500 px in headless Chrome. 375 px and real phones not yet checked.

## 11. Design Review Checklist (per PR)

1. Does every new link use `Link`/`NavLink`, and is the active state correct on child URLs?
2. Is any new motion CSS-only and covered by reduced motion?
3. Does the new page show its routing concept (path, param, or history) rather than hide it?
4. Mobile at 500 px: no overlap with the bottom nav, viewport badge or sticky bar?
5. Errors and statuses readable without color?
