import { useId, useMemo, useState } from 'react';
import { Bar, BarChart, Brush, CartesianGrid, Legend, LabelList, Line, LineChart, Rectangle, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import ChartCard from '../charts/ChartCard';
import ChartTooltip from '../charts/ChartTooltip';
import ResponsiveChart from '../charts/ResponsiveChart';
import { useChartMotion } from '../charts/useChartMotion';
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, LEGEND_PROPS, categoryColor, regionColor, seriesColor } from '../charts/theme';
import { CATEGORIES, REGIONS } from '../data/generate';
import { formatCompactMoney, formatMoney, monthName, monthlyBy } from '../lib/metrics';
import MonthDetails from './sales/MonthDetails';
import './sales.css';

const LABEL_MAX_MONTHS = 6; // totals above the bars only fit on short ranges

/** A small group of toggle buttons: real buttons + aria-pressed, labelled as a group. */
function Segmented({ label, options, value, onChange }) {
  return (
    <div className="sales-control" role="group" aria-label={label}>
      <span className="sales-label" aria-hidden="true">{label}</span>
      <div className="segmented">
        {options.map(([id, text]) => (
          <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

export default function SalesScreen() {
  const { ready, refreshing, range, periodRows, periodSeries } = useDashboard();
  const motion = useChartMotion();
  const selectId = useId();
  const [split, setSplit] = useState('region');
  const [layout, setLayout] = useState('stacked');
  const [picked, setPicked] = useState(null);
  // Brush zoom is remembered together with the series length it belongs to. If the period changes
  // (length changes) the stored zoom no longer applies, so we fall back to "show everything".
  const [zoom, setZoom] = useState({ length: 0, start: 0, end: 0 });

  const names = split === 'region' ? REGIONS : CATEGORIES;
  const colorOf = split === 'region' ? regionColor : categoryColor;
  const stacked = layout === 'stacked';

  // One object per month with a column per region/category, plus a `total` used for labels, tooltip and table.
  const barData = useMemo(
    () => monthlyBy(periodRows, split, range).map((m) => ({ ...m, total: names.reduce((t, n) => t + m[n], 0) })),
    [periodRows, split, range, names],
  );
  // The selected month only counts while it is still inside the period.
  const month = barData.some((m) => m.month === picked) ? picked : null;
  const toggleMonth = (m) => setPicked((current) => (current === m ? null : m));

  if (!ready) return null;

  /* ---------- line chart + brush ---------- */
  const count = periodSeries.length;
  const zoomed = zoom.length === count && count > 0 && (zoom.start > 0 || zoom.end < count - 1);
  const start = zoom.length === count ? Math.max(0, Math.min(zoom.start, count - 1)) : 0;
  const end = zoom.length === count ? Math.max(start, Math.min(zoom.end, count - 1)) : Math.max(0, count - 1);
  const visible = periodSeries.slice(start, end + 1);
  const average = visible.length ? visible.reduce((t, m) => t + m.revenue, 0) / visible.length : 0;
  const zoomText = visible.length
    ? `Showing ${visible[0].label} to ${visible[visible.length - 1].label} (${visible.length} ${visible.length === 1 ? 'month' : 'months'})`
    : 'No months to show';

  const grandTotal = barData.reduce((t, m) => t + m.total, 0);
  const barSummary = `Revenue by month for the last ${barData.length} months, split by ${split}, ${stacked ? 'stacked' : 'grouped'}. Total ${formatMoney(grandTotal)}.`;
  const barTable = {
    columns: [{ key: 'label', label: 'Month', numeric: false }, ...names.map((n) => ({ key: n, label: n, format: formatMoney })), { key: 'total', label: 'Total', format: formatMoney }],
    rows: barData,
  };
  const lineTable = {
    columns: [{ key: 'label', label: 'Month', numeric: false }, { key: 'revenue', label: 'Revenue', format: formatMoney }],
    rows: visible,
  };

  // A Bar's `shape` draws each rectangle. We reuse Recharts' own <Rectangle> and only change its
  // opacity: when a month is selected, every other month's bars fade to 35%.
  const barShape = (props) => (
    <Rectangle {...props} fillOpacity={month && props.payload?.month !== month ? 0.35 : 1} />
  );

  return (
    <div className="dash-grid">
      <ChartCard
        className="span-2 sales-bars"
        title="Revenue by month"
        subtitle={`Split by ${split}, ${stacked ? 'stacked' : 'grouped'}. Click a month to inspect it.`}
        summary={barSummary}
        table={barTable}
        busy={refreshing}
      >
        <div className="sales-controls">
          <Segmented label="Split by" options={[['region', 'Region'], ['category', 'Category']]} value={split} onChange={setSplit} />
          <Segmented label="Layout" options={[['stacked', 'Stacked'], ['grouped', 'Grouped']]} value={layout} onChange={setLayout} />
          <div className="sales-control sales-inspect">
            <label htmlFor={selectId}>Inspect a month</label>
            <select id={selectId} value={month ?? ''} onChange={(e) => setPicked(e.target.value || null)}>
              <option value="">None</option>
              {barData.map((m) => <option key={m.month} value={m.month}>{monthName(m.month)}</option>)}
            </select>
          </div>
        </div>
        <ResponsiveChart height={340}>
          <BarChart data={barData} margin={{ ...CHART_MARGIN, top: 20 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={12} />
            <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatCompactMoney} width={56} />
            <Tooltip
              content={<ChartTooltip formatValue={formatMoney} title={(label) => `Revenue in ${label}`} footer={(payload) => `Total ${formatMoney(payload[0]?.payload?.total ?? 0)}`} />}
              cursor={{ fill: 'var(--bg-sunken)', opacity: 0.6 }}
            />
            <Legend {...LEGEND_PROPS} />
            {names.map((name, i) => {
              const isTop = i === names.length - 1;
              return (
                <Bar
                  key={name}
                  dataKey={name}
                  name={name}
                  fill={colorOf(name)}
                  // stackId makes bars of the same month pile up; without it they sit side by side.
                  stackId={stacked ? 'revenue' : undefined}
                  // surface-colored stroke = a thin gap between stacked segments
                  stroke={stacked ? 'var(--bg-surface)' : undefined}
                  strokeWidth={stacked ? 2 : 0}
                  // rounded corners: only the top segment when stacked, every bar when grouped
                  radius={stacked ? (isTop ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]}
                  maxBarSize={48}
                  shape={barShape}
                  onClick={(d) => toggleMonth(d?.payload?.month ?? d?.month)}
                  {...motion}
                >
                  {/* LabelList on the top segment prints the month TOTAL above the stack, short ranges only */}
                  {stacked && isTop && barData.length <= LABEL_MAX_MONTHS && (
                    <LabelList dataKey="total" position="top" formatter={formatCompactMoney} fill="var(--text-secondary)" fontSize={12} />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveChart>
      </ChartCard>

      <ChartCard
        title="Month details"
        subtitle={month ? monthName(month) : 'No month selected'}
        summary={month ? `Details for ${monthName(month)} are shown below.` : undefined}
        busy={refreshing}
        className="sales-details span-2"
      >
        <MonthDetails month={month} rows={periodRows} split={split} onClear={() => setPicked(null)} />
      </ChartCard>

      <ChartCard
        className="span-2"
        title="Monthly revenue, zoomable"
        subtitle="Drag the handles under the chart to zoom into a stretch of months."
        summary={`Total revenue per month, ${visible.length} months in view. Average ${formatMoney(average)}.`}
        table={lineTable}
        busy={refreshing}
      >
        <div className="sales-zoom-bar">
          <p className="sales-zoom-text" aria-live="polite">{zoomText}</p>
          <button type="button" className="btn btn-sm" disabled={!zoomed} onClick={() => setZoom({ length: count, start: 0, end: count - 1 })}>Reset zoom</button>
        </div>
        <ResponsiveChart height={340}>
          {/* key on the series length: a new period remounts the chart so the Brush never holds stale indexes */}
          <LineChart key={count} data={periodSeries} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatCompactMoney} width={56} />
            <Tooltip content={<ChartTooltip formatValue={formatMoney} title={(label) => `Revenue in ${label}`} />} />
            {/* ReferenceLine: a fixed horizontal line at the average of the months you can currently see */}
            <ReferenceLine y={average} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: `Avg ${formatCompactMoney(average)}`, position: 'insideTopRight', fill: 'var(--text-secondary)', fontSize: 12 }} />
            {/* dot hidden until hover; activeDot is the marker that follows the pointer */}
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke={seriesColor(0)} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
            {/* Brush: the zoom slider. startIndex/endIndex make it controlled; onChange reports the new window. */}
            <Brush
              dataKey="label"
              height={30}
              startIndex={start}
              endIndex={end}
              stroke="var(--axis)"
              fill="var(--bg-sunken)"
              travellerWidth={10}
              onChange={(r) => setZoom({ length: count, start: r.startIndex, end: r.endIndex })}
            />
          </LineChart>
        </ResponsiveChart>
      </ChartCard>
    </div>
  );
}
