# Design spec: HackHQ

Companion to `Day5_PRD.md`. Requirement IDs such as `CI-6` refer to the PRD. Follow this file for every visual decision. If something is not covered here, choose the option that matches the venue-signage idea below, and never fall back to a generic dashboard look.

## 1. Subject, audience and job

- **Subject:** running a hackathon on the day itself.
- **Audience:** the organizer working fast on a phone or laptop, and reviewers who watch a four-minute demo.
- **Primary job:** glanceable control. How many people are in, what is left to set up, who has registered, what has been sold.
- **Vernacular to draw from:** venue signage, airport departure boards, name badges on lanyards, thermal receipts, gaffer tape, whiteboards.

## 2. Design plan and the check against generic defaults

**First idea (rejected):** a dark dashboard with a neon accent, identical rounded cards with soft shadows, a trendy geometric sans, small all-caps labels above every heading. It would look the same for any app, so it says nothing about a hackathon.

**Chosen direction: venue signage.** Clear, loud only where it matters, quiet everywhere else. Panels are separated by hairline rules and space, not by boxed cards. Two things are allowed to look like physical objects because they are: the name badge (Teams) and the receipt (Swag shop).

**The one memorable element:** the split-flap check-in board. Spend all the boldness there and keep the rest disciplined.

**Review result:** the palette (cobalt, gaffer-tape yellow, signal red, mint on a cool off-white or deep blue-black) avoids the cream-and-terracotta and the near-black-plus-acid-accent defaults. The type pairing is wayfinding-style, not the usual geometric sans. Layout avoids the identical-card kit. No eyebrow labels, no all-caps tags, no monospace labels, no middle-dot meta strings, no arrows appended to buttons.

## 3. Tokens

### Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#F2F4F0` | `#0F1720` | Page background |
| `ink` | `#15202B` | `#E7ECEF` | Text and icons |
| `rule` | `#D5DAD2` | `#26323F` | Hairlines and dividers |
| `lanyard` | `#2F5BFF` | `#8AA2FF` | Primary actions, links, focus ring |
| `tape` | `#FFC93C` | `#FFC93C` | Flap digits, warnings, highlights |
| `signal` | `#C42B31` | `#FF6B70` | Errors, full capacity, destructive actions |
| `mint` | `#0F7A64` | `#3DD6B0` | Done, success |
| `board` | `#101820` | `#0A1118` | The flap board and the State X-ray (a dark surface in both themes, with a 1 px `rule` border in dark mode) |

Contrast figures are my estimates, so check them with DevTools or an accessibility checker: lanyard on paper about 4.7:1, white text on lanyard about 5.2:1, signal on paper about 5.1:1, mint on paper about 4.8:1, tape on board about 11:1, dark-mode lanyard on dark paper about 7.5:1.

Input borders use `ink` at 55% opacity to reach 3:1. Hairlines are decorative and may be lighter. Status is never color alone: pair color with a word or an icon.

### Typography

| Role | Typeface | Weights |
|---|---|---|
| Display, station names, flap digits, wordmark | Barlow Condensed | 600, 700 |
| Interface and body | Public Sans | 400, 500, 600 |
| Code (State X-ray only) | System monospace | 400 |

Self-host both fonts with the Fontsource packages (see `Day5_TECH_STACK_AND_ARCHITECTURE.md`), so there are no external font requests.

- Type scale: 13, 16 (body), 18, 22, 30, 44, and 72 or 96 for the flap digits.
- Body line height 1.5, headings 1.1 to 1.2, line length under 68 characters.
- Tabular numerals (`font-variant-numeric: tabular-nums`) for counts, prices and totals.
- Sentence case everywhere. Do not accent one word in a heading. Do not add labels above headings.

### Shape and depth

- Radius: 4 px for controls. 16 px only for the badge and the receipt. Panels have no radius and no shadow.
- Shadow: only on the badge and receipt, because they are paper objects.
- Spacing scale: 4, 8, 12, 16, 24, 40, 64.

## 4. Layout

**Concept:** a control room with a left rail of stations and one working area. The State X-ray sits beside the working area on wide screens and slides up as a sheet on phones. Content is left aligned. Numbers in the receipt are right aligned.

```
Desktop, 1280 px
+----------------------------------------------------------------------+
| HackHQ                                    [X-ray on]  [Dark mode  o ] |
+-----------+-----------------------------------------+----------------+
| Check-in  |  People inside                          | State X-ray    |
| Checklist |  +-----+-----+-----+                    | {              |
| Teams     |  |  1  |  2  |  7  |  of 200            |   "count": 127,|
| Swag shop |  +-----+-----+-----+  (flap board)      |   "capacity":  |
| State lab |  [-1] [+1] [+5 group] [Reset]           |     200        |
|           |  Capacity [ 200 ]   ===========----     | }              |
|           |  Nearly full                            |                |
+-----------+-----------------------------------------+----------------+

Phone, 375 px
+--------------------------+
| HackHQ        [X] [Dark] |
+--------------------------+
| People inside            |
| [ 1 ][ 2 ][ 7 ] of 200   |
| [-1] [+1] [+5] [Reset]   |
| Capacity [200]           |
| ======----  Nearly full  |
+--------------------------+
| Check Task Teams Swag Lab|
+--------------------------+
```

