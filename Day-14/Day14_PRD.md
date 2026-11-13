# PRD: SalesPulse, a Recharts dashboard (Day 14)

| Field     | Value                                                              |
| --------- | ------------------------------------------------------------------ |
| Owner     | Ronit Ahuja                                                        |
| Programme | Linkific internship, Month 1 (training phase), Day 14              |
| Date      | Friday, 13 November 2026                                           |
| Repo path | `Linkific-Tasks/Day-14/salespulse`                                 |
| Builds on | Day 12 and 13 patterns (Tabs, toasts, theme switch); new app       |
| Status    | **Built.** Merged via PR #PR_NUMBER.                               |
| Companion | `salespulse/README.md`, `CHART_CHOICE_GUIDE.md`                    |

---

## 1. Summary

Day 14 teaches data visualization with Recharts. SalesPulse is a dashboard over mock sales and user data with seven chart types, interactive tooltips and legends, filters, zoom, synchronized charts and drill-down. The README explains the data visualization concepts and the Recharts parts; a separate guide says which chart suits which question.

## 2. Goals

- At least 5 different charts (all 7 from the task list: line, bar, pie, area, composed, scatter, radar).
- Mock data with a believable shape (growth, a holiday peak, quieter weekends).
- Interactive tooltips and legends; custom styled charts; responsive layouts.
- The task-list features: `ResponsiveContainer`, `XAxis`/`YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `Label`/`LabelList`, custom tooltips and labels, animations, dynamic data, filters, click events, `Brush`, synchronized charts.
- A README with data visualization concepts.

**Non-goals:** a real backend, real data, authentication, exporting charts.

## 3. Scope

In: five tabs (Overview, Sales, Users, Revenue, Explore), a filter row, a pretend API, light and dark themes, tests. Out: persistence beyond the theme, i18n.

## 4. Design

### 4.1 Mapping the task list

| Task list item | Where |
|---|---|
| LineChart: trends | Sales (zoomable monthly revenue), Users (visitors, conversion) |
| BarChart: compare categories | Sales (stacked or grouped by region or category), Users (sign-ups), Revenue (drill-down) |
| PieChart: proportions | Revenue (donut by region or category) |
| AreaChart: cumulative data | Overview (cumulative revenue), Revenue (monthly sparkline) |
| ComposedChart: multiple chart types | Overview (bars + area + line) |
| ScatterChart: correlation | Explore (price vs units sold, bubble size = revenue) |
| RadarChart: multiple variables | Explore (six measures per category) |
| Axes, grid, tooltip, legend, labels | all charts; `LabelList` on stacked bars; `label` on axes and reference points |
| Custom tooltips, labels, styling | `ChartTooltip`, custom slice and bar shapes, CSS-variable theme |
| Animations | on by default, off for reduced motion (`useChartMotion`) |
| Update on state change, fetch from API, filter, multiple datasets | `DashboardContext`, mock API with delay, cancel and failure; period, region, category filters |
| Click events | Sales bars, Revenue slices, Explore points |
| Brush zoom, synchronized charts | Sales line chart; Users (`syncId` and a shared brush) |
| Rich tooltips | Users, Explore and Revenue tooltips |
| Sales dashboard, user analytics, revenue pie, monthly trends | Overview, Users, Revenue, Overview/Sales |
| Responsive, filter options | `ResponsiveContainer`, a single filter row, tested at 375 px |

### 4.2 Decisions

| Decision | Why |
|---|---|
| New app, not DataDesk | The task's scenarios (sales, revenue, user analytics) do not fit a user directory |
| Data shaping in pure functions (`src/lib/metrics.js`) | Recharts wants flat arrays; testable without React; charts stay short |
| Seeded generator | Identical data on every load makes tests and screenshots repeatable |
| The server filters by period; the browser filters by region and category | Demonstrates fetching and refetching, while the other filters stay instant |
| Everything derives from the period of the data on screen | A heading can never say "12 months" over 6 months of data after a slow or failed request |
| One axis per chart | A dual axis can make two unrelated lines look related; conversion rate is its own chart |
| Colour follows the entity; validated colour-blind-safe order; dark mode has its own steps | Consistency across tabs and themes |
| Every chart has a table view and a summary sentence | Colour and hover must never be the only route to the numbers |
| Keyboard routes beside every click interaction | A chart that only reacts to clicks is unusable without a mouse |
| Parallel build of the five tabs, shared foundation written first | Disjoint files, a stable data and chart API |

## 5. Requirements

| # | Requirement | Verified by |
|---|---|---|
| R1 | At least 5 chart types; the task list's 7 are all drawn | browser test that checks each mark type is on a page |
| R2 | Tooltips list every series; legends identify every multi-series chart | component and browser tests |
| R3 | Period change refetches and keeps the old charts on screen; region and category are instant | context tests, browser test |
| R4 | A failed request shows a message with Try again and keeps the last good data | context test, browser test |
| R5 | Bar, slice and point clicks work, each with a keyboard route | browser tests |
| R6 | Brush zoom and synchronized charts work | browser tests |
| R7 | Every chart has a table view | component and browser tests |
| R8 | No horizontal scroll at 375 px | browser test |
| R9 | WCAG 2.1 AA in light and dark on every tab | axe tests |
| R10 | No console errors or warnings | every browser test fails on them |

## 6. Milestones

| #  | Milestone | Branch | PR |
| -- | --------- | ------ | -- |
| M1 | Data, API, metrics, shared chart pieces, five tabs, tests, README, guide | `day14/salespulse` | #PR_NUMBER |

## 7. Verification

| Layer | Result |
| ----- | ------ |
| Build and lint | `npm run build` passes; `npm run lint` reports nothing |
| Unit and component tests | 58 passing: data, API, every metric function, the dashboard context, filter bar, chart card and tooltip, and each tab |
| Browser end to end | 27 passing in Chrome against both the dev server and the production bundle |
| Accessibility | axe-core WCAG 2.1 AA: zero violations on 5 tabs in light and dark |

Problems found by the tests and a visual check, and fixed: a refetch changed the numbers while the old data was still on screen (a heading said 12 months over 6 months of data); the Users tab logged `NaN` errors when switching between daily and weekly (a stale zoom range); the legend listed series alphabetically; the donut centre label drew in the wrong place; the pressed filter button was too low in contrast in dark mode.

**Not covered:** browsers other than Chrome, real devices (only a 375 px emulated width), screen reader testing by a person, and real data.

## 8. Risks

| Risk | Mitigation |
| ---- | ---------- |
| Recharts API changes (v3 deprecated `Cell` and `activeShape`) | Pinned version; custom `shape` functions; README notes |
| Charts unreadable for colour-blind users | Validated palette, legends, labels, table views |
| Large bundle (about 215 kB gzipped) | Documented; Recharts is most of it |
| Animations restart on resize | Reduced-motion support; screenshots taken with it on |

## 9. Deliverables

- Dashboard with 7 different chart types (`Day-14/salespulse`)
- Recharts with mock data (seeded generator, pretend API)
- Interactive tooltips and legends
- Responsive chart layouts
- Custom styled charts
- README with data visualization concepts, and a chart-choice guide
