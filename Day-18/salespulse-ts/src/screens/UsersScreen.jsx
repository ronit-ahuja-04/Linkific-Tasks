import { useMemo, useState } from 'react';
import { Bar, BarChart, Brush, CartesianGrid, Legend, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from 'recharts';
import { RotateCcw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import ChartCard from '../charts/ChartCard';
import ResponsiveChart from '../charts/ResponsiveChart';
import { AXIS_LINE, AXIS_TICK, CHART_MARGIN, GRID_STROKE, LEGEND_PROPS, seriesColor } from '../charts/theme';
import { useChartMotion } from '../charts/useChartMotion';
import { formatCompact, formatPercent, weeklyUsers } from '../lib/metrics';
import UsersTooltip from './users/UsersTooltip';
import { perVisitor, weekdayOf } from './users/helpers';
import './users.css';

// All three charts share this id: hovering one draws the tooltip and cursor on the other two.
const SYNC_ID = 'users-sync';
// Same fixed Y axis width + same margin in every chart, so their plot areas line up exactly.
const Y_WIDTH = 56;
const MARGIN = { ...CHART_MARGIN, left: 0 };
const num = (n) => n.toLocaleString('en-US');

export default function UsersScreen() {
  const { ready, users, refreshing } = useDashboard();
  const motion = useChartMotion();
  const [granularity, setGranularity] = useState('weekly');
  // null = not zoomed. Otherwise the visible window as data indexes. Shared by all three charts.
  const [zoom, setZoom] = useState(null);

  const weekly = granularity === 'weekly';
  // weeklyUsers also returns a short last block when the data ends mid-week; a 1-day "week" would
  // draw a fake cliff, so keep complete weeks only.
  const full = useMemo(() => (weekly ? weeklyUsers(users).slice(0, Math.floor(users.length / 7)) : users), [weekly, users]);
  const rows = useMemo(() => full.map((r) => ({ ...r, perVisitor: perVisitor(r) })), [full]);

  if (!ready) return null;

  const last = Math.max(rows.length - 1, 0);
  // Clamp: the data can get shorter (new region/period) while a zoom is stored.
  const start = Math.min(zoom?.start ?? 0, last);
  const end = Math.min(zoom?.end ?? last, last);
  const visible = rows.slice(start, end + 1);
  const zoomed = start !== 0 || end !== last;

  const switchGranularity = (value) => {
    setGranularity(value);
    setZoom(null); // indexes mean something else in the other granularity
  };

  const total = (key) => visible.reduce((s, r) => s + r[key], 0);
  const visitors = total('visitors');
  const sessions = total('sessions');
  const signups = total('signups');
  const conversion = visitors ? (signups / visitors) * 100 : 0;

  // Weekend insight: always worked out from the daily rows covered by the visible range.
  const dailyCovered = weekly ? users.slice(start * 7, (end + 1) * 7) : users.slice(start, end + 1);
  const isWeekend = (d) => ['Saturday', 'Sunday'].includes(weekdayOf(d.date));
  const avg = (list) => (list.length ? list.reduce((s, r) => s + r.visitors, 0) / list.length : 0);
  const weekendAvg = avg(dailyCovered.filter(isWeekend));
  const weekdayAvg = avg(dailyCovered.filter((d) => !isWeekend(d)));
  const weekendDiff = weekdayAvg ? Math.round(((weekdayAvg - weekendAvg) / weekdayAvg) * 100) : null;

  // Busiest week (over the whole period) for a ReferenceArea highlight.
  const weeks = weeklyUsers(users).slice(0, Math.floor(users.length / 7));
  const peak = weeks.length ? weeks.reduce((a, b) => (b.visitors > a.visitors ? b : a)) : null;
  let peakFrom = null;
  let peakTo = null;
  if (peak) {
    const endDate = users[Math.min(users.indexOf(users.find((d) => d.date === peak.date)) + 6, users.length - 1)]?.date;
    const inPeak = visible.filter((r) => r.date >= peak.date && r.date <= endDate);
    if (inPeak.length) {
      peakFrom = inPeak[0].label;
      peakTo = inPeak[inPeak.length - 1].label;
    }
  }

  const unit = weekly ? 'week' : 'day';
  const labelHeader = weekly ? 'Week starting' : 'Day';
  const labelCol = { key: 'label', label: labelHeader, numeric: false };
  const tableRows = visible; // capped to the zoomed range
  const periodText = visible.length ? `${visible[0].label} to ${visible[visible.length - 1].label}` : 'no data';

  const tooltip = <Tooltip content={<UsersTooltip daily={!weekly} />} cursor={{ stroke: 'var(--axis)' }} />;
  const commonChart = { data: visible, syncId: SYNC_ID, syncMethod: 'value', margin: MARGIN };
  const grid = <CartesianGrid vertical={false} stroke={GRID_STROKE} />;
  const yAxis = (formatter) => <YAxis width={Y_WIDTH} tickLine={false} axisLine={false} tick={AXIS_TICK} tickFormatter={formatter} />;
  const hiddenX = <XAxis dataKey="label" hide />;
  const peakArea = peakFrom && (
    <ReferenceArea x1={peakFrom} x2={peakTo} fill="var(--series-1)" fillOpacity={0.1} stroke="none" />
  );

  return (
    <div>
      <div className="users-controls">
        <span className="users-controls-label" id="users-gran-label">Granularity</span>
        <div className="segmented" role="group" aria-labelledby="users-gran-label">
          <button type="button" aria-pressed={!weekly} onClick={() => switchGranularity('daily')}>Daily</button>
          <button type="button" aria-pressed={weekly} onClick={() => switchGranularity('weekly')}>Weekly</button>
        </div>
        {zoomed && (
          <button type="button" className="btn btn-sm" onClick={() => setZoom(null)}>
            <RotateCcw size={14} aria-hidden="true" /> Reset zoom
          </button>
        )}
      </div>

      <dl className="users-stats" aria-label={`Totals for ${periodText}`}>
        <div className="users-stat"><dt>Visitors</dt><dd>{num(visitors)}</dd></div>
        <div className="users-stat"><dt>Sessions</dt><dd>{num(sessions)}</dd></div>
        <div className="users-stat"><dt>Sign-ups</dt><dd>{num(signups)}</dd></div>
        <div className="users-stat"><dt>Average conversion</dt><dd>{formatPercent(conversion, 2)}</dd></div>
      </dl>
      {weekendDiff !== null && (
        <p className="users-insight">
          {weekendDiff >= 0 ? `Weekends average ${weekendDiff}% fewer visitors` : `Weekends average ${-weekendDiff}% more visitors`} than weekdays ({formatCompact(weekendAvg)} vs {formatCompact(weekdayAvg)} a day).
        </p>
      )}
      <p className="users-hint">Hover any chart to read all three at the same {unit}. Drag the handles under the bottom chart to zoom them together.</p>

      <div className="dash-grid">
        <div className="span-2 users-stack">
          {/* ReferenceArea (inside the first chart) shades the busiest week: an x range, named in the subtitle so it is not colour-only. */}
          {/* (a) Two lines in one chart: both are counts of people/visits, so one axis is honest. */}
          <ChartCard
            title="Visitors and sessions"
            subtitle={`${weekly ? 'Weekly' : 'Daily'} totals, ${periodText}${peakFrom ? `. Shaded band: busiest week (starts ${peak.label})` : ''}`}
            busy={refreshing}
            summary={`Visitors and sessions per ${unit}. Total ${num(visitors)} visitors and ${num(sessions)} sessions in the visible period.`}
            table={{ columns: [labelCol, { key: 'visitors', label: 'Visitors', format: num }, { key: 'sessions', label: 'Sessions', format: num }], rows: tableRows }}
          >
            <ResponsiveChart height={240}>
              <LineChart {...commonChart}>
                {grid}
                {hiddenX}
                {yAxis(formatCompact)}
                {tooltip}
                <Legend {...LEGEND_PROPS} />
                {peakArea}
                <Line type="monotone" dataKey="visitors" name="Visitors" stroke={seriesColor(0)} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
                <Line type="monotone" dataKey="sessions" name="Sessions" stroke={seriesColor(1)} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
              </LineChart>
            </ResponsiveChart>
          </ChartCard>

          {/* (b) Bars: sign-ups are counts per period, so bars read well. */}
          <ChartCard
            title="Sign-ups"
            subtitle={`New accounts per ${unit}`}
            busy={refreshing}
            summary={`${num(signups)} sign-ups in the visible period.`}
            table={{ columns: [labelCol, { key: 'signups', label: 'Sign-ups', format: num }], rows: tableRows }}
          >
            <ResponsiveChart height={200}>
              <BarChart {...commonChart}>
                {grid}
                {hiddenX}
                {yAxis(formatCompact)}
                {tooltip}
                <Bar dataKey="signups" name="Sign-ups" fill={seriesColor(2)} radius={[4, 4, 0, 0]} maxBarSize={weekly ? 24 : 8} {...motion} />
              </BarChart>
            </ResponsiveChart>
          </ChartCard>

          {/* (c) Conversion is a percentage: a different unit, so it gets its own chart, not a second axis. */}
          <ChartCard
            title="Conversion rate"
            subtitle="Share of visitors who sign up. Drag the handles below to zoom all three charts."
            busy={refreshing}
            summary={`Average conversion ${formatPercent(conversion, 2)} in the visible period.`}
            table={{ columns: [labelCol, { key: 'conversion', label: 'Conversion', format: (v) => formatPercent(v, 2) }, { key: 'perVisitor', label: 'Sessions per visitor', format: (v) => v.toFixed(2) }], rows: tableRows }}
          >
            <ResponsiveChart height={260}>
              {/* The bottom chart gets the FULL data: the Brush crops it itself. The other two get the same slice. */}
              <LineChart key={granularity} {...commonChart} data={rows}>
                {grid}
                <XAxis dataKey="label" tickLine={false} axisLine={AXIS_LINE} tick={AXIS_TICK} interval="preserveStartEnd" minTickGap={32} />
                {yAxis((v) => `${v}%`)}
                {tooltip}
                <Line type="monotone" dataKey="conversion" name="Conversion" stroke={seriesColor(3)} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--bg-surface)', strokeWidth: 2 }} {...motion} />
                {/* Brush: the draggable range slider. Controlled: its indexes live in React state, so the
                    other charts can slice their data to the same window (Brush alone only crops its own chart). */}
                <Brush dataKey="label" height={28} travellerWidth={10} startIndex={start} endIndex={end} onChange={(r) => setZoom({ start: r.startIndex, end: r.endIndex })} stroke="var(--axis)" fill="var(--bg-sunken)" />
              </LineChart>
            </ResponsiveChart>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
