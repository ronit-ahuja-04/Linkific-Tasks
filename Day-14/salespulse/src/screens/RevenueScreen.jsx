import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, LabelList, Pie, PieChart, Sector, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import ChartCard from '../charts/ChartCard';
import ChartTooltip from '../charts/ChartTooltip';
import ResponsiveChart from '../charts/ResponsiveChart';
import { useChartMotion } from '../charts/useChartMotion';
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, categoryColor, regionColor } from '../charts/theme';
import { formatCompactMoney, formatMoney, formatPercent, monthlySeries, totalsBy } from '../lib/metrics';
import './revenue.css';

// "Slice by" options: which column of the sales rows the donut is split on, and the colour that follows each entity.
const DIMENSIONS = {
  region: { label: 'Region', other: 'category', otherLabel: 'category', color: regionColor, otherColor: categoryColor },
  category: { label: 'Category', other: 'region', otherLabel: 'region', color: categoryColor, otherColor: regionColor },
};
const SLICE_MIN_LABEL = 8; // only slices of at least 8% get a printed percentage: smaller ones would overlap

/**
 * Pie tooltip. For a pie, Recharts gives `payload[0]` whose `.payload` is OUR data row
 * ({ name, revenue, profit, orders, share }). We turn that one row into several tooltip lines.
 */
function PieTooltip({ active, payload }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const lines = [
    { name: 'Revenue', value: formatMoney(row.revenue), color: payload[0].payload.fill },
    { name: 'Share', value: formatPercent(row.share) },
    { name: 'Profit', value: formatMoney(row.profit) },
    { name: 'Orders', value: row.orders.toLocaleString('en-US') },
  ];
  return <ChartTooltip active payload={lines.map((l) => ({ ...l, dataKey: l.name }))} label={row.name} formatValue={(v) => v} />;
}

