# Day 10 Standup Walkthrough (about 5 minutes)

Speak at a relaxed pace, roughly 700 words in total. Keep `npm run dev` running at http://localhost:5173 with the browser open on the Home page.

## 0:00 to 0:30, Opening (say)

"Morning everyone. Day 10 was CSS-in-JS with styled-components. Rather than build a toy demo, I carried HackHQ forward. I took the Day 9 Bootstrap app, removed Bootstrap completely, and restyled the whole app with styled-components. Same features, same tests, new styling layer."

## 0:30 to 1:30, What and why (say)

"Three things to know. One: the whole app is now styled with styled-components. About 45 files, no Bootstrap left. Two: there is a ThemeProvider with a light and dark theme, so the toggle switches colours across every component without any component knowing about it. Three: there is a shared component library and a showcase page I'll show you now."

## 1:30 to 3:00, Live demo (do and say)

1. **Home page.** "This is HackHQ, same look as Day 9 but now fully styled with styled-components."
2. **Header theme toggle.** Click it. "One switch, and the ThemeProvider value changes. Every component re-styles. It's saved in localStorage."
3. **Resize the window.** "Layout uses a Grid primitive with media queries from the theme, so it collapses on mobile, and the nav turns into a drawer."
4. **Open `/kit`.** "This is the component library."
   - Buttons: "One Button component, five variants, three sizes, a loading state. Variants are props starting with a dollar sign, so they never leak into the HTML."
   - The `as` button: "The same Button renders as a link, using the `as` prop. That replaced Bootstrap's class helper."
   - Input: "Type a bad email. The invalid prop changes the border, focus ring and message."
   - Meter: "Click plus and minus. Styles depend on props: green, then amber, then red."
   - Modal: "Hand-built with keyframe animation, Esc and backdrop close."
5. **Quick tour (optional):** Announcements, Schedule tabs, Swag. "All of these were Bootstrap components last week."

## 3:00 to 4:00, Code walkthrough (do and say)

Open `src/components/ui.jsx`, scroll to Button.

"Here is the whole idea. A tagged template, with variants held in a css helper. The colours come from the theme, so changing the theme file changes the whole app."

Open `src/styles/theme.js`.

"Light and dark have the same shape. That's the entire theming system."

## 4:00 to 4:40, Numbers and comparison (say)

"I measured it against the Day 9 build. The CSS file dropped from 243 kB to 7.5 kB. The JavaScript grew about 9 kB gzipped because styles now ship in the bundle. Overall transfer is lower, about 163 versus 186 kB gzipped. Quality checks: build passes, lint has no errors, all 134 tests pass, and all 18 routes render without errors.

The comparison document covers plain CSS, CSS Modules, Tailwind and styled-components. My takeaway: styled-components is great for themeable, prop-driven design systems. Tailwind or CSS Modules are better when you want zero runtime or server rendering."

## 4:40 to 5:00, Blockers and next (say)

"Honest gaps: I haven't done a full manual pass in a browser yet, and I replaced Bootstrap's modal, tabs and drawer by hand, so those need a careful accessibility check. Next I'll do that pass, add screenshots, and write component tests for the overlays. No blockers. Everything is merged: PR 49, with the report and README in the Day-10 folder."

## Backup answers for likely questions

- **Why not keep Bootstrap?** The day's goal was CSS-in-JS. Carrying the real app gave a fair comparison.
- **Performance cost?** Small runtime, about 9 kB gzip more JS. Styles are injected at render, which also makes server rendering harder.
- **Is styled-components still a good choice?** It's in maintenance mode as far as I know, so for new projects I'd weigh Tailwind, CSS Modules or a zero-runtime library. I'd check its current status first.
- **How is theming done?** `ThemeProvider` takes a theme object, and every component reads `theme.colors.*`.
- **What broke during the migration?** `.withComponent()` was removed in v6, and non-transient props leaked to the DOM, so variant props use a `$` prefix.
- **Testing?** 134 unit tests still pass, plus a server-render check of all routes. UI behaviour of overlays still needs manual testing.
