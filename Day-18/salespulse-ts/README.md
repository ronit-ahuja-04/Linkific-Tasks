# SalesPulse: a Recharts dashboard

A React dashboard that turns mock sales and user data into **7 chart types** with Recharts: line, bar, pie, area, composed, scatter and radar. It has interactive tooltips, legends, filters, zoom (Brush), synchronized charts, click-to-drill-down, a pretend API with loading and error states, light and dark themes, and phone-width layouts. Everything is mock data from a seeded generator, so every load (and every test) sees the same business.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit and component tests (Vitest)
npm run test:e2e     # browser tests (Playwright, Chrome)
npm run test:e2e:prod  # the same browser tests against the production bundle
```

## What is on each tab

| Tab | Charts | Recharts features shown |
|---|---|---|
| **Overview** | KPI cards, **AreaChart** (cumulative revenue), **ComposedChart** (bars + area + line) | gradient fill, `ReferenceLine`, `ReferenceDot` with a label, mixing `Bar` + `Area` + `Line` on one axis |
| **Sales** | **BarChart** (stacked or grouped, by region or category), **LineChart** with zoom | `LabelList`, click events on bars, `Brush` (controlled), `ReferenceLine` at the visible average, custom bar `shape` |
| **Users** | **LineChart**, **BarChart**, **LineChart**, three charts hovering as one | `syncId`, shared zoom, `ReferenceArea`, a custom tooltip with rich content |
| **Revenue** | **PieChart** (donut) with drill-down, **BarChart** (vertical), **AreaChart** sparkline | `innerRadius`, `paddingAngle`, custom `label`, click on a slice, custom slice `shape` |
| **Explore** | **ScatterChart** (price vs units, bubble size = revenue), **RadarChart** (6 measures) | `XAxis`/`YAxis`/`ZAxis`, log scale, pinning a point, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis` |

One filter row sits above everything: **period** (3, 6, 12 or 24 months), **region**, **category**. Every chart, number and table below it uses the same filtered data, so the numbers always agree.

## Recharts basics, as used here

**Data format.** Recharts wants an array of flat objects, one per x position: `[{ label: 'Jan 26', revenue: 120000, profit: 60000 }, ...]`. Each series says which key it reads with `dataKey`. All the reshaping (monthly totals, one column per region, weekly roll-ups, radar axes) lives in [src/lib/metrics.js](src/lib/metrics.js) as plain tested functions, so the chart components stay short.

**Composing a chart.** A chart is a wrapper (`LineChart`, `BarChart`, ...) with parts inside it. Order does not matter much; what is in the list is what is drawn:

```jsx
<ResponsiveContainer width="100%" height={320}>
  <LineChart data={rows}>
    <CartesianGrid vertical={false} />   {/* the grid */}
    <XAxis dataKey="label" />             {/* the x axis reads rows[i].label */}
    <YAxis />
    <Tooltip />                           {/* the hover box */}
    <Legend />                            {/* the key */}
    <Line dataKey="revenue" />            {/* one line per series */}
  </LineChart>
</ResponsiveContainer>
```

**ResponsiveContainer** measures its parent and gives the chart that width and height, which is how the charts shrink on a phone. It needs a parent with a width. [ResponsiveChart](src/charts/ResponsiveChart.jsx) wraps it and sets `initialDimension`, which is what it assumes before the first measurement (without it a chart draws nothing in a test, and flashes empty in a browser).

| Component | What it does |
|---|---|
| `XAxis`, `YAxis` | Axes. `tickFormatter` formats ticks (`$1.2M`); `type="number"` and `scale="log"` for numeric axes |
| `ZAxis` | A third dimension for scatter: here, bubble size |
| `CartesianGrid` | The grid lines |
| `Tooltip` | The hover box. `content={<MyTooltip />}` replaces it with your own |
| `Legend` | The key. Click handling is possible, but see the accessibility notes below |
| `Label`, `LabelList` | Text on a chart. `label={{ value: 'Units sold' }}` on an axis; `LabelList` prints a value on every mark |
| `Brush` | A draggable range slider under a chart, used to zoom |
| `ReferenceLine`, `ReferenceDot`, `ReferenceArea` | A line, a point, or a shaded band at a data position (an average, a peak, the busiest week) |
| `Cell` | Per-slice or per-bar styling (deprecated in 3.x: a `shape` function does the same) |

## Interactive features

- **Custom tooltip** ([ChartTooltip](src/charts/ChartTooltip.jsx)): lists every series at the hovered position, bold value first and name after, each keyed by a short coloured stroke. The Users tooltip adds the weekday, sessions per visitor and conversion.
- **Click events:** click a bar (Sales), a pie slice (Revenue) or a scatter point (Explore). Each has a keyboard route too (a select or a list of buttons), because a click-only chart is unusable without a mouse.
- **Brush zoom:** drag the handles under a chart. In Users the same range crops all three charts.
- **Synchronized charts:** `syncId` makes hovering one chart show the tooltip at the same x on the others.
- **Dynamic data:** changing the period asks the mock API again ([src/api/mockApi.js](src/api/mockApi.js)). The old charts stay on screen, faded, while the new data loads (no skeleton, no jump). Region and category filter data already in the browser, so they are instant. A failed request shows a message with **Try again** and keeps the last good charts (open `/?fail=1` to see it).
- **Animations:** Recharts animates marks by default. [useChartMotion](src/charts/useChartMotion.js) turns them off for people who ask their system for reduced motion.
- **Table view:** every chart has a button that swaps it for a real `<table>` of the same numbers.

