# Which chart for which question

A short guide written while building SalesPulse (`salespulse/`). Every chart type in the Day 14 task list, what it is for, when it misleads, and where it appears in the app. The rules come from the data visualization checks used on the project (one axis, colour that follows the entity, colour never the only signal) and from the problems the browser tests found.

## The seven chart types

| Chart (Recharts) | Answers | Use when | Avoid when | In SalesPulse |
|---|---|---|---|---|
| **LineChart** | How does it change over time? | Many time points; you care about the shape, rises and dips | Fewer than about 4 points; categories with no order | Monthly revenue with zoom (Sales); visitors and conversion (Users) |
| **AreaChart** | How much has built up? How big is the total? | One series, or a running total | Several overlapping series (the front one hides the back); bars would be clearer | Cumulative revenue (Overview); monthly revenue in a region (Revenue) |
| **BarChart** | Which is bigger? | Comparing categories or a few time points; bar length carries the value | An axis that does not start at zero (it exaggerates) | Revenue by month, stacked or grouped by region or category (Sales); sign-ups (Users) |
| **PieChart** | What share of the whole is each part? | 2 to 4 parts that add to a whole, with percentages written on them | More than 5 slices, similar sizes, comparing two pies | Revenue by region or category, as a donut with a button list and table (Revenue) |
| **ComposedChart** | Several measures of the SAME unit together | Revenue (bars), profit (area) and a moving average (line), all in dollars | Mixing two units on two y-axes: it makes any two lines look related | Revenue, profit and trend (Overview) |
| **ScatterChart** | Are two numbers related? Which points are unusual? | Many items, two numeric measures, optional size for a third | Few items; categories on an axis | Price against units sold, bubble size = revenue (Explore) |
| **RadarChart** | How do a few things compare across several measures? | 3 to 6 axes, 2 or 3 series, every axis scaled alike | Many series (a tangle); axes with different units and no scaling | Revenue, orders, margin, growth, satisfaction and retention per category (Explore) |

## Choosing quickly

| If the question is | Start with |
|---|---|
| "How did it change?" | Line (or area for a single total) |
| "Which one is highest?" | Bars, sorted |
| "How is it split?" | Stacked bars, or a pie with at most 4 slices |
| "Does A move with B?" | Scatter |
| "How does X stack up on several fronts?" | Radar, plus a table of the real numbers |
| "What is the one number?" | A big number with its change, not a chart (the KPI cards) |

## Rules that apply to all of them

1. **One y-axis per chart.** Two measures of different scale go in two charts. SalesPulse's conversion rate (percent) is its own chart under visitors and sign-ups, hovering together through `syncId`.
2. **Colour follows the thing, not its rank.** Europe is the same colour on every tab, whichever filter is on. Do not cycle colours: past four or five series, fold the rest into "Other" or split into small charts.
3. **Never colour alone.** Add a legend, a direct label, a sign and an arrow, or a table view. About one man in twelve has some colour blindness, and light colours on a light page fall below 3:1 contrast.
4. **Start bars at zero.** Lines may zoom, because their position, not their length, carries the meaning.
5. **Label selectively.** A number on every point is clutter. Label the peak, the end, or the total of a stack.
6. **Always offer the numbers.** A table view of the same data helps screen-reader users and anyone who needs an exact value.
7. **Tooltips enhance, they do not gate.** Every value a tooltip shows must also be reachable without hovering (a table, a label, a list of buttons).
8. **Interaction needs a keyboard route.** Click a bar to inspect a month, and also offer a select that does the same.
9. **Keep the old chart while new data loads**, faded, rather than a blank or a spinner: nothing jumps.

## Mistakes found while building this

| Mistake | What happened | Fix |
|---|---|---|
| Legend sorted alphabetically by default | "Asia-Pacific" listed first while colours followed the data order | `itemSorter={null}` |
| Stale zoom range after the data length changed | The Brush drew `NaN` positions and the console filled with errors (found by a browser test) | Remount the chart with a `key` when the granularity changes |
| Chart sized by period but data from another | After a failed refetch a heading said "12 months" over 6 months of data | Everything derives from the period of the data on screen |
| Label inside the donut drew in the wrong place | The total was missing from the centre | Plain HTML text laid over the chart |
| A partial last week plotted as a week | A one-day "week" drew a false cliff at the end of the line | Only complete weeks are drawn |
| Tooltip-only information | Not available on keyboard or touch | Table view and button lists |
