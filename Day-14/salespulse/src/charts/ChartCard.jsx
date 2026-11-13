import { useId, useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';

/**
 * ChartCard: the frame around every chart. It gives each chart a heading, a one-line description,
 * a "table view" toggle (the same numbers as a real <table>, for screen readers and for anyone who
 * wants exact values), and a faded "busy" look while new data loads (the old chart stays put, so
 * the page does not jump).
 *
 *   <ChartCard title="Revenue" subtitle="Monthly, all regions"
 *              table={{ columns: [{ key: 'label', label: 'Month' }, { key: 'revenue', label: 'Revenue', format: formatMoney }], rows }}>
 *     <ResponsiveChart>...</ResponsiveChart>
 *   </ChartCard>
 *
 * `summary` is read by screen readers in place of the picture ("Revenue rose from X to Y").
 */
export default function ChartCard({ title, subtitle, table, summary, actions, footer, busy = false, className = '', children }) {
  const [showTable, setShowTable] = useState(false);
  const headingId = useId();
  return (
    <section className={`chart-card${busy ? ' is-busy' : ''} ${className}`.trim()} aria-labelledby={headingId} aria-busy={busy || undefined}>
      <header className="chart-card-head">
        <div>
          <h3 id={headingId}>{title}</h3>
          {subtitle && <p className="chart-card-sub">{subtitle}</p>}
        </div>
        <div className="chart-card-actions">
          {actions}
          {table && (
            <button type="button" className="btn btn-sm" aria-pressed={showTable} onClick={() => setShowTable((v) => !v)} title="Switch between the chart and a table of the same numbers">
              {showTable ? <BarChart3 size={14} aria-hidden="true" /> : <Table2 size={14} aria-hidden="true" />}
              {showTable ? 'Chart view' : 'Table view'}
            </button>
          )}
        </div>
      </header>
      {summary && <p className="sr-only">{summary}</p>}
      {showTable && table ? <DataTable caption={`${title}: data`} {...table} /> : children}
      {footer && <div className="chart-card-foot">{footer}</div>}
    </section>
  );
}

/** A plain accessible table. `columns: [{ key, label, format?, numeric? }]`, `rows: [{...}]` */
export function DataTable({ caption, columns, rows }) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="data">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric === false ? '' : 'num'}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key ?? row.label ?? row.name ?? i}>
              {columns.map((c, index) => {
                const value = c.format ? c.format(row[c.key], row) : row[c.key];
                return index === 0 ? <th key={c.key} scope="row" className={c.numeric === true ? 'num' : ''}>{value}</th> : <td key={c.key} className={c.numeric === false ? '' : 'num'}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
