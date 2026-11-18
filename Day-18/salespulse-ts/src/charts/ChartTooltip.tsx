/**
 * A CUSTOM TOOLTIP for Recharts. Recharts calls it with `active`, `payload` (one entry per series
 * at the hovered position) and `label` (the x value). It lists EVERY series at that position, so
 * the pointer never has to land exactly on a line; values lead (bold), names follow; each row is
 * keyed by a short stroke of the series color, not a filled box.
 *
 *   <Tooltip content={<ChartTooltip formatValue={formatMoney} title={(label) => `Revenue in ${label}`} />} />
 *
 *   formatValue(value, entry)   how to print each number
 *   title(label, payload)       the heading (defaults to the label)
 *   footer(payload)             optional extra line (a total, a hint such as "Click for details")
 */
/** The fields of one tooltip row that we read. Recharts' own entries (and hand-made ones) fit this shape. */
export interface TooltipEntry {
  dataKey?: unknown;
  name?: string | number;
  value?: number | string | readonly (number | string)[] | null;
  color?: string;
  stroke?: string;
  fill?: string;
  /** the whole data row behind this point (Recharts types it loosely, so it is `unknown` here: check before use) */
  payload?: unknown;
}
type Label = string | number | undefined;

export interface ChartTooltipProps {
  /** set by Recharts */
  active?: boolean;
  /** set by Recharts: one entry per series at the hovered position */
  payload?: readonly TooltipEntry[];
  /** set by Recharts: the x value */
  label?: Label;
  /** how to print each NUMBER (a value that is not a number is printed as it is) */
  formatValue?: (value: number, entry: TooltipEntry) => string;
  title?: (label: Label, payload: readonly TooltipEntry[]) => string;
  footer?: (payload: readonly TooltipEntry[]) => string;
}

export default function ChartTooltip({ active, payload, label, formatValue = String, title, footer }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((entry) => entry.value !== undefined && entry.value !== null);
  return (
    <div className="chart-tooltip" role="status">
      <p className="chart-tooltip-title">{title ? title(label, payload) : label}</p>
      <ul>
        {rows.map((entry) => (
          <li key={typeof entry.dataKey === 'string' || typeof entry.dataKey === 'number' ? entry.dataKey : entry.name}>
            <span className="tooltip-key" style={{ background: entry.color ?? entry.stroke ?? entry.fill }} aria-hidden="true" />
            <strong>{typeof entry.value === 'number' ? formatValue(entry.value, entry) : String(entry.value)}</strong>
            <span className="tooltip-name">{entry.name ?? String(entry.dataKey)}</span>
          </li>
        ))}
      </ul>
      {footer && <p className="chart-tooltip-footer">{footer(payload)}</p>}
    </div>
  );
}
