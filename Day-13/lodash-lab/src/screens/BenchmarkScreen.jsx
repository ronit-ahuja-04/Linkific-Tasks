import { useEffect, useRef, useState } from 'react';
import { getDataset } from '../data/generateUsers';
import { runSuite, suitesFor } from '../lib/benchmarks';
import '../styles/benchmark.css';

const SIZES = [1000, 10000, 50000, 100000];
const ITERATIONS = [5, 10, 20];
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Runs suites one by one, yielding to the browser between them so the UI can paint progress.
 * `run` and `isCancelled` are injectable; a test can pass its own whole runner instead.
 */
async function runBenchmarks(suites, users, { iterations, run = runSuite, onStart, onResult, isCancelled = () => false }) {
  for (let i = 0; i < suites.length; i += 1) {
    if (isCancelled()) return;
    onStart(i + 1, suites.length, suites[i]);
    await tick();
    if (isCancelled()) return;
    onResult(run(suites[i], users, { iterations }));
  }
}

const ms = (n) => `${n.toFixed(n < 10 ? 2 : 1)} ms`;

function Bars({ row }) {
  const max = Math.max(row.lodashMs, row.nativeMs, 0.0001);
  return (
    <div className="bars" role="img" aria-label={`Lodash ${ms(row.lodashMs)}, native ${ms(row.nativeMs)}`}>
      <span className="bar bar-lodash" style={{ width: `${(row.lodashMs / max) * 100}%` }} />
      <span className="bar bar-native" style={{ width: `${(row.nativeMs / max) * 100}%` }} />
    </div>
  );
}

export default function BenchmarkScreen({ runner = runBenchmarks, initialIterations = 5 }) {
  const [size, setSize] = useState(1000);
  const [iterations, setIterations] = useState(initialIterations);
  const [status, setStatus] = useState('idle'); // idle | preparing | running | done | cancelled
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState([]);
  const cancelled = useRef(false);
  const runId = useRef(0);

  useEffect(() => () => { cancelled.current = true; }, []);

  const busy = status === 'preparing' || status === 'running';
  const iterationOptions = [...new Set([initialIterations, ...ITERATIONS])].sort((a, b) => a - b);

  const start = async () => {
    runId.current += 1;
    const id = runId.current;
    cancelled.current = false;
    setResults([]);
    setProgress(null);
    setStatus('preparing');
    await tick(); // let "Preparing data…" paint before generating a big dataset
    if (cancelled.current || id !== runId.current) return;
    const users = getDataset(size);
    setStatus('running');
    await runner(suitesFor(size), users, {
      iterations,
      isCancelled: () => cancelled.current || id !== runId.current,
      onStart: (index, total, suite) => setProgress({ index, total, title: suite.title }),
      onResult: (row) => setResults((rows) => [...rows, row]),
    });
    if (id === runId.current && !cancelled.current) setStatus('done');
  };
  const cancel = () => {
    cancelled.current = true;
    setStatus('cancelled');
  };

  const nativeWins = results.filter((r) => r.winner === 'native').length;
  const lodashWins = results.filter((r) => r.winner === 'lodash').length;

  return (
    <section className="bench stack" aria-labelledby="bench-h">
      <div className="card stack">
        <h2 id="bench-h">Lodash vs native</h2>
        <fieldset className="bench-sizes" disabled={busy}>
          <legend>Dataset size</legend>
          {SIZES.map((n) => (
            <label key={n} className="check">
              <input type="radio" name="bench-size" checked={size === n} onChange={() => setSize(n)} />
              {n.toLocaleString('en-US')}
            </label>
          ))}
        </fieldset>
        <div className="row">
          <div className="field">
            <label htmlFor="bench-iter">Iterations</label>
            <select id="bench-iter" value={iterations} disabled={busy} onChange={(e) => setIterations(Number(e.target.value))}>
              {iterationOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={start} disabled={busy}>Run benchmarks</button>
          {busy && <button type="button" className="btn" onClick={cancel}>Cancel</button>}
        </div>
        <p role="status" aria-live="polite" className="muted">
          {status === 'preparing' && 'Preparing data…'}
          {status === 'running' && progress && `Running ${progress.index} of ${progress.total}: ${progress.title}`}
          {status === 'cancelled' && `Cancelled after ${results.length} suites.`}
          {status === 'done' && `Finished ${results.length} suites.`}
        </p>
        <details>
          <summary>How we measure</summary>
          <p className="muted">
            Each side runs a few warm-up passes first so the engine has optimised it, then the chosen number of timed runs. We report the
            median of those runs, so one slow run (garbage collection) does not decide the answer.
          </p>
        </details>
      </div>

      {results.length > 0 && (
        <div className="card stack">
          <p className="summary"><strong>Native won {nativeWins} of {results.length} suites; Lodash won {lodashWins}.</strong></p>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Scrollable table">
            <table className="data">
              <caption className="sr-only">Benchmark results</caption>
              <thead>
                <tr><th>Suite</th><th className="num">Lodash</th><th className="num">Native</th><th>Winner</th><th>Factor</th><th>Chart</th></tr>
              </thead>
              <tbody>
                {results.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td className="num">{ms(row.lodashMs)}</td>
                    <td className="num">{ms(row.nativeMs)}</td>
                    <td><span className="badge">{row.winner === 'tie' ? 'Tie' : row.winner === 'native' ? 'Native' : 'Lodash'}</span></td>
                    <td>{row.winner === 'tie' ? 'same speed' : `${row.winner} ${row.factor.toFixed(1)}× faster`}</td>
                    <td><Bars row={row} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card stack">
        <h3>An honest note</h3>
        <p>Native is usually as fast or faster for simple operations: the engine optimises built-ins like <code>map</code>, <code>filter</code> and <code>sort</code> heavily.</p>
        <p>Lodash wins on ergonomics, deep paths and null safety (<code>get</code>, <code>set</code>, <code>omit</code>), and consistent behaviour on every input.</p>
        <p>Numbers vary by machine and engine, so treat them as a guide, not a verdict.</p>
        <p>For copies: <code>cloneDeep</code> vs <code>structuredClone</code> vs <code>JSON.parse(JSON.stringify())</code> differ in speed and in what they keep (dates, undefined, class instances).</p>
      </div>
    </section>
  );
}
