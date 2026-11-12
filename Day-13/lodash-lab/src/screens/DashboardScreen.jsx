import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { averageRatingBy, formatMoney, headcountBy, hiresByYear, salaryByDepartment, salaryHistogram, seniorSplit, summarize, topSkills } from '../lib/stats';
import '../styles/dashboard.css';

const nf = new Intl.NumberFormat('en-US');
const pct = (value, total) => (total ? Math.round((value / total) * 100) : 0);
const bar = (item, total, noun = 'users') => `${item.label}: ${nf.format(item.value)} ${noun} (${pct(item.value, total)}%)`;

function Card({ id, title, sub, code, children }) {
  return (
    <section className="card dash-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {sub && <p className="card-sub">{sub}</p>}
      {children}
      <details>
        <summary>Lodash used</summary>
        <pre className="codebox">{code}</pre>
      </details>
    </section>
  );
}

function HBars({ items, total }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="hbar-list">
      {items.map((item) => (
        <li className="hbar-row" key={item.label}>
          <span className="hbar-label">{item.label}</span>
          <span className="hbar-track" role="img" aria-label={bar(item, total)}>
            <span className="hbar-fill" style={{ display: 'block', width: `${(item.value / max) * 100}%` }} />
          </span>
          <span className="hbar-num">{nf.format(item.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function VBars({ items, total, noun = 'users' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      <div className="vbars">
        {items.map((item) => (
          <div className="vbar-col" key={item.label}>
            <div className="vbar" role="img" aria-label={bar(item, total, noun)} style={{ height: `${(item.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="vbar-labels" aria-hidden="true">
        {items.map((item) => (
          <span key={item.label}>{item.short ?? item.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const { users } = useData();
  const summary = useMemo(() => summarize(users), [users]);
  const departments = useMemo(() => headcountBy(users, 'department'), [users]);
  const countries = useMemo(() => headcountBy(users, 'country'), [users]);
  const histogram = useMemo(() => salaryHistogram(users).map((b) => ({ ...b, label: `${formatMoney(b.start)} to ${formatMoney(b.end)}`, short: `${Math.round(b.start / 1000)}k` })), [users]);
  const hires = useMemo(() => hiresByYear(users).map((h) => ({ ...h, short: h.label.slice(2) })), [users]);
  const skills = useMemo(() => topSkills(users, 10), [users]);
  const split = useMemo(() => seniorSplit(users), [users]);
  const byDept = useMemo(() => salaryByDepartment(users), [users]);
  const ratings = useMemo(() => averageRatingBy(users, 'department'), [users]);

  const total = summary.total;
  const kpis = [
    ['Headcount', nf.format(total)],
    ['Average salary', formatMoney(summary.avgSalary)],
    ['Total payroll', formatMoney(summary.payroll)],
    ['Average rating', summary.avgRating.toFixed(2)],
    ['Average age', summary.avgAge.toFixed(1)],
    ['Countries', nf.format(summary.countries)],
  ];
  const seniorPct = pct(split.senior, total);
  const juniorPct = total ? 100 - seniorPct : 0;
  const hp = summary.highestPaid;
  const tr = summary.topRated;

  return (
    <div>
      <header className="dash-intro">
        <h1 style={{ fontSize: 20 }}>Dashboard</h1>
        <p className="muted">Every number below is computed from the full dataset by a Lodash chain; the code is shown under each card</p>
      </header>

      <section className="card dash-card" aria-labelledby="kpi-title" style={{ marginBottom: 16 }}>
        <h2 id="kpi-title">Key numbers</h2>
        <dl className="grid dash-kpis" style={{ margin: '12px 0 0' }}>
          {kpis.map(([label, value]) => (
            <div key={label}>
              <dt className="kpi-label">{label}</dt>
              <dd className="kpi-value" data-testid={`kpi-${label}`}>{value}</dd>
            </div>
          ))}
        </dl>
        {hp && tr && (
          <p className="card-sub" style={{ marginTop: 12, marginBottom: 0 }}>
            Highest paid: {hp.firstName} {hp.lastName} ({formatMoney(hp.salary)}). Top rated: {tr.firstName} {tr.lastName} ({tr.rating}). Newest hire: {summary.newestHire.joinedAt}.
          </p>
        )}
        <details>
          <summary>Lodash used</summary>
          <pre className="codebox">{'sumBy, meanBy, round, uniqBy, maxBy'}</pre>
        </details>
      </section>

      <div className="grid dash-grid">
        <Card id="dept-title" title="Headcount by department" code="countBy + toPairs + map + orderBy">
          <HBars items={departments} total={total} />
        </Card>
        <Card id="country-title" title="Headcount by country" code="countBy + toPairs + map + orderBy">
          <HBars items={countries} total={total} />
        </Card>
        <Card id="hist-title" title="Salary distribution" sub="People per $20,000 band" code="countBy + range + map">
          <VBars items={histogram} total={total} />
        </Card>
        <Card id="hires-title" title="Hires per year" code="countBy + range + map">
          <VBars items={hires} total={total} noun="hires" />
        </Card>
        <Card id="skills-title" title="Top 10 skills" code="flatMap + countBy + orderBy + take">
          <ol className="hbar-list" style={{ listStylePosition: 'inside' }}>
            {skills.map((s, i) => (
              <li className="hbar-row" key={s.label}>
                <span className="hbar-label">{i + 1}. {s.label}</span>
                <span className="hbar-track" role="img" aria-label={`${s.label}: ${nf.format(s.value)} people (${pct(s.value, total)}%)`}>
                  <span className="hbar-fill" style={{ display: 'block', width: `${(s.value / skills[0].value) * 100}%` }} />
                </span>
                <span className="hbar-num">{nf.format(s.value)}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card id="split-title" title="Senior vs junior" sub="Senior means age 40 or over" code="partition">
          <div className="stacked" role="img" aria-label={`Senior: ${nf.format(split.senior)} (${seniorPct}%), junior: ${nf.format(split.junior)} (${juniorPct}%)`}>
            <div className="stacked-senior" style={{ width: `${seniorPct}%` }} />
            <div className="stacked-junior" style={{ width: `${juniorPct}%` }} />
          </div>
          <ul className="legend">
            <li><span className="legend-swatch stacked-senior" />Senior (40+): {nf.format(split.senior)} ({seniorPct}%)</li>
            <li><span className="legend-swatch stacked-junior" />Junior (under 40): {nf.format(split.junior)} ({juniorPct}%)</li>
          </ul>
        </Card>
        <Card id="pay-title" title="Salary by department" code="groupBy + map + minBy + meanBy + maxBy + sortBy, mapValues for ratings">
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="data">
              <caption className="sr-only" style={{ position: 'absolute', left: -9999 }}>Salary range, average and rating per department</caption>
              <thead>
                <tr>
                  <th scope="col">Department</th>
                  <th scope="col" className="num">Min</th>
                  <th scope="col" className="num">Average</th>
                  <th scope="col" className="num">Max</th>
                  <th scope="col" className="num">Rating</th>
                </tr>
              </thead>
              <tbody>
                {byDept.map((d) => (
                  <tr key={d.department}>
                    <th scope="row">{d.department}</th>
                    <td className="num">{formatMoney(d.min)}</td>
                    <td className="num">{formatMoney(d.avg)}</td>
                    <td className="num">{formatMoney(d.max)}</td>
                    <td className="num">{ratings[d.department]?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
