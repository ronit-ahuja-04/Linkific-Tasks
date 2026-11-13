import { DataTable } from '../../charts/ChartCard';
import { regionColor, categoryColor } from '../../charts/theme';
import { formatMoney, formatPercent, monthName, totalsBy } from '../../lib/metrics';

/**
 * The "Month details" panel: everything about the month picked in the bar chart (by click or by
 * the "Inspect a month" select). Pure numbers from the period's rows, no Recharts needed here.
 */
export default function MonthDetails({ month, rows, split, onClear }) {
  if (!month) {
    return <p className="sales-details-empty">Click a bar in the chart, or use the "Inspect a month" menu, to see that month in detail.</p>;
  }
  const monthRows = rows.filter((r) => r.month === month);
  const revenue = monthRows.reduce((t, r) => t + r.revenue, 0);
  const profit = revenue - monthRows.reduce((t, r) => t + r.cost, 0);
  const orders = monthRows.reduce((t, r) => t + r.orders, 0);
  const bestRegion = totalsBy(monthRows, 'region')[0];
  const bestCategory = totalsBy(monthRows, 'category')[0];
  const shares = totalsBy(monthRows, split);
  const colorOf = split === 'region' ? regionColor : categoryColor;
  const stats = [
    ['Revenue', formatMoney(revenue)],
    ['Profit', formatMoney(profit)],
    ['Orders', orders.toLocaleString('en-US')],
    ['Best region', bestRegion?.name ?? 'None', bestRegion && formatPercent(bestRegion.share) + ' of revenue'],
    ['Best category', bestCategory?.name ?? 'None', bestCategory && formatPercent(bestCategory.share) + ' of revenue'],
  ];
  return (
    <div>
      <dl className="sales-stats" aria-label={`${monthName(month)} summary`}>
        {stats.map(([term, value, note]) => (
          <div className="sales-stat" key={term}>
            <dt>{term}</dt>
            <dd>{value}{note && <small>{note}</small>}</dd>
          </div>
        ))}
      </dl>
      <DataTable
        caption={`${monthName(month)}: share of revenue by ${split}`}
        columns={[
          { key: 'name', label: split === 'region' ? 'Region' : 'Category', numeric: false, format: (v) => <><span className="sales-share-key" style={{ background: colorOf(v) }} aria-hidden="true" />{v}</> },
          { key: 'revenue', label: 'Revenue', format: formatMoney },
          { key: 'share', label: 'Share', format: (v) => formatPercent(v) },
        ]}
        rows={shares}
      />
      <p style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-sm" onClick={onClear}>Clear selection</button>
      </p>
    </div>
  );
}
