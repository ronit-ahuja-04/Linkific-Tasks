# Day 8 baseline and Day 9 results

Measured on 3 November 2026 on one machine (macOS, Chrome headless, `vite preview` on localhost, no network throttling, no compression). The Day 9 numbers come from two builds:

- **Day 9 M3** is the commit right after the restyle (PR #43), before the Announcements and Schedule features. It has the same pages and behaviour as Day 8, so it is the fair column to compare with Tailwind.
- **Day 9 final** is the shipped app, with both new features.

The M3 build also contains `ContentModal` and the swag Quick view, which Day 8 does not have, so it is slightly larger than a pure restyle would be.

## Build and source

| Measure                            | Day 8 (Tailwind) | Day 9 M3 (Bootstrap) | Day 9 final      |
| ---------------------------------- | ---------------- | -------------------- | ---------------- |
| CSS, raw                           | 71.62 kB         | 243.06 kB            | 242.95 kB        |
| CSS, gzipped                       | 15.01 kB         | 35.59 kB             | 35.53 kB         |
| JS, raw                            | 421.03 kB        | 474.87 kB            | 509.29 kB        |
| JS, gzipped                        | 125.73 kB        | 142.09 kB            | 152.29 kB        |
| Tests                              | 76 of 76         | 76 of 76             | 134 of 134       |
| Lint                               | 0 errors, 2 warn | 0 errors, 2 warn     | 0 errors, 2 warn |
| `.jsx` files                       | 44               | 45                   | 50               |
| `.jsx` lines                       | 5,435            | 5,763                | 6,528            |
| `.js` lines (src)                  | 1,178            | 1,178                | 1,720            |
| Custom CSS lines (`index.css`)     | 226              | 368                  | 366              |
| `className=` attributes            | 766              | 707                  | 767              |
| Class tokens in static `className` | 2,708            | 2,107                | 2,262            |
| Unique class tokens                | 498              | 231                  | 245              |
| Inline `style={{` attributes       | 10               | 114                  | 104              |
| Files importing `react-bootstrap`  | 0                | 31                   | 36               |

## Runtime (Day 8 against Day 9 M3, home page, median of 9 cold loads)

| Measure                                       | Day 8 (Tailwind)               | Day 9 M3 (Bootstrap)            |
| --------------------------------------------- | ------------------------------ | ------------------------------- |
| First contentful paint                        | 88 ms                          | 88 ms                           |
| DOMContentLoaded                              | 40 ms                          | 43 ms                           |
| DOM elements on the home page                 | 377                            | 374                             |
| CSS used across home, swag, contact, sponsors | 57,091 of 71,621 bytes (79.7%) | 28,373 of 243,061 bytes (11.7%) |

## Notes

- Class tokens count only strings written directly in `className="..."`. Template-literal and conditional classes are not in that figure.
- JSX lines include Prettier's line wrapping, so nested React Bootstrap components add lines without adding logic.
- CSS used comes from Chrome's CSS coverage over four page loads at 1440 px. It counts rules that matched an element, not rules a feature might need later.
- Timings are local and uncompressed. They say nothing about a real network, where the larger Bootstrap CSS matters more. See [BOOTSTRAP_VS_TAILWIND.md](BOOTSTRAP_VS_TAILWIND.md).
- Node used: v25.9.0 (Homebrew). `npm` is not on the default PATH in this shell, so commands need `/opt/homebrew/bin` added.
