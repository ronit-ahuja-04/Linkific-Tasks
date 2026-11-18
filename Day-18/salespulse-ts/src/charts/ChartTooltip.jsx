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
export default function ChartTooltip({ active, payload, label, formatValue = String, title, footer }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((entry) => entry.value !== undefined && entry.value !== null);
  return (
    <div className="chart-tooltip" role="status">
      <p className="chart-tooltip-title">{title ? title(label, payload) : label}</p>
      <ul>
        {rows.map((entry) => (
          <li key={entry.dataKey ?? entry.name}>
            <span className="tooltip-key" style={{ background: entry.color ?? entry.stroke ?? entry.fill }} aria-hidden="true" />
            <strong>{formatValue(entry.value, entry)}</strong>
            <span className="tooltip-name">{entry.name ?? entry.dataKey}</span>
          </li>
        ))}
      </ul>
      {footer && <p className="chart-tooltip-footer">{footer(payload)}</p>}
    </div>
  );
}