Breakpoints: below 768 px single column with a bottom bar; 768 to 1023 px single column with a wider working area; 1024 px and up rail plus working area, with the X-ray beside it from 1280 px.

## 5. Station treatments

**Check-in.** The flap board is a `board`-colored block with three digits, each about 72 px wide by 96 px high on desktop (48 by 72 on phones), `tape`-colored digits in Barlow Condensed 700, and a hairline across the middle of each digit like a split flap. To its right, the words "of 200" in `ink`. Under it: the buttons (primary is +1, others are quiet), the capacity input, and a 10 px capacity bar with ticks at 80% and 100% plus the status in words. Fixed digit widths prevent layout shift.

**Checklist.** Ruled strips like a whiteboard list: one hairline between rows, no boxes. A 24 px square checkbox, mint check when done, the text struck through and dimmed. A thin progress bar under the heading with "3 of 5 done". Filters (All, Open, Done) are a text segmented control with counts.

**Teams.** On desktop, the form on the left and a sticky **name badge** preview on the right (portrait, rounded 16 px, a lanyard slot at the top, the team name large in Barlow Condensed, the track as a colored band, member names listed). Each field has a label above it, the error text below it in `signal` with an icon. Member rows are compact with a small remove button. On phones the badge sits above the form and collapses to one line when empty.

**Swag shop.** Products are a ruled list (name, a one-line description, price right aligned, an Add button), not identical product cards. The cart is a **receipt** at the right: off-white paper in both themes, perforated top and bottom edges made with a CSS mask, tabular numerals, line items, a coupon field, then subtotal, discount and total.

**State X-ray.** A `board`-colored panel with 13 px monospace, one accent color for keys, strings in `mint`, numbers in `tape`. It has a clear heading ("State X-ray: Check-in") and a one-line explanation of what it shows.

**State lab.** Two columns, "Wrong way" and "Right way". Each is labelled with an icon and a word, not color alone. Under each, the result and a two-sentence explanation.

**Toasts.** Slim bars at the bottom on phones and bottom right on desktop, a message and an optional action ("Undo"). They announce politely and never steal focus.

## 6. Motion

| Moment | Spec |
|---|---|
| **The one orchestrated moment** | On first load the three flap digits settle from 0 to the current value, staggered by about 80 ms, 600 ms total. Plays once. |
| Flap flip | When a digit changes, a 260 ms `rotateX` flip. Replay it by remounting the digit with `key={digit}` so a CSS keyframe runs again. |
| List changes | Adding or removing a task, cart line or toast animates height and opacity over 160 to 200 ms (Motion `AnimatePresence`). This answers the user's action. |
| Confetti | One burst when every task is done. |
| Theme change | 200 ms color transition. |
| Reduced motion | Everything above is off or instant under `prefers-reduced-motion: reduce`. Wrap the app in `MotionConfig` with `reducedMotion="user"`, and use a CSS media query for keyframes. |

Not allowed: fade-and-slide-up on every section, hover animations on every card, parallax, looping decorative animation, gradient washes.

## 7. Copy

Plain, sentence case, active voice, and the same verb for the button and the confirmation.

| Button | Confirmation |
|---|---|
| Add task | Task added |
| Register team | Team registered |
| Add to cart | Added to cart |
| Place order | Order placed: 4 items, ₹1,846 |
| Reset | Count reset |

- **Errors say what to do:** "Team name needs at least 3 characters." "Enter a 10-digit phone number or leave it blank." "That code is not valid. Try HACK10."
- **Empty states invite action:** "No tasks yet. Add one above, or load the starter list." "Nothing in the cart. Add something from the list."
- **Status in words:** "Plenty of room", "Nearly full", "Full".
- Sample product names and prices are placeholders, and the README says so.

## 8. Accessibility specifics

- Every control is a real `<button>`, `<input>`, `<select>` or `<a>`. No clickable `div`.
- Visible `:focus-visible` ring in `lanyard`, 2 px with 2 px offset, never removed.
- Flap board: the digits are `aria-hidden`; a visually hidden live region says "127 of 200 inside".
- Capacity bar: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and a label.
- Form errors: `aria-invalid`, linked with `aria-describedby`; the error summary is announced on submit.
- Toast region: `aria-live="polite"`. Theme switch: `role="switch"` and `aria-checked`. Navigation: `aria-current="page"` on the active station.
- Hidden stations use the `hidden` attribute so assistive technology skips them.
- Touch targets of at least 44 by 44 px.

## 9. Design review before every PR

- Does it still read as venue signage, or has it drifted toward a generic dashboard?
- Is the flap board the only loud thing? Remove one decoration if two compete.
- Does anything rely on color alone?
- Does it work at 375, 768 and 1280 px, in both themes?
- Tab through it. Is the focus always visible?
- Turn on reduced motion. Is every animation off?
- Read the copy aloud. Is each string specific, short and in sentence case?
