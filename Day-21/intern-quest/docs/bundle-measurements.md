# Bundle measurements (Day 21, milestone 5)

**What is measured:** the JavaScript a browser downloads to open each page, summed over every script file, gzipped
(roughly what travels over the network). Production build, Chrome, measured with `scripts/measure-js.mjs`
(`npm run build && npx next start -p 3122`, then `node scripts/measure-js.mjs`). The interactive module map is
available with `npx next analyze`.

| Page | M4 (before) | M5 (after) | Change |
|---|---|---|---|
| `/` | 207.5 KB | 196.8 KB | −10.7 KB (−5%) |
| `/login` | 192.9 KB | 192.1 KB | −0.8 KB |
| `/c/ronit` | 207.5 KB | 196.8 KB | −10.7 KB (−5%) |
| `/journal` | 221.4 KB | 207.8 KB | −13.6 KB (−6%) |
| `/journal/new` | 215.5 KB | 202.1 KB | −13.4 KB (−6%) |
| `/character` | 215.0 KB | 210.0 KB | −5.0 KB (−2%) |

## What made the difference

1. **`LazyMotion` + `m` components** instead of `motion` components. The animation engine (`domMax`) is requested with
   a dynamic import. Motion was the single biggest chunk (156 KB raw, 52 KB gzipped).
2. **Dropping Motion's imperative `animate()`** for the two count-up numbers: a few lines of `requestAnimationFrame`
   (`src/lib/count-up.ts`). `animate()` pulls in the whole engine on its own.

## What did NOT make a difference (and why)

- **`next/dynamic` for the reward screen and the Pip customiser** (added in M4) saved under 2 KB, and on two pages
  measured a little larger. Both components are made of Pip and Motion, which every page already loads, so deferring
  them defers almost no code. They stay lazy (the reward screen's confetti logic never loads unless you publish), but
  the honest number is "about zero".
- **Turbopack kept most of Motion's shared code in the first-load chunk** even with `LazyMotion`, because the
  components still import from the same package; the separate features chunk is small. The saving is real but smaller
  than Motion's documentation suggests for webpack.

## Where the rest of the weight is

React DOM (223 KB raw, 70 KB gzipped) and the Next.js runtime are most of every page. They are the floor for a React
app with client-side navigation; cutting below that would mean fewer Client Components, not a different setting.
