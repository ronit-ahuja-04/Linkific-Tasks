import { useState } from 'react';
import { Play } from 'lucide-react';
import { runExample, runRealtimeDemo } from '../../lib/lab/examples';
import ResultView from './ResultView';

/** One runnable example: the supabase-js code, the SQL it becomes, a Run button and the live result */
const SAID = { rows: 'returned rows', empty: 'returned no rows', skipped: 'was skipped', error: 'failed', bad: 'gave an unexpected result' };

/** One runnable example. `onDone(message)` tells the page what to announce (the page has the one live region). */
export default function LabExample({ example, ctx, onDone }) {
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [events, setEvents] = useState(null);
  const [rtError, setRtError] = useState('');
  const isRealtime = example.kind === 'realtime';

  const run = async () => {
    setRunning(true);
    if (isRealtime) {
      setEvents([]);
      setRtError('');
      const { events: seen, error } = await runRealtimeDemo(ctx, { onEvent: (entry) => setEvents((list) => [...list, entry]) });
      setEvents(seen);
      setRtError(error ? error.message : '');
      onDone?.(`${example.title}: ${error ? 'failed' : `${seen.length} events arrived`}. The result is below its Run button.`);
    } else {
      const result = await runExample(example, ctx);
      setOutcome(result);
      const said = result?.status === 'error' && result.ok ? 'was refused by the database, as expected' : SAID[result?.status] ?? 'finished';
      onDone?.(`${example.title} ${said}. The result is below its Run button.`);
    }
    setRunning(false);
  };

  return (
    <article className="lab-example card" aria-labelledby={`lab-${example.id}-title`}>
      <header className="lab-example-head">
        <h2 id={`lab-${example.id}-title`} className="lab-title">{example.title}</h2>
        {example.mutates && <span className="badge">writes a scratch note, then cleans up</span>}
      </header>
      <p className="lab-explain">{example.explain}</p>
      <div className="lab-code-grid">
        <div>
          <h3 className="lab-code-title">supabase-js</h3>
          <pre className="lab-code" tabIndex={0} aria-label={`Code for ${example.title}`}><code>{example.code}</code></pre>
        </div>
        <div>
          <h3 className="lab-code-title">{isRealtime ? 'Behind the scenes' : 'The SQL it becomes'}</h3>
          <pre className="lab-code" tabIndex={0} aria-label={`SQL for ${example.title}`}><code>{example.sql}</code></pre>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-sm lab-run" onClick={run} disabled={running} aria-label={`Run ${example.title}`}>
        <Play size={14} aria-hidden="true" /> {running ? 'Running...' : 'Run'}
      </button>
      <div>
        {isRealtime ? (
          events && (
            <div className="lab-result">
              <ol className="lab-events" aria-label="Realtime events received">
                {events.map((entry, index) => <li key={index}><strong>{entry.type}</strong> {entry.title ?? `(row ${entry.id})`}</li>)}
              </ol>
              {!running && !rtError && events.length > 0 && <p className="lab-result-status lab-result-rows">{events.length} events arrived over the websocket, and the scratch note was cleaned up.</p>}
              {rtError && <p className="lab-result-status lab-result-bad" role="alert">{rtError}</p>}
            </div>
          )
        ) : (
          <ResultView outcome={outcome} expect={example.expect} />
        )}
      </div>
      {example.rls && outcome && outcome.status !== 'skipped' && (
        <div className="alert alert-info lab-rls" role="note">
          <span><strong>What RLS did.</strong> {example.rls}</span>
        </div>
      )}
    </article>
  );
}
