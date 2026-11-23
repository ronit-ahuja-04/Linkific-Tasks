import { useState } from 'react';
import { Play } from 'lucide-react';
import { runExample, runRealtimeDemo } from '../../lib/lab/examples';
import ResultView from './ResultView';

/** One runnable example: the supabase-js code, the SQL it becomes, a Run button and the live result */
export default function LabExample({ example, ctx }) {
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
    } else {
      setOutcome(await runExample(example, ctx));
    }
    setRunning(false);
  };

  return (
    <article className="lab-example card" aria-labelledby={`lab-${example.id}-title`}>
      <header className="lab-example-head">
        <h3 id={`lab-${example.id}-title`}>{example.title}</h3>
        {example.mutates && <span className="badge">writes a scratch note, then cleans up</span>}
      </header>
      <p className="lab-explain">{example.explain}</p>
      <div className="lab-code-grid">
        <div>
          <h4>supabase-js</h4>
          <pre className="lab-code" tabIndex={0} aria-label={`Code for ${example.title}`}><code>{example.code}</code></pre>
        </div>
        <div>
          <h4>{isRealtime ? 'Behind the scenes' : 'The SQL it becomes'}</h4>
          <pre className="lab-code" tabIndex={0} aria-label={`SQL for ${example.title}`}><code>{example.sql}</code></pre>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-sm lab-run" onClick={run} disabled={running} aria-label={`Run ${example.title}`}>
        <Play size={14} aria-hidden="true" /> {running ? 'Running...' : 'Run'}
      </button>
      <div aria-live="polite">
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
