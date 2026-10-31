import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CornerDownRight, Repeat, Undo2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';

/** Mini history-stack diagram: the last entry is where you end up. */
function Stack({ entries, note }) {
  return (
    <div className="navp-stack" aria-label={`History afterwards: ${entries.join(', ')}`}>
      {entries.map((entry, index) => (
        <span
          key={`${entry}-${index}`}
          className={`navp-entry ${index === entries.length - 1 ? 'current' : ''} ${
            entry.startsWith('~') ? 'gone' : ''
          }`}
        >
          {entry.replace('~', '')}
        </span>
      ))}
      {note && <span className="navp-stack-note">{note}</span>}
    </div>
  );
}

export default function NavPatterns() {
  const navigate = useNavigate();

  return (
    <div className="station-view navp-view">
      <PageHeader breadcrumb="PATTERNS / NAVIGATION" title="Navigation Patterns" pill="4 demos" />

      <p className="navp-intro">
        Every button below calls <code>useNavigate()</code> from a click handler. Try each one, then
        press your browser&apos;s Back button and compare it with the diagram.
      </p>

      <div className="navp-grid">
        <article className="navp-card" style={{ '--i': 0 }}>
          <header className="navp-card-head">
            <span className="navp-icon" aria-hidden="true">
              <ArrowRight size={18} />
            </span>
            <h2>Push</h2>
          </header>
          <pre className="navp-code">navigate(&apos;/swag&apos;)</pre>
          <p>Adds a new history entry. Back returns to this page.</p>
          <Stack entries={['…', 'navigation', '/swag']} note="Back → navigation" />
          <button type="button" className="btn btn-primary" onClick={() => navigate('/swag')}>
            Push to /swag
          </button>
        </article>

        <article className="navp-card" style={{ '--i': 1 }}>
          <header className="navp-card-head">
            <span className="navp-icon" aria-hidden="true">
              <Repeat size={18} />
            </span>
            <h2>Replace</h2>
          </header>
          <pre className="navp-code">navigate(&apos;/swag&apos;, {'{ replace: true }'})</pre>
          <p>Overwrites the current entry. Back skips this page entirely.</p>
          <Stack entries={['…', '~navigation', '/swag']} note="Back → before navigation" />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/swag', { replace: true })}
          >
            Replace with /swag
          </button>
        </article>

        <article className="navp-card" style={{ '--i': 2 }}>
          <header className="navp-card-head">
            <span className="navp-icon" aria-hidden="true">
              <Undo2 size={18} />
            </span>
            <h2>Back &amp; Forward</h2>
          </header>
          <pre className="navp-code">navigate(-1) · navigate(1)</pre>
          <p>Moves through existing entries without creating new ones, like the browser arrows.</p>
          <Stack entries={['…', 'previous', 'navigation', 'next?']} />
          <div className="navp-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back</span>
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(1)}>
              <span>Forward</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </article>

        <article className="navp-card" style={{ '--i': 3 }}>
          <header className="navp-card-head">
            <span className="navp-icon" aria-hidden="true">
              <CornerDownRight size={18} />
            </span>
            <h2>Declarative redirect</h2>
          </header>
          <pre className="navp-code">{'<Navigate to="/swag" replace />'}</pre>
          <p>
            The old <code>/shop</code> URL renders a <code>&lt;Navigate&gt;</code> during render, so
            it is never kept in history.
          </p>
          <Stack entries={['…', 'navigation', '~/shop', '/swag']} note="Back → navigation" />
          <Link to="/shop" className="btn btn-primary">
            Visit legacy /shop
          </Link>
        </article>
      </div>
    </div>
  );
}
