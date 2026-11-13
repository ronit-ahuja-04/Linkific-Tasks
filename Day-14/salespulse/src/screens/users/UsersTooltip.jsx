import { formatPercent } from '../../lib/metrics';
import { seriesColor } from '../../charts/theme';
import { perVisitor, weekdayOf } from './helpers';

/**
 * A CUSTOM TOOLTIP with its own layout. Recharts gives `payload`: one entry per series of the chart
 * you hover. Each entry has `.payload`, the whole data row behind that x position. So even though
 * this chart draws only one measure, we can print every measure of the row. The three synced charts
 * all use this component, so the box looks the same whichever chart the pointer is over.
 */
export default function UsersTooltip({ active, payload, daily }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const rows = [
    ['Visitors', row.visitors.toLocaleString('en-US'), seriesColor(0)],
    ['Sessions', row.sessions.toLocaleString('en-US'), seriesColor(1)],
    ['Sign-ups', row.signups.toLocaleString('en-US'), seriesColor(2)],
    ['Conversion', formatPercent(row.conversion, 2), seriesColor(3)],
    ['Sessions per visitor', perVisitor(row).toFixed(2), null],
  ];
  return (
    <div className="chart-tooltip" role="status">
      <p className="chart-tooltip-title">{daily ? `${weekdayOf(row.date)}, ${row.label}` : `Week of ${row.label}`}</p>
      <ul>
        {rows.map(([name, value, color]) => (
          <li key={name}>
            <span className="tooltip-key" style={{ background: color ?? 'var(--text-muted)' }} aria-hidden="true" />
            <strong>{value}</strong>
            <span className="tooltip-name">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
