import { useMemo, useState } from 'react';
import { CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { Pin, PinOff } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { CATEGORIES } from '../data/generate';
import ChartCard, { DataTable } from '../charts/ChartCard';
import ChartTooltip from '../charts/ChartTooltip';
import ResponsiveChart from '../charts/ResponsiveChart';
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, LEGEND_PROPS, categoryColor } from '../charts/theme';
import { useChartMotion } from '../charts/useChartMotion';
import { formatCompact, formatMoney, formatPercent, radarData } from '../lib/metrics';
import './explore.css';

const PRICE_TICKS = [10, 30, 100, 300, 1000, 3000, 10000];

/** Tooltip for a scatter point: Recharts hands us the hovered point's original row in payload[0].payload */
function ProductTooltip({ active, payload }) {
  const p = active ? payload?.[0]?.payload : null;
  if (!p?.name) return null;
  return (
    <div className="chart-tooltip" role="status">
      <p className="chart-tooltip-title">{p.name}</p>
      <ul>
        <li><span className="tooltip-key" style={{ background: categoryColor(p.category) }} aria-hidden="true" /><strong>{p.category}</strong></li>
        <li><strong>{formatMoney(p.price)}</strong><span className="tooltip-name">price</span></li>
        <li><strong>{p.units.toLocaleString('en-US')}</strong><span className="tooltip-name">units sold</span></li>
        <li><strong>{formatMoney(p.revenue)}</strong><span className="tooltip-name">revenue</span></li>
        <li><strong>{p.rating}</strong><span className="tooltip-name">rating</span></li>
      </ul>
      <p className="chart-tooltip-footer">Click to pin</p>
    </div>
  );
}