export default function RevenueScreen() {
  const { ready, refreshing, periodRows, range } = useDashboard();
  const motion = useChartMotion();
  const [by, setBy] = useState('region');
  // The selection remembers which dimension it belongs to, so switching "Slice by" clears it.
  const [selection, setSelection] = useState(null);
  const dim = DIMENSIONS[by];

  const slices = useMemo(() => totalsBy(periodRows, by).map((s) => ({ ...s, fill: dim.color(s.name) })), [periodRows, by, dim]);
  const total = slices.reduce((t, s) => t + s.revenue, 0);
  // Only trust a selection that still exists after filters changed.
  const selected = selection?.by === by ? slices.find((s) => s.name === selection.name) ?? null : null;
  const selectedIndex = selected ? slices.indexOf(selected) : -1;

  const detail = useMemo(() => {
    if (!selected) return null;
    const rows = periodRows.filter((r) => r[by] === selected.name);
    return {
      split: totalsBy(rows, dim.other).map((s) => ({ ...s, fill: dim.otherColor(s.name) })),
      monthly: monthlySeries(rows),
    };
  }, [selected, periodRows, by, dim]);

  if (!ready) return null;

  const select = (name) => setSelection((cur) => (cur?.by === by && cur.name === name ? null : { by, name }));
  const switchBy = (next) => { setBy(next); setSelection(null); };

  // A custom SLICE SHAPE (Recharts 3 `shape` prop): called once per slice. The selected one is drawn
  // 6px bigger so it "pops out"; the others dim while something is selected. The 2px surface stroke separates slices.
  const renderSlice = (props) => {
    const isSelected = props.index === selectedIndex;
    return (
      <Sector
        {...props}
        outerRadius={props.outerRadius + (isSelected ? 6 : 0)}
        fillOpacity={selected && !isSelected ? 0.35 : 1}
        stroke="var(--bg-surface)"
        strokeWidth={2}
        cursor="pointer"
      />
    );
  };

  // A custom LABEL (function): put the percentage in the middle of the ring, only on big slices.
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }) => {
    if (payload.share < SLICE_MIN_LABEL) return null;
    const r = (innerRadius + outerRadius) / 2;
    const angle = (-midAngle * Math.PI) / 180;
    return (
      <text x={cx + r * Math.cos(angle)} y={cy + r * Math.sin(angle)} textAnchor="middle" dominantBaseline="central" className="revenue-slice-label">
        {formatPercent(payload.share, 0)}
      </text>
    );
  };

  const pieTable = {
    columns: [
      { key: 'name', label: dim.label },
      { key: 'revenue', label: 'Revenue', format: formatMoney },
      { key: 'share', label: 'Share', format: (v) => formatPercent(v) },
      { key: 'profit', label: 'Profit', format: formatMoney },
      { key: 'orders', label: 'Orders', format: (v) => v.toLocaleString('en-US') },
    ],
    rows: slices,
  };
  const splitTable = detail && {
    columns: [
      { key: 'name', label: DIMENSIONS[dim.other].label },
      { key: 'revenue', label: 'Revenue', format: formatMoney },
      { key: 'share', label: 'Share', format: (v) => formatPercent(v) },
    ],
    rows: detail.split,
  };

  const top = slices[0];
  const summary = top
    ? `Revenue by ${by} over the last ${range} months totals ${formatMoney(total)}. ${top.name} leads with ${formatPercent(top.share)}.`
    : 'No revenue for the current filters.';

  return (
    <div className="dash-grid">
      <ChartCard
        title={`Revenue by ${by}`}
        subtitle="Click a slice, or use the buttons, to drill down"
        summary={summary}
        table={pieTable}
        busy={refreshing}
        actions={
          <div className="revenue-switch">
            <span id="revenue-slice-by" className="filter-label">Slice by</span>
            <div className="segmented" role="group" aria-labelledby="revenue-slice-by">
              {Object.entries(DIMENSIONS).map(([key, d]) => (
                <button key={key} type="button" aria-pressed={by === key} onClick={() => switchBy(key)}>{d.label}</button>
              ))}
            </div>
          </div>
        }
      >
        {slices.length === 0 ? (
          <p className="muted revenue-hint">No sales match the current filters.</p>
        ) : (
          <>
            {/* The text in the donut hole is plain HTML laid over the chart's centre: simpler and sharper than an SVG <Label>, and it can be styled with CSS */}
            <div className="revenue-donut">
              <div className="revenue-center" aria-hidden="true">
                <strong>{formatCompactMoney(total)}</strong>
                <span>Total revenue</span>
              </div>
            <ResponsiveChart height={300}>
              <PieChart>
                <Tooltip content={<PieTooltip />} />
                {/* innerRadius makes it a donut; paddingAngle leaves a small gap; labelLine={false} avoids leader-line clutter */}
                <Pie
                  data={slices}
                  dataKey="revenue"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={2}
                  label={renderLabel}
                  labelLine={false}
                  shape={renderSlice}
                  onClick={(entry) => select(entry.name)}
                  {...motion}
                >
                  {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveChart>
            </div>
            {/* The legend IS this button list: keyboard users get the same click as mouse users. */}
            <div className="revenue-legend" role="group" aria-label={`Select a ${by} to drill down`}>
              {slices.map((s) => (
                <button key={s.name} type="button" className="revenue-legend-btn" aria-pressed={selected?.name === s.name} onClick={() => select(s.name)}>
                  <span className="revenue-swatch" style={{ background: s.fill }} aria-hidden="true" />
                  <span className="revenue-legend-name">{s.name}</span>
                  <span className="revenue-legend-value">{formatCompactMoney(s.revenue)} · {formatPercent(s.share)}</span>
                </button>
              ))}
              <button type="button" className="btn btn-sm" onClick={() => setSelection(null)} disabled={!selected}>Clear selection</button>
            </div>
          </>
        )}
      </ChartCard>

      <ChartCard
        title="Drill-down"
        subtitle={selected ? `${selected.name}: revenue by ${dim.otherLabel}` : 'Details of the selected slice'}
        summary={selected ? `${selected.name} earned ${formatMoney(selected.revenue)}, ${formatPercent(selected.share)} of revenue.` : 'Nothing selected.'}
        table={splitTable}
        busy={refreshing}
      >
        {!selected ? (
          <p className="revenue-hint">Select a slice to drill down</p>
        ) : (
          <>
            <dl className="revenue-stats">
              <div><dt>Revenue</dt><dd>{formatMoney(selected.revenue)}</dd></div>
              <div><dt>Profit</dt><dd>{formatMoney(selected.profit)}</dd></div>
              <div><dt>Share of total</dt><dd>{formatPercent(selected.share)}</dd></div>
            </dl>
            {/* layout="vertical" turns the bar chart sideways: the number axis runs along the bottom, names down the side. */}
            <ResponsiveChart height={150}>
              <BarChart data={detail.split} layout="vertical" margin={{ ...CHART_MARGIN, right: 56 }}>
                <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} />
                <Tooltip cursor={{ fill: 'var(--bg-sunken)' }} content={<ChartTooltip formatValue={formatMoney} title={(l) => `${l} in ${selected.name}`} />} />
                <Bar dataKey="revenue" name="Revenue" barSize={18} radius={[0, 4, 4, 0]} {...motion}>
                  {detail.split.map((s) => <Cell key={s.name} fill={s.fill} />)}
                  {/* LabelList prints each bar's value at its end */}
                  <LabelList dataKey="revenue" position="right" formatter={formatCompactMoney} fill="var(--text-primary)" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveChart>
            <h4 className="revenue-sub">Monthly revenue in {selected.name}</h4>
            <ResponsiveChart height={140}>
              <AreaChart data={detail.monthly} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={24} />
                <YAxis width={48} tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatCompactMoney} />
                <Tooltip cursor={{ stroke: 'var(--axis)' }} content={<ChartTooltip formatValue={formatMoney} title={(l) => `Revenue in ${l}`} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={selected.fill} strokeWidth={2} fill={selected.fill} fillOpacity={0.2} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
              </AreaChart>
            </ResponsiveChart>
          </>
        )}
      </ChartCard>
    </div>
  );
}
