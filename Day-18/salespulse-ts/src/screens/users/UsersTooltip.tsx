import { numberField, stringField } from '../../lib/guards';
import { formatPercent } from '../../lib/metrics';
import type { DailyUsers } from '../../types';
import { seriesColor } from '../../charts/theme';
import { perVisitor, weekdayOf } from './helpers';

/**
 * A CUSTOM TOOLTIP with its own layout. Recharts gives `payload`: one entry per series of the chart
 * you hover. Each entry has `.payload`, the whole data row behind that x position. So even though
 * this chart draws only one measure, we can print every measure of the row. The three synced charts
 * all use this component, so the box looks the same whichever chart the pointer is over.
 */
/** The row behind a hovered point: a day or a week, with the numbers this tooltip prints */
type UsersPoint = DailyUsers;

/** Recharts types a tooltip entry's `.payload` as `any`; this turns it into a real UsersPoint, or says it is not one */
function toUsersPoint(value: unknown): UsersPoint | null {
  const visitors = numberField(value, 'visitors');
  const sessions = numberField(value, 'sessions');
  const signups = numberField(value, 'signups');
  const conversion = numberField(value, 'conversion');
  const date = stringField(value, 'date');
  const label = stringField(value, 'label');
  if (visitors === undefined || sessions === undefined || signups === undefined || conversion === undefined || date === undefined || label === undefined) {
    return null;
  }
  return { visitors, sessions, signups, conversion, date, label };
}

interface UsersTooltipProps {
  /** set by Recharts */
  active?: boolean;
  /** set by Recharts */
  payload?: readonly { payload?: unknown }[];
  /** true for a day, false for a week */
  daily: boolean;
}

export default function UsersTooltip({ active, payload, daily }: UsersTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = toUsersPoint(payload[0]?.payload);
  if (!row) return null;
  const rows: [name: string, value: string, color: string | null][] = [
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
