# Keyboard check: Modal, Offcanvas, Tabs, Accordion

Run on 3 November 2026 against the production build, in Chrome driven by a script, using only keyboard events. **20 of 20 checks pass.**

| Component                 | Check                                                          | Result                     |
| ------------------------- | -------------------------------------------------------------- | -------------------------- |
| Modal (swag quick view)   | Opens with Enter on its button                                 | Pass                       |
|                           | Focus moves into the modal                                     | Pass                       |
|                           | Tab and Shift+Tab (12 presses each way) never leave the modal  | Pass, see note             |
|                           | Escape closes it                                               | Pass                       |
|                           | Focus returns to the button that opened it                     | Pass                       |
| Modal (command palette)   | Ctrl+K opens it with the search input focused                  | Pass                       |
|                           | Typing then Enter navigates to the chosen page                 | Pass                       |
| Tabs (schedule)           | ArrowRight and ArrowLeft move between tabs                     | Pass                       |
|                           | Home and End jump to the first and last tab                    | Pass after a fix, see note |
|                           | `tablist`, `tab` and `tabpanel` roles are present              | Pass                       |
| Accordion (schedule)      | Enter toggles the focused header                               | Pass                       |
|                           | Space toggles it back                                          | Pass                       |
|                           | Tab moves to the next header                                   | Pass                       |
| Offcanvas (mobile drawer) | Opens with Enter on the menu button                            | Pass                       |
|                           | Focus moves into the drawer                                    | Pass                       |
|                           | Tab and Shift+Tab (14 presses each way) never leave the drawer | Pass, see note             |
|                           | Escape closes it                                               | Pass                       |
|                           | Focus returns to the menu button                               | Pass                       |

## Notes

- **The focus trap is reactive.** React Bootstrap does not block Tab. When focus leaves the dialog it pulls it back. Tab forwards from the last control rests on `<body>` once (the browser's own stop) and then returns to the start. Shift+Tab from the dialog container itself can land on a page link for a moment before it is pulled back. In every run focus settled inside the modal or drawer within 120 ms.
- **Home and End on Tabs were missing.** React Bootstrap's `Tabs` only handles the arrow keys. [`Schedule.jsx`](../src/pages/Schedule.jsx) now adds Home and End with a `keydown` handler on a wrapper element, as the WAI-ARIA tabs pattern recommends.
- **Accordion has no arrow-key support.** Bootstrap's accordion is a list of buttons, so the keys are Tab, Enter and Space. This matches the WAI-ARIA accordion pattern, where arrow keys are optional.
- **Not covered:** screen reader announcements, and Safari and Firefox. This was one browser and keyboard events only.
