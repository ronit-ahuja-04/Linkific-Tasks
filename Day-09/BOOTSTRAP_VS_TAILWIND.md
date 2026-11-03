# Bootstrap vs Tailwind

Written after building the same app twice: HackHQ in Tailwind CSS 4 (Day 8) and in Bootstrap 5.3 with React Bootstrap (Day 9). Every figure below was measured on these two builds. The raw numbers are in [BASELINE.md](BASELINE.md).

## Short answer

- **Pick Bootstrap** when you want working components today (modals, tabs, accordions, validation styling, a grid) and a consistent look without designing one. It needed less vocabulary per screen, and its modals, tabs and drawer passed a keyboard audit without extra code. I did not run the same audit on the Tailwind app, so that is not a comparison.
- **Pick Tailwind** when the design is your own and has to look exactly right, when you want the smallest CSS, and when you are happy to build or import your own components.
- Neither made the app faster to load in a way I could measure on localhost. The difference shows up in bytes on a slow connection and in how much you fight the framework.

## What I measured

Fair comparison: Day 8 against Day 9 at the end of the restyle (milestone M3), which has the same pages and behaviour. The shipped Day 9 app adds two features and is not comparable line for line.

| Measure                              | Tailwind (Day 8)         | Bootstrap (Day 9 M3)      | Difference                                |
| ------------------------------------ | ------------------------ | ------------------------- | ----------------------------------------- |
| CSS, gzipped                         | 15.01 kB                 | 35.59 kB                  | 2.4 times larger                          |
| JS, gzipped                          | 125.73 kB                | 142.09 kB                 | +16.4 kB (React Bootstrap)                |
| First contentful paint (median of 9) | 88 ms                    | 88 ms                     | none                                      |
| DOM elements on the home page        | 377                      | 374                       | none                                      |
| Unique class names in the markup     | 498                      | 231                       | 54% fewer                                 |
| Class names written in `className`   | 2,708                    | 2,107                     | 22% fewer                                 |
| Inline `style` attributes            | 10                       | 114                       | 11 times more                             |
| `.jsx` lines                         | 5,435                    | 5,763                     | +6%                                       |
| Custom CSS lines                     | 226                      | 368                       | +63%                                      |
| CSS bytes actually used (4 pages)    | 57.1 kB of 71.6 kB (80%) | 28.4 kB of 243.1 kB (12%) | Bootstrap ships much more it does not use |

How to read this:

- **Bytes.** Bootstrap sends its whole stylesheet. Tailwind sends only the classes the code uses. Together with React Bootstrap, Day 9 ships about 37 kB more gzipped data than Day 8 (20.6 kB CSS plus 16.4 kB JS). As arithmetic, not a measurement, that is roughly 185 ms on a 1.6 Mbps connection, and the CSS part (about 100 ms) blocks rendering.
- **Speed on localhost.** First paint was identical at 88 ms and DOM size matched. A local, uncompressed run hides the byte difference, so I do not claim either is faster.
- **Vocabulary.** Bootstrap needed less than half as many distinct class names. Components such as `Card`, `Form` and `ListGroup` stand in for many separate utilities.
- **Escape hatches.** Bootstrap has no arbitrary values, so one-off sizes, gradients, a dark panel and a clamp() font size became inline styles: 10 in Tailwind, 114 in Bootstrap. In Tailwind the same things were `[...]` classes.
- **Lines.** JSX grew 6%, because nested React Bootstrap components wrap onto more lines. Custom CSS grew because Bootstrap's colours and radii are changed by overriding `--bs-*` variables.

## What was easier in each

| Task in this project                | Bootstrap                                                            | Tailwind                                                       |
| ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Modal with focus trap and Escape    | `Modal` gave it for free and passed the keyboard audit               | Build it, or add a headless library                            |
| Tabs, accordion, offcanvas drawer   | Components, with ARIA roles already in place                         | Build them                                                     |
| Validation styling                  | `isInvalid` plus `Form.Control.Feedback`                             | Class strings per state, `aria-[invalid=true]` variants        |
| Responsive grid                     | `Row`, `Col`, `row-cols-*`, offset and order                         | `grid`, `grid-cols-*` per breakpoint, flexible                 |
| Dark mode                           | `data-bs-theme` and classes such as `bg-body-tertiary` flip together | Semantic tokens plus `@theme inline`, equally good once set up |
| A look that is not Bootstrap's      | Override variables, add a few classes (`btn-brand`)                  | Native: it is the point of the tool                            |
| One-off visual effects              | Inline styles                                                        | Arbitrary value classes                                        |
| Deleting a component and its styles | Safe, since styles are shared                                        | Safe, since styles live in the markup                          |

## When to use Bootstrap

- An internal tool, admin panel or dashboard where consistency matters more than brand.
- A team that wants a shared vocabulary and ready, accessible components.
- A prototype or a static page: two CDN tags are enough (see `hackhq-bootstrap/cdn-demo.html`).
- A project that already uses Bootstrap, or a content site built from standard components.

## When to use Tailwind

- A product with its own design system, where the interface must not look like a framework.
- A project where CSS size matters, such as first-visit performance on slow mobile networks.
- Teams comfortable writing or adopting component code (for example with a headless library).
- Heavy custom visuals, which Tailwind's arbitrary values handle without leaving the markup.

## Pros and cons

|      | Bootstrap                                                                                                                                                      | Tailwind                                                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pros | Complete components. Familiar to many developers. Colour modes built in. Strong accessibility defaults. Small vocabulary.                                      | Smallest CSS output. Total design freedom. No fighting default styles. Variants for state, breakpoints and ARIA in one place.                      |
| Cons | Largest CSS shipped, mostly unused. Sites can look alike. Inline styles needed for one-offs. Its JavaScript conflicts with React, so you need React Bootstrap. | No components, so you build them. Long class strings. A new vocabulary to learn. Easy to end up with inconsistent spacing without a design system. |

## Things I hit while building this

- **Bootstrap's JavaScript fights React.** `data-bs-toggle` edits the DOM directly. In the app I used React Bootstrap, where React owns the state. The plain-attribute version only appears in the CDN demo.
- **Wrapper components hide the vocabulary.** My `Button` wrapper maps `primary` to `btn-brand`. Passing a real Bootstrap variant such as `outline-light` through it would have produced a class that does not exist, so those buttons use React Bootstrap's `Button` directly.
- **Feedback text can disappear.** `.invalid-feedback` is hidden unless a sibling has `.is-invalid`. Error text placed away from its input needs `d-block`.
- **Utility classes use `!important`.** Bootstrap spacing utilities can be overridden only by other utilities, and a later utility of the same kind wins by stylesheet order, not by class order.
- **Fixed widths and positions are not utilities.** Sticky-at-a-breakpoint for one column, `min-width: 0` and exact icon sizes needed small custom classes or inline styles.
- **Tabs keyboard support is partial.** React Bootstrap handles the arrow keys, but Home and End had to be added by hand.
- **Accordion headers are buttons.** Controls for each item go in the body, not the header.

## Caveats

- Day 9 reused a design that already existed from Day 8, so I did not measure how long each approach takes to design from scratch. I do not claim either is quicker to build.
- Both apps are small (about 45 JSX files). The ratios could look different at scale, especially for Tailwind's output size, which grows with the number of distinct classes used.
- Timings are from one machine on localhost with no compression or throttling.
- The M3 build also contains a modal helper and the swag Quick view, so its JS figure is a little higher than a pure restyle.
- Source counts are rough: JSX line counts include Prettier wrapping, and class counts include only strings written directly in `className="..."`.
