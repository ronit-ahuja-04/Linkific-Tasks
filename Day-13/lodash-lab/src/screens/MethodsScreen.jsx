import { useMemo, useState } from 'react';
import { CATEGORIES, METHODS, formatValue, runMethod } from '../lib/methods';
import { useData } from '../context/DataContext';
import '../styles/methods.css';

function Badge({ entry, run }) {
  if (entry.random) return <span className="badge method-badge random">random: result changes each run</span>;
  if (!run.hasNative) return <span className="badge method-badge none">no native equivalent</span>;
  if (run.same) return <span className="badge method-badge same">same result</span>;
  return <span className="badge method-badge differs">different result</span>;
}

function MethodCard({ entry }) {
  const { setTab } = useData();
  const [runCount, setRunCount] = useState(0);
  // Computed once per card; only the "Run again" button changes runCount and so re-runs it
  const run = useMemo(() => runMethod(entry), [entry, runCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article className="card method-card" data-testid="method-card" aria-labelledby={`method-${entry.id}`}>
      <header className="method-head">
        <h3 id={`method-${entry.id}`}><code>{entry.id}</code></h3>
        {run.interactive ? <span className="badge method-badge none">interactive</span> : <Badge entry={entry} run={run} />}
      </header>
      <p className="card-sub">{entry.summary}</p>

      {run.interactive ? (
        <>
          <pre className="codebox"><code>{entry.lodashCode}</code></pre>
          <pre className="codebox"><code>{entry.nativeCode}</code></pre>
          <button type="button" className="btn btn-sm" onClick={() => setTab('search')}>Try it live in Search lab</button>
        </>
      ) : (
        <div className="stack method-body">
          <section>
            <h4>Input</h4>
            <pre className="codebox"><code>{formatValue(run.input)}</code></pre>
          </section>
          <section>
            <h4>Lodash</h4>
            <pre className="codebox"><code>{entry.lodashCode}</code></pre>
            <h4>Result</h4>
            <pre className="codebox" data-testid="lodash-result"><code>{formatValue(run.lodashResult)}</code></pre>
          </section>
          <section>
            <h4>Native alternative</h4>
            <pre className="codebox"><code>{entry.nativeCode}</code></pre>
            {run.hasNative && (
              <>
                <h4>Native result</h4>
                <pre className="codebox"><code>{formatValue(run.nativeResult)}</code></pre>
              </>
            )}
          </section>
          {!entry.random && run.hasNative && !run.same && run.facts.length > 0 && (
            <ul className="method-facts">{run.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
          )}
          {entry.random && run.facts.length > 0 && (
            <ul className="method-facts">{run.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
          )}
          {entry.random && (
            <div>
              <button type="button" className="btn btn-sm" onClick={() => setRunCount((n) => n + 1)}>Run again</button>
              <span className="muted method-runs" aria-live="polite"> Run {runCount + 1}</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function MethodsScreen() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const visible = METHODS.filter(
    (m) => (category === 'All' || m.category === category) && (needle === '' || m.id.toLowerCase().includes(needle))
  );
  const groups = CATEGORIES.map((name) => ({ name, items: visible.filter((m) => m.category === name) })).filter((g) => g.items.length > 0);

  return (
    <section className="methods" aria-labelledby="methods-title">
      <header className="methods-header">
        <h2 id="methods-title">{METHODS.length} Lodash methods demonstrated</h2>
        <p className="muted">Each card runs the Lodash call and, where one exists, the native JavaScript version, then compares them.</p>
      </header>

      <div className="methods-controls">
        <div className="row" role="group" aria-label="Filter by category">
          {['All', ...CATEGORIES].map((name) => (
            <button key={name} type="button" className={`btn btn-sm method-filter${category === name ? ' active' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
        <label className="field methods-search">
          <span>Search methods</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. group" />
        </label>
      </div>

      <p className="muted" role="status">Showing {visible.length} of {METHODS.length} methods</p>

      {groups.length === 0 && <p className="card">No method matches that search.</p>}
      {groups.map((group) => (
        <section key={group.name} className="methods-group" aria-labelledby={`cat-${group.name}`}>
          <h2 id={`cat-${group.name}`} className="methods-cat">{group.name} <span className="badge">{group.items.length}</span></h2>
          <div className="methods-grid">
            {group.items.map((entry) => <MethodCard key={entry.id} entry={entry} />)}
          </div>
        </section>
      ))}
    </section>
  );
}
