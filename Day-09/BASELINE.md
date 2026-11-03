# Day 8 baseline (Tailwind)

Measured on 3 November 2026 from `Day-08/hackhq-tailwind` with `npm run build` and `npm test`. M7 compares the finished Day 9 app against these figures.

| Measure                              | Day 8 (Tailwind)        | Day 9 M1 (Bootstrap, unrestyled) |
| ------------------------------------ | ----------------------- | -------------------------------- |
| CSS, raw                             | 71.62 kB                | 239.53 kB                        |
| CSS, gzipped                         | 15.01 kB                | 34.63 kB                         |
| JS, raw                              | 421.03 kB               | 421.03 kB                        |
| JS, gzipped                          | 125.73 kB               | 125.73 kB                        |
| Tests                                | 76 of 76 passing        | 76 of 76 passing                 |
| Lint                                 | 0 errors, 2 warnings    | 0 errors, 2 warnings             |
| `.jsx` files                         | 44                      | 44                               |
| `.jsx` lines                         | 5,435                   | 5,435                            |
| `.js` lines (src)                    | 1,178                   | 1,178                            |
| Custom CSS lines (`index.css`)       | 226                     | 126                              |
| `className=` attributes              | 766                     | 766                              |
| Class tokens in static `className`   | 2,708                   | 2,708                            |
| Unique class tokens                  | 498                     | 498                              |

## Notes

- The Day 9 M1 column is a snapshot right after the swap. The JSX still carries the Tailwind class names, which do nothing now, so the markup rows only change from M2 on.
- Bootstrap ships its whole stylesheet, so the CSS is larger than Tailwind's per-use output. Day 8's figure only includes the classes the app uses. The final M7 figures are the ones that count.
- JS is unchanged because `react-bootstrap` is installed but not imported yet.
- Class tokens count only strings written directly in `className="..."`. Template-literal and conditional classes are not in that figure.
- Node used: v25.9.0 (Homebrew). `npm` is not on the default PATH in this shell, so commands need `/opt/homebrew/bin` added.
