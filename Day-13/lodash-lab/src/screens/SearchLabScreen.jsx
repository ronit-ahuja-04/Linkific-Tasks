import { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { useThrottledCallback } from '../hooks/useThrottle';
import { searchUsers } from '../lib/query';
import '../styles/searchlab.css';

const LOG_SIZE = 10;

export default function SearchLabScreen() {
  const { index } = useData();

  // ---- debounce demo state ----
  const [text, setText] = useState('');
  const [keystrokes, setKeystrokes] = useState(0);
  const [calls, setCalls] = useState(0);
  const [last, setLast] = useState(null); // { query, count, names }
  const [pending, setPending] = useState(false);
  const [wait, setWait] = useState(300);
  const [leading, setLeading] = useState(false);
  const [trailing, setTrailing] = useState(true);
  const [maxWaitText, setMaxWaitText] = useState('');
  const maxWaitNumber = Number(maxWaitText);
  const maxWait = maxWaitText !== '' && maxWaitNumber > 0 ? maxWaitNumber : undefined;

  // ---- throttle demo state ----
  const [events, setEvents] = useState(0);
  const [runs, setRuns] = useState(0);
  const [throttleWait, setThrottleWait] = useState(500);
  const [tLeading, setTLeading] = useState(true);
  const [tTrailing, setTTrailing] = useState(true);

  // ---- timeline ----
  const [log, setLog] = useState([]);
  const startRef = useRef(null);
  const idRef = useRef(0);

  // Only called from event handlers and timer callbacks, never during render
  const addLog = (type) => {
    const now = Date.now();
    if (startRef.current === null) startRef.current = now;
    idRef.current += 1;
    const entry = { id: idRef.current, type, t: now - startRef.current };
    setLog((current) => [entry, ...current].slice(0, LOG_SIZE));
  };

  const search = (query) => {
    const found = searchUsers(index, { query });
    setPending(false);
    setCalls((n) => n + 1);
    setLast({ query, count: found.length, names: found.slice(0, 5).map((u) => `${u.firstName} ${u.lastName}`) });
    addLog('call');
  };
  const debounced = useDebouncedCallback(search, wait, { leading, trailing, maxWait });

  const onType = (event) => {
    const value = event.target.value;
    setText(value);
    setKeystrokes((n) => n + 1);
    addLog('keystroke');
    setPending(trailing); // a leading call that runs right now clears it again inside `search`
    debounced(value);
  };

  const resetPending = () => setPending(false); // changing an option replaces the debounced function
  const cancelPending = () => {
    debounced.cancel();
    setPending(false);
  };
  const flushNow = () => {
    debounced.flush();
    setPending(false);
  };

  const onThrottled = () => {
    setRuns((n) => n + 1);
    addLog('throttled run');
  };
  const throttled = useThrottledCallback(onThrottled, throttleWait, { leading: tLeading, trailing: tTrailing });
  const onClickFast = () => {
    setEvents((n) => n + 1);
    addLog('click');
    throttled();
  };

  const resetAll = () => {
    debounced.cancel();
    throttled.cancel();
    setText(''); setKeystrokes(0); setCalls(0); setLast(null); setPending(false);
    setEvents(0); setRuns(0); setLog([]);
    startRef.current = null;
  };

  return (
    <section className="searchlab" aria-labelledby="searchlab-title">
      <header>
        <h2 id="searchlab-title">Debounce and throttle playground</h2>
        <p className="muted">Debounce waits until calls stop, then runs once. Throttle runs at most once per interval.</p>
      </header>

      <div className="searchlab-grid">
        <section className="card stack" aria-labelledby="debounce-title">
          <h3 id="debounce-title">Debounce: search as you type</h3>
          <label className="field">
            <span>Type here</span>
            <input type="text" value={text} onChange={onType} autoComplete="off" />
          </label>

          <div className="row searchlab-stats">
            <span className="badge">Keystrokes: {keystrokes}</span>
            <span className="badge">Search calls: {calls}</span>
            <span className="badge">Saved: {keystrokes - calls}</span>
            <span className={`badge searchlab-pending${pending ? ' on' : ''}`} role="status">
              {pending ? 'Pending: waiting for you to stop typing' : 'Idle'}
            </span>
          </div>

          <div className="searchlab-result" aria-live="polite">
            {last === null ? (
              <p className="muted">No search has run yet.</p>
            ) : (
              <>
                <p><strong>{last.count}</strong> users match &quot;{last.query}&quot;</p>
                <ol className="searchlab-names">{last.names.map((n) => <li key={n}>{n}</li>)}</ol>
              </>
            )}
          </div>

          <fieldset className="searchlab-options">
            <legend>Debounce options</legend>
            <label className="field">
              <span>Wait: {wait} ms</span>
              <input type="range" min="100" max="1000" step="50" value={wait} onChange={(e) => { setWait(Number(e.target.value)); resetPending(); }} />
            </label>
            <label className="row"><input type="checkbox" checked={leading} onChange={(e) => { setLeading(e.target.checked); resetPending(); }} /> Leading</label>
            <label className="row"><input type="checkbox" checked={trailing} onChange={(e) => { setTrailing(e.target.checked); resetPending(); }} /> Trailing</label>
            <label className="field">
              <span>Max wait (ms, empty = off)</span>
              <input type="number" min="0" step="100" value={maxWaitText} onChange={(e) => { setMaxWaitText(e.target.value); resetPending(); }} />
            </label>
          </fieldset>

          <div className="row">
            <button type="button" className="btn" onClick={cancelPending}>Cancel pending</button>
            <button type="button" className="btn btn-primary" onClick={flushNow}>Flush now</button>
            <button type="button" className="btn" onClick={resetAll}>Reset all</button>
          </div>
        </section>

        <section className="card stack" aria-labelledby="throttle-title">
          <h3 id="throttle-title">Throttle: click as fast as you can</h3>
          <button type="button" className="btn btn-primary searchlab-click" onClick={onClickFast}>Click as fast as you can</button>
          <div className="row searchlab-stats">
            <span className="badge">Events: {events}</span>
            <span className="badge">Handler runs: {runs}</span>
          </div>
          <fieldset className="searchlab-options">
            <legend>Throttle options</legend>
            <label className="field">
              <span>Throttle wait: {throttleWait} ms</span>
              <input type="range" min="100" max="1000" step="50" value={throttleWait} onChange={(e) => setThrottleWait(Number(e.target.value))} />
            </label>
            <label className="row"><input type="checkbox" checked={tLeading} onChange={(e) => setTLeading(e.target.checked)} /> Throttle leading</label>
            <label className="row"><input type="checkbox" checked={tTrailing} onChange={(e) => setTTrailing(e.target.checked)} /> Throttle trailing</label>
          </fieldset>
        </section>
      </div>

      <section className="card" aria-labelledby="timeline-title">
        <h3 id="timeline-title">Timeline (last {LOG_SIZE} events, newest first)</h3>
        <ol className="searchlab-log" role="log" aria-label="Event timeline">
          {log.map((e) => (
            <li key={e.id} className={`log-${e.type.replace(' ', '-')}`}>
              <span className="log-time">+{e.t} ms</span> <span className="log-type">{e.type}</span>
            </li>
          ))}
        </ol>
        {log.length === 0 && <p className="muted">Type or click to see events.</p>}
      </section>
    </section>
  );
}
