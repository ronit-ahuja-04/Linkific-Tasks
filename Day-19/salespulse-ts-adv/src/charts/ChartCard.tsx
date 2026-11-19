import { useId, useState, type ReactNode } from 'react';
import { Table2, BarChart3 } from 'lucide-react';
import { Text } from '../components/Text';

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
/**
 * One column of a data table. The `key` must be a real field of the row, and `format` receives the value
 * of THAT field with its own type: for `{ key: 'revenue', format: formatMoney }` the value is a number.
 * (A mapped type with one entry per field, then indexed by the union of keys, gives one column shape per key.)
 */
type ColumnByKey<Row> = {
  [K in keyof Row & string]: {
    key: K;
    label: string;
    /** how to print the cell; the whole row is passed too */
    format?: (value: Row[K], row: Row) => ReactNode;
    /** right-aligned digits (the default for every column but the first) */
    numeric?: boolean;
  };
};
export type TableColumn<Row> = ColumnByKey<Row>[keyof Row & string];
export interface TableSpec<Row> {
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
}

interface ChartCardProps<Row> {
  title: string;
  subtitle?: ReactNode;
  /** the same numbers as a real <table>, behind a "Table view" button */
  table?: TableSpec<Row>;
  summary?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  className?: string;
  children: ReactNode;
}

export default function ChartCard<Row extends object = Record<string, never>>({
  title, subtitle, table, summary, actions, footer, busy = false, className = '', children,
}: ChartCardProps<Row>) {
  const [showTable, setShowTable] = useState(false);
  const headingId = useId();
  return (
    <section className={`chart-card${busy ? ' is-busy' : ''} ${className}`.trim()} aria-labelledby={headingId} aria-busy={busy || undefined}>
      <header className="chart-card-head">
        <div>
          <Text as="h3" id={headingId}>{title}</Text>
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

/** Which of a row's own fields can name it (used as the React key) */
const rowKey = (row: object, index: number): string | number => {
  for (const field of ['key', 'label', 'name']) {
    const value: unknown = Object.entries(row).find(([k]) => k === field)?.[1];
    if (typeof value === 'string' || typeof value === 'number') return value;
  }
  return index;
};

/** One cell. `K` ties the column's key to the type its `format` receives: the reason this is a function of its own. */
function cellOf<Row, K extends keyof Row & string>(column: ColumnByKey<Row>[K], row: Row): ReactNode {
  const value = row[column.key];
  return column.format ? column.format(value, row) : printable(value);
}

/** A cell's raw value as something React can print: text and numbers as they are, anything else as text */
const printable = (value: unknown): ReactNode => (typeof value === 'string' || typeof value === 'number' ? value : value == null ? '' : String(value));

/** A plain accessible table. `columns: [{ key, label, format?, numeric? }]`, `rows: [{...}]` */
export function DataTable<Row extends object>({ caption, columns, rows }: TableSpec<Row> & { caption: string }) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="data">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric === false ? '' : 'num'}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c, index) => {
                const value = cellOf(c, row);
                return index === 0 ? <th key={c.key} scope="row" className={c.numeric === true ? 'num' : ''}>{value}</th> : <td key={c.key} className={c.numeric === false ? '' : 'num'}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