## Data visualization concepts applied

These are the rules the charts follow, and why.

1. **Pick the chart from the question, not the other way round.** Trend over time: line or area. Compare categories: bars. Parts of a whole: a pie works only for a few slices. Relationship between two numbers: scatter. Several measures of a few things at once: radar. [CHART_CHOICE_GUIDE.md](../CHART_CHOICE_GUIDE.md) has the full list.
2. **One axis per chart.** Two y-scales in one chart let an author make any two lines look related, so the composed chart puts revenue, profit and its average on the same dollar axis, and conversion rate (a percentage) has its own chart.
3. **Colour follows the entity, never the rank.** Europe is the same colour on every tab, whichever filter is on. The four colours are a colour-blind-safe order, checked with a validator (the worst neighbouring pair is far enough apart for the common kinds of colour blindness, in light and dark). Dark mode uses its own steps, not an inversion.
4. **Colour is never the only signal.** Legends name every series; the donut has percentages and a button list with the exact values; KPI changes carry a sign, an arrow and words; every chart has a table view. In light mode two of the four colours are lighter than 3:1 against the page, which is exactly why the labels and tables are required.
5. **Bars start at zero.** Bar length is the data, so a cut axis lies. Lines may zoom (the Brush does it) because position, not length, carries the meaning.
6. **Thin marks, quiet grid.** Horizontal gridlines only, no tick marks, thin lines (2px), rounded bar tops, a 2px gap between stacked segments, dots hidden until hover.
7. **Label selectively.** A value on every point is clutter: the stacked bars print their total only when there are 6 months or fewer; the composed chart labels only the peak; the area chart labels only its end.
8. **Say what the chart says.** Each chart card has a hidden one-sentence summary for screen readers ("Revenue rose from X to Y"), and a visible subtitle that names the unit and the period.
9. **Honest radar.** Six different measures cannot share a scale, so each is scaled 0 to 100 and the scaling is explained next to the chart (revenue and orders as a share of the best category; growth mapped so 50 is flat). The table under it has the real numbers.
10. **A donut is the weakest chart here.** It is kept because the task asks for a pie, but with 4 slices at most, direct percentages, a gap between slices, and the same numbers in a button list and a table.

## Things Recharts 3 does that are worth knowing

- **`Cell` and `activeShape` on `Pie` are deprecated and `activeIndex` is gone.** Highlighting a selected slice is done with the `shape` prop and your own selection state.
- **The legend is sorted alphabetically by default** (`itemSorter="value"`). Set `itemSorter={null}` to keep series order, otherwise "Asia-Pacific" appears before "North America" while the colours follow the data order.
- **The built-in legend is not keyboard accessible.** The radar chart uses its own legend buttons (`aria-pressed`) to show and hide a series.
- **A `Brush` keeps its own indexes.** When the data length changes (daily vs weekly) a stale brush draws `NaN` positions and the browser logs errors. Remounting the chart with a `key` fixes it. A browser test caught this.
- **A chart re-animates when its container is resized**, including when a full-page screenshot resizes the window; screenshots are taken with reduced motion on.
- **`<ResponsiveContainer>` needs `initialDimension` in tests** (jsdom has no layout) or it renders nothing.
- **A `<Label content>` inside a `Pie` drew in the wrong place** in my build (3.10.1: the text landed at the top left and the number was missing). The total in the donut hole is now plain HTML laid over the chart's centre.
- **CSS variables work inside SVG attributes** (`stroke="var(--series-1)"`), which is how one chart repaints for light and dark with no re-render.

## Project layout

```
src/data/       seeded mock data: 24 months of sales (288 rows), 365 days of users, 30 products, scores
src/api/        pretend REST API: delay, cancel, failure
src/lib/        metrics.js: every reshaping and number format, pure and tested
src/context/    DashboardContext (filters + data), ThemeContext, ToastContext
src/hooks/      useDashboardData (loading, refreshing, error without setState-in-effect)
src/charts/     shared: ChartCard (+ table view), ChartTooltip, ResponsiveChart, theme, useChartMotion
src/screens/    the five tabs, each with its own stylesheet
test/           unit and component tests      e2e/  Playwright tests
```

## Testing

- **Unit and component (Vitest):** the data generator, the API (including cancel and failure), every metric function checked against totals computed independently, the dashboard context (a region filter makes no new request; a period change keeps the old charts; failure keeps the last good data), the shared chart pieces, and each tab.
- **Browser (Playwright, Chrome):** every tab, all chart types drawn, filters, refetch, the error banner, bar/slice/point clicks, Brush zoom, synchronized tooltips, theme, keyboard tabs, and no horizontal scroll at phone width. Every test **fails on any console error or warning**.
- **Accessibility:** axe-core WCAG 2.1 AA on every tab in light and dark: zero violations.

## Bundle size

The production JavaScript is about 215 kB gzipped; most of it is Recharts (and its D3 helpers). It is a dashboard library: for one small chart, a lighter option is worth considering.