export default function ExploreScreen() {
  const { ready, refreshing, products, periodRows, scores, region, category } = useDashboard();
  const motion = useChartMotion();
  const [logScale, setLogScale] = useState(false);
  const [pinnedId, setPinnedId] = useState('');
  const [hidden, setHidden] = useState(() => new Set());

  const byRevenue = useMemo(() => [...products].sort((a, b) => b.revenue - a.revenue), [products]);
  const radar = useMemo(() => radarData(periodRows, scores, { region }), [periodRows, scores, region]);
  if (!ready) return null;

  // If the category filter removes the pinned product, it simply stops being pinned.
  const pinned = products.find((p) => p.id === pinnedId) ?? null;
  const rank = pinned ? byRevenue.findIndex((p) => p.id === pinned.id) + 1 : 0;
  const categories = CATEGORIES.filter((c) => category === 'All' || c === category);
  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // A log axis cannot include 0, so its domain starts just under the cheapest product.
  const xDomain = logScale ? [Math.max(1, Math.floor(minPrice * 0.7)), Math.ceil(maxPrice * 1.3)] : [0, 'auto'];
  const xTicks = logScale ? PRICE_TICKS.filter((t) => t >= xDomain[0] && t <= xDomain[1]) : undefined;

  const toggleSeries = (name) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const shown = categories.filter((c) => !hidden.has(c));
  const raw = radar.raw.filter((r) => categories.includes(r.category));

  // CUSTOM SHAPE: Recharts gives each point cx/cy (centre) and size (area from the ZAxis range).
  // We draw a faded circle with a surface stroke, a bigger invisible circle as a generous click
  // target, and an extra ring on the pinned product.
  const renderPoint = ({ cx, cy, size, fill, payload }) => {
    if (cx == null || cy == null) return <g />;
    const r = Math.sqrt(size / Math.PI);
    const isPinned = payload.id === pinnedId;
    return (
      <g className="explore-point" onClick={() => setPinnedId(payload.id)}>
        <circle cx={cx} cy={cy} r={Math.max(r + 8, 14)} fill="transparent" />
        {isPinned && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="var(--text-primary)" strokeWidth={2} />}
        <circle cx={cx} cy={cy} r={isPinned ? r + 2 : r} fill={fill} fillOpacity={0.75} stroke="var(--bg-surface)" strokeWidth={2} />
      </g>
    );
  };

  const scatterTable = {
    columns: [
      { key: 'name', label: 'Product', numeric: false },
      { key: 'category', label: 'Category', numeric: false },
      { key: 'price', label: 'Price', format: formatMoney },
      { key: 'units', label: 'Units', format: (v) => v.toLocaleString('en-US') },
      { key: 'revenue', label: 'Revenue', format: formatMoney },
      { key: 'rating', label: 'Rating' },
    ],
    rows: byRevenue,
  };
  const radarTable = {
    columns: [
      { key: 'category', label: 'Category', numeric: false },
      { key: 'revenue', label: 'Revenue', format: formatMoney },
      { key: 'orders', label: 'Orders', format: (v) => v.toLocaleString('en-US') },
      { key: 'margin', label: 'Margin', format: (v) => formatPercent(v) },
      { key: 'growth', label: 'Growth', format: (v) => formatPercent(v) },
      { key: 'satisfaction', label: 'Satisfaction' },
      { key: 'retention', label: 'Retention' },
    ],
    rows: raw,
  };

  const top = byRevenue[0];
  const scatterSummary = top
    ? `${products.length} products plotted by price and units sold. ${top.name} earns the most revenue at ${formatMoney(top.revenue)}. Cheaper products tend to sell more units.`
    : 'No products to show.';

  return (
    <div className="dash-grid">
      <ChartCard
        className="span-2"
        title="Price vs units sold"
        subtitle="Each bubble is a product; bigger bubble = more revenue. Click one to pin it."
        summary={scatterSummary}
        table={scatterTable}
        busy={refreshing}
        actions={
          <div className="explore-controls">
            <label className="explore-check">
              <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />
              Log scale
            </label>
            <label className="explore-select">
              Pin a product
              <select value={pinned?.id ?? ''} onChange={(e) => setPinnedId(e.target.value)}>
                <option value="">None</option>
                {byRevenue.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
              </select>
            </label>
          </div>
        }
        footer={
          pinned ? (
            <div className="explore-pinned" aria-live="polite">
              <div className="explore-pinned-head">
                <h4><span className="explore-swatch" style={{ background: categoryColor(pinned.category) }} aria-hidden="true" />Pinned product: {pinned.name}</h4>
                <button type="button" className="btn btn-sm" onClick={() => setPinnedId('')}><PinOff size={14} aria-hidden="true" />Unpin</button>
              </div>
              <dl>
                <div><dt>Category</dt><dd>{pinned.category}</dd></div>
                <div><dt>Price</dt><dd>{formatMoney(pinned.price)}</dd></div>
                <div><dt>Units sold</dt><dd>{pinned.units.toLocaleString('en-US')}</dd></div>
                <div><dt>Revenue</dt><dd>{formatMoney(pinned.revenue)}</dd></div>
                <div><dt>Rating</dt><dd>{pinned.rating} / 5</dd></div>
                <div><dt>Revenue rank</dt><dd>#{rank} of {products.length}</dd></div>
              </dl>
            </div>
          ) : (
            <p className="explore-hint"><Pin size={14} aria-hidden="true" /> No product pinned. Click a bubble, or use the "Pin a product" menu.</p>
          )
        }
      >
        <ResponsiveChart height={380}>
          <ScatterChart margin={{ ...CHART_MARGIN, right: 24, bottom: 20 }}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            {/* XAxis type="number" makes this a real numeric axis (scatter needs numbers on both axes).
                scale="log" spaces ticks by powers of ten so cheap and expensive products both stay readable. */}
            <XAxis type="number" dataKey="price" name="Price" scale={logScale ? 'log' : 'auto'} domain={xDomain} ticks={xTicks} allowDataOverflow
              tickFormatter={formatMoney} tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK}
              label={{ value: 'Price', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis type="number" dataKey="units" name="Units sold" tickFormatter={formatCompact} tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} width={48}
              label={{ value: 'Units sold', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }} />
            {/* ZAxis is invisible: it maps revenue to bubble area, between 60 and 400 square pixels. */}
            <ZAxis type="number" dataKey="revenue" name="Revenue" range={[60, 400]} />
            <Tooltip cursor={{ strokeDasharray: '4 4', stroke: 'var(--axis)' }} content={<ProductTooltip />} />
            {categories.length > 1 && <Legend {...LEGEND_PROPS} />}
            {/* One Scatter per category so each gets its own colour and legend entry. */}
            {categories.map((c) => (
              <Scatter key={c} name={c} data={products.filter((p) => p.category === c)} fill={categoryColor(c)} shape={renderPoint} {...motion} />
            ))}
          </ScatterChart>
        </ResponsiveChart>
      </ChartCard>

      <ChartCard
        className="span-2"
        title="How the categories compare"
        subtitle="Six measures per category, each scaled 0 to 100"
        summary={`Radar of ${raw.map((r) => `${r.category}: revenue ${formatMoney(r.revenue)}, margin ${formatPercent(r.margin)}`).join('; ')}.`}
        table={radarTable}
        busy={refreshing}
        footer={
          <>
            <p className="explore-note">
              <strong>How to read this.</strong> Further from the centre is better. Revenue and Orders are a share of the best category (100 = leader).
              Margin is the profit margin itself. Growth compares the second half of the period with the first: 50 means flat, higher means growing.
              Satisfaction and Retention are the survey scores. The table has the real numbers.
            </p>
            <DataTable caption="Raw numbers behind the radar" {...radarTable} />
          </>
        }
      >
        {/* Recharts' own <Legend> is not keyboard accessible, so we render our own toggle buttons. */}
        {categories.length > 1 && (
          <ul className="explore-legend" aria-label="Show or hide categories">
            {categories.map((c) => (
              <li key={c}>
                <button type="button" className="btn btn-sm" aria-pressed={!hidden.has(c)} onClick={() => toggleSeries(c)}>
                  <span className="explore-swatch" style={{ background: categoryColor(c) }} aria-hidden="true" />
                  {c}
                </button>
              </li>
            ))}
          </ul>
        )}
        <ResponsiveChart height={360}>
          <RadarChart data={radar.data} outerRadius="72%">
            <PolarGrid stroke={GRID_STROKE} />
            <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            {/* The radius axis runs 0 to 100 because every measure was scaled to that range. */}
            <PolarRadiusAxis angle={30} domain={[0, 100]} ticks={[0, 50, 100]} tick={AXIS_TICK} axisLine={false} />
            <Tooltip content={<ChartTooltip formatValue={(v) => `${v} / 100`} title={(label) => label} />} />
            {/* Hidden series are simply not rendered. */}
            {shown.map((c) => (
              <Radar key={c} name={c} dataKey={c} stroke={categoryColor(c)} fill={categoryColor(c)} fillOpacity={0.25} strokeWidth={2} {...motion} />
            ))}
          </RadarChart>
        </ResponsiveChart>
      </ChartCard>
    </div>
  );
}
