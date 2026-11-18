import { useId } from 'react';
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import ChartCard from '../charts/ChartCard';
import ChartTooltip from '../charts/ChartTooltip';
import ResponsiveChart from '../charts/ResponsiveChart';
import { useChartMotion } from '../charts/useChartMotion';
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, LEGEND_PROPS, seriesColor } from '../charts/theme';
import { formatCompactMoney, formatMoney, formatPercent, totalsBy } from '../lib/metrics';
import './overview.css';

/** One KPI card. The change always has a sign, an arrow icon AND words, so it never relies on colour alone. */
function Kpi({ label, value, change, unit = '%', months }) {
  let note = <span className="overview-kpi-none">No earlier period</span>;
  if (change !== null && change !== undefined) {
    const tone = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    const text = unit === 'pp' ? `${sign}${Math.abs(change)} pp` : `${sign}${Math.abs(change)}%`;
    note = (
      <span className={`overview-kpi-change is-${tone}`}>
        <Icon size={16} aria-hidden="true" />
        <strong>{text}</strong> <span className="overview-kpi-vs">vs previous {months} months</span>
      </span>
    );
  }
  return (
    <div className="overview-kpi">
      <p className="overview-kpi-label">{label}</p>
      <p className="overview-kpi-value">{value}</p>
      <p className="overview-kpi-note">{note}</p>
    </div>
  );
}

