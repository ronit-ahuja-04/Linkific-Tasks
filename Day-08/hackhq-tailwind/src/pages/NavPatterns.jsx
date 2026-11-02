import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CornerDownRight, Repeat, Undo2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Button, buttonClass, cx } from '../components/ui.jsx';

/** Mini history-stack diagram: the last entry is where you end up. */
function Stack({ entries, note }) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-1.5"
      aria-label={`History afterwards: ${entries.join(', ')}`}
    >
      {entries.map((entry, index) => (
        <span
          key={`${entry}-${index}`}
          className={cx(
            'rounded-md border px-2 py-1 font-mono text-xs',
            index === entries.length - 1
              ? 'border-brand bg-brand text-on-brand'
              : 'border-line bg-surface-2 text-muted',
            entry.startsWith('~') && 'border-dashed line-through opacity-60'
          )}
        >
          {entry.replace('~', '')}
        </span>
      ))}
      {note && (
        <span className="ml-1 font-mono text-[0.68rem] uppercase tracking-wider text-muted">
          {note}
        </span>
      )}
    </div>
  );
}

const cardClass =
  'flex animate-rise flex-col items-start rounded-card border border-line bg-surface p-6 shadow-card';

export default function NavPatterns() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader breadcrumb="PATTERNS / NAVIGATION" title="Navigation Patterns" pill="4 demos" />

      <p className="mb-8 max-w-2xl text-muted [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_code]:text-ink">
        Every button below calls <code>useNavigate()</code> from a click handler. Try each one, then
        press your browser&apos;s Back button and compare it with the diagram.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <article className={cardClass} style={{ animationDelay: '0ms' }}>
          <header className="mb-4 flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <ArrowRight size={18} />
            </span>
            <h2 className="font-display text-lg font-bold tracking-tight">Push</h2>
          </header>
          <pre className="mb-3 overflow-x-auto rounded-xl bg-board px-4 py-3 font-mono text-xs text-brand">
            navigate(&apos;/swag&apos;)
          </pre>
          <p className="mb-4 text-sm text-muted [&_code]:font-mono [&_code]:text-xs [&_code]:text-ink">
            Adds a new history entry. Back returns to this page.
          </p>
          <Stack entries={['…', 'navigation', '/swag']} note="Back → navigation" />
          <Button onClick={() => navigate('/swag')}>Push to /swag</Button>
        </article>

        <article className={cardClass} style={{ animationDelay: '70ms' }}>
          <header className="mb-4 flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <Repeat size={18} />
            </span>
            <h2 className="font-display text-lg font-bold tracking-tight">Replace</h2>
          </header>
          <pre className="mb-3 overflow-x-auto rounded-xl bg-board px-4 py-3 font-mono text-xs text-brand">
            navigate(&apos;/swag&apos;, {'{ replace: true }'})
          </pre>
          <p className="mb-4 text-sm text-muted [&_code]:font-mono [&_code]:text-xs [&_code]:text-ink">
            Overwrites the current entry. Back skips this page entirely.
          </p>
          <Stack entries={['…', '~navigation', '/swag']} note="Back → before navigation" />
          <Button onClick={() => navigate('/swag', { replace: true })}>Replace with /swag</Button>
        </article>

        <article className={cardClass} style={{ animationDelay: '140ms' }}>
          <header className="mb-4 flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <Undo2 size={18} />
            </span>
            <h2 className="font-display text-lg font-bold tracking-tight">Back &amp; Forward</h2>
          </header>
          <pre className="mb-3 overflow-x-auto rounded-xl bg-board px-4 py-3 font-mono text-xs text-brand">
            navigate(-1) · navigate(1)
          </pre>
          <p className="mb-4 text-sm text-muted [&_code]:font-mono [&_code]:text-xs [&_code]:text-ink">
            Moves through existing entries without creating new ones, like the browser arrows.
          </p>
          <Stack entries={['…', 'previous', 'navigation', 'next?']} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back</span>
            </Button>
            <Button variant="secondary" onClick={() => navigate(1)}>
              <span>Forward</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </article>

        <article className={cardClass} style={{ animationDelay: '210ms' }}>
          <header className="mb-4 flex items-center gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent"
              aria-hidden="true"
            >
              <CornerDownRight size={18} />
            </span>
            <h2 className="font-display text-lg font-bold tracking-tight">Declarative redirect</h2>
          </header>
          <pre className="mb-3 overflow-x-auto rounded-xl bg-board px-4 py-3 font-mono text-xs text-brand">
            {'<Navigate to="/swag" replace />'}
          </pre>
          <p className="mb-4 text-sm text-muted [&_code]:font-mono [&_code]:text-xs [&_code]:text-ink">
            The old <code>/shop</code> URL renders a <code>&lt;Navigate&gt;</code> during render, so
            it is never kept in history.
          </p>
          <Stack entries={['…', 'navigation', '~/shop', '/swag']} note="Back → navigation" />
          <Link to="/shop" className={buttonClass({ variant: 'primary' })}>
            Visit legacy /shop
          </Link>
        </article>
      </div>
    </div>
  );
}