export default function OverviewScreen() {
  const { ready, kpi, periodSeries, periodRows, range, refreshing } = useDashboard();
  const motion = useChartMotion();
  const gradientId = `overview-fill-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (!ready) return null;

  const period = `Last ${range} months`;

  // Running total: each month adds its revenue to everything before it.
  const cumulative = periodSeries.map((m, i) => ({
    label: m.label,
    month: m.month,
    revenue: m.revenue,
    cumulative: periodSeries.slice(0, i + 1).reduce((total, x) => total + x.revenue, 0),
  }));
  const lastPoint = cumulative[cumulative.length - 1];
  const halfway = cumulative.length >= 4 ? cumulative[Math.floor(cumulative.length / 2)] : null;
  const peak = periodSeries.reduce((best, m) => (!best || m.revenue > best.revenue ? m : best), null);

  // Insights: plain text computed from the same data.
  const best = peak;
  const worst = periodSeries.reduce((low, m) => (!low || m.revenue < low.revenue ? m : low), null);
  const averageMonth = periodSeries.length ? kpi.revenue / periodSeries.length : 0;
  const topRegion = totalsBy(periodRows, 'region')[0];
  const topCategory = totalsBy(periodRows, 'category')[0];

  const cumulativeTable = {
    columns: [
      { key: 'label', label: 'Month' },
      { key: 'revenue', label: 'Monthly revenue', format: formatMoney },
      { key: 'cumulative', label: 'Running total', format: formatMoney },
    ],
    rows: cumulative,
  };
  const composedTable = {
    columns: [
      { key: 'label', label: 'Month' },
      { key: 'revenue', label: 'Revenue', format: formatMoney },
      { key: 'profit', label: 'Profit', format: formatMoney },
      { key: 'average3', label: '3-month average', format: formatMoney },
    ],
    rows: periodSeries,
  };

  const c = kpi.change;
  return (
    <div className="overview">
      <section aria-labelledby="overview-kpi-heading">
        <h2 id="overview-kpi-heading" className="overview-heading">Key numbers <span>{period}</span></h2>
        <div className="kpi-grid">
          <Kpi label="Revenue" value={formatMoney(kpi.revenue)} change={c?.revenue} months={range} />
          <Kpi label="Profit" value={formatMoney(kpi.profit)} change={c?.profit} months={range} />
          <Kpi label="Orders" value={kpi.orders.toLocaleString('en-US')} change={c?.orders} months={range} />
          <Kpi label="Average order" value={formatMoney(kpi.averageOrder)} change={c?.averageOrder} months={range} />
          <Kpi label="Profit margin" value={formatPercent(kpi.margin)} change={c?.margin} unit="pp" months={range} />
        </div>
      </section>

      <div className="dash-grid">
        <ChartCard
          title="Cumulative revenue"
          subtitle={`Running total, ${period.toLowerCase()}`}
          busy={refreshing}
          table={cumulativeTable}
          summary={`Revenue adds up to ${formatMoney(lastPoint?.cumulative ?? 0)} over ${periodSeries.length} months.`}
        >
          <ResponsiveChart height={300}>
            {/* AreaChart: a line with the space under it filled in. Good for "how much so far". */}
            <AreaChart data={cumulative} margin={{ ...CHART_MARGIN, right: 48, top: 28 }}>
              {/* <defs> holds reusable SVG paint. This gradient fades the series colour to transparent, and the Area's fill points at it by id. */}
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={seriesColor(0)} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={seriesColor(0)} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatCompactMoney} width={56} />
              <Tooltip content={<ChartTooltip formatValue={formatMoney} title={(label) => `Up to ${label}`} />} cursor={{ stroke: 'var(--axis)' }} />
              {/* ReferenceLine draws a fixed vertical line at an x value, here the middle of the period. */}
              {halfway && (
                <ReferenceLine x={halfway.label} stroke="var(--axis)" strokeDasharray="4 4" label={{ value: 'Halfway', position: 'insideTopLeft', fill: 'var(--text-muted)', fontSize: 12 }} />
              )}
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative revenue"
                stroke={seriesColor(0)}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                {...motion}
              />
              {/* ReferenceDot marks one point: the final total, with its value as a label above it. */}
              {lastPoint && (
                <ReferenceDot
                  x={lastPoint.label}
                  y={lastPoint.cumulative}
                  r={5}
                  fill={seriesColor(0)}
                  stroke="var(--bg-surface)"
                  strokeWidth={2}
                  ifOverflow="visible"
                  label={{ value: formatCompactMoney(lastPoint.cumulative), position: 'top', fill: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}
                />
              )}
            </AreaChart>
          </ResponsiveChart>
        </ChartCard>

        <section className="overview-insights" aria-labelledby="overview-insights-heading">
          <h3 id="overview-insights-heading">Insights</h3>
          {periodSeries.length === 0 ? (
            <p>No sales match this selection.</p>
          ) : (
            <ul>
              <li>Best month: <strong>{best.label}</strong> with {formatMoney(best.revenue)} revenue.</li>
              <li>Weakest month: <strong>{worst.label}</strong> with {formatMoney(worst.revenue)} revenue.</li>
              <li>Average month: <strong>{formatMoney(averageMonth)}</strong> revenue.</li>
              {topRegion && <li>Top region: <strong>{topRegion.name}</strong>, {formatPercent(topRegion.share)} of revenue.</li>}
              {topCategory && <li>Top category: <strong>{topCategory.name}</strong>, {formatPercent(topCategory.share)} of revenue.</li>}
            </ul>
          )}
        </section>
        <ChartCard
          title="Revenue, profit and trend"
          subtitle="Monthly revenue (bars), monthly profit (area), 3-month average of revenue (line); one $ axis"
          className="span-2"
          busy={refreshing}
          table={composedTable}
          summary={peak ? `Best month was ${peak.label} with ${formatMoney(peak.revenue)} revenue.` : 'No data for this selection.'}
        >
          <ResponsiveChart height={360}>
            {/* ComposedChart lets different series types (Bar, Area, Line) share one set of axes. Order = paint order, so the area goes first (behind). */}
            <ComposedChart data={periodSeries} margin={{ ...CHART_MARGIN, top: 28 }}>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatCompactMoney} width={56} />
              <Tooltip content={<ChartTooltip formatValue={formatMoney} title={(label) => `Month: ${label}`} />} cursor={{ fill: 'var(--bg-sunken)', opacity: 0.6 }} />
              <Legend {...LEGEND_PROPS} />
              <Area type="monotone" dataKey="profit" name="Profit" stroke={seriesColor(1)} strokeWidth={2} fill={seriesColor(1)} fillOpacity={0.25} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
              <Bar dataKey="revenue" name="Revenue" fill={seriesColor(0)} radius={[4, 4, 0, 0]} maxBarSize={36} {...motion} />
              <Line type="monotone" dataKey="average3" name="3-month average" stroke={seriesColor(2)} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
              {/* A selective label: only the highest month gets a number, so the chart stays clean. */}
              {peak && (
                <ReferenceDot
                  x={peak.label}
                  y={peak.revenue}
                  r={5}
                  fill="var(--bg-surface)"
                  stroke={seriesColor(0)}
                  strokeWidth={2}
                  ifOverflow="visible"
                  label={{ value: `Peak: ${formatCompactMoney(peak.revenue)} in ${peak.label}`, position: 'top', fill: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}
                />
              )}
            </ComposedChart>
          </ResponsiveChart>
        </ChartCard>
      </div>
    </div>
  );
}
