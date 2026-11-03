import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CornerDownRight, Repeat, Undo2 } from 'lucide-react';
import { Card as BsCard, Col, Row } from 'react-bootstrap';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Button, buttonClass, cx } from '../components/ui.jsx';

/** Mini history-stack diagram: the last entry is where you end up. */
function Stack({ entries, note }) {
  return (
    <div
      className="mb-4 d-flex flex-wrap align-items-center gap-1"
      aria-label={`History afterwards: ${entries.join(', ')}`}
    >
      {entries.map((entry, index) => (
        <span
          key={`${entry}-${index}`}
          className={cx(
            'rounded-2 border px-2 py-1 small font-monospace',
            index === entries.length - 1
              ? 'border-0 bg-brand'
              : 'bg-body-secondary text-body-secondary',
            entry.startsWith('~') && 'text-decoration-line-through opacity-50'
          )}
        >
          {entry.replace('~', '')}
        </span>
      ))}
      {note && (
        <span
          className="ms-1 font-monospace text-uppercase text-body-secondary"
          style={{ fontSize: '0.68rem' }}
        >
          {note}
        </span>
      )}
    </div>
  );
}

export default function NavPatterns() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader breadcrumb="PATTERNS / NAVIGATION" title="Navigation Patterns" pill="4 demos" />

      <p className="mb-4 text-body-secondary" style={{ maxWidth: '42rem' }}>
        Every button below calls <code>useNavigate()</code> from a click handler. Try each one, then
        press your browser&apos;s Back button and compare it with the diagram.
      </p>

      <Row className="row-cols-1 row-cols-md-2 g-3">
        <Col>
          <BsCard
            as="article"
            className="h-100 p-4 shadow-sm animate-rise align-items-start"
            style={{ animationDelay: '0ms' }}
          >
            <header className="mb-3 d-flex align-items-center gap-3">
              <span
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary-emphasis"
                style={{ width: '2.25rem', height: '2.25rem' }}
                aria-hidden="true"
              >
                <ArrowRight size={18} />
              </span>
              <h2 className="fs-5 fw-bold mb-0">Push</h2>
            </header>
            <pre
              className="mb-3 overflow-x-auto rounded-3 px-3 py-2 small font-monospace text-brand"
              style={{ background: 'var(--board)' }}
            >
              navigate(&apos;/swag&apos;)
            </pre>
            <p className="mb-3 small text-body-secondary">
              Adds a new history entry. Back returns to this page.
            </p>
            <Stack entries={['…', 'navigation', '/swag']} note="Back → navigation" />
            <Button onClick={() => navigate('/swag')}>Push to /swag</Button>
          </BsCard>
        </Col>

        <Col>
          <BsCard
            as="article"
            className="h-100 p-4 shadow-sm animate-rise align-items-start"
            style={{ animationDelay: '70ms' }}
          >
            <header className="mb-3 d-flex align-items-center gap-3">
              <span
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary-emphasis"
                style={{ width: '2.25rem', height: '2.25rem' }}
                aria-hidden="true"
              >
                <Repeat size={18} />
              </span>
              <h2 className="fs-5 fw-bold mb-0">Replace</h2>
            </header>
            <pre
              className="mb-3 overflow-x-auto rounded-3 px-3 py-2 small font-monospace text-brand"
              style={{ background: 'var(--board)' }}
            >
              navigate(&apos;/swag&apos;, {'{ replace: true }'})
            </pre>
            <p className="mb-3 small text-body-secondary">
              Overwrites the current entry. Back skips this page entirely.
            </p>
            <Stack entries={['…', '~navigation', '/swag']} note="Back → before navigation" />
            <Button onClick={() => navigate('/swag', { replace: true })}>Replace with /swag</Button>
          </BsCard>
        </Col>

        <Col>
          <BsCard
            as="article"
            className="h-100 p-4 shadow-sm animate-rise align-items-start"
            style={{ animationDelay: '140ms' }}
          >
            <header className="mb-3 d-flex align-items-center gap-3">
              <span
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary-emphasis"
                style={{ width: '2.25rem', height: '2.25rem' }}
                aria-hidden="true"
              >
                <Undo2 size={18} />
              </span>
              <h2 className="fs-5 fw-bold mb-0">Back &amp; Forward</h2>
            </header>
            <pre
              className="mb-3 overflow-x-auto rounded-3 px-3 py-2 small font-monospace text-brand"
              style={{ background: 'var(--board)' }}
            >
              navigate(-1) · navigate(1)
            </pre>
            <p className="mb-3 small text-body-secondary">
              Moves through existing entries without creating new ones, like the browser arrows.
            </p>
            <Stack entries={['…', 'previous', 'navigation', 'next?']} />
            <div className="d-flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Back</span>
              </Button>
              <Button variant="secondary" onClick={() => navigate(1)}>
                <span>Forward</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </BsCard>
        </Col>

        <Col>
          <BsCard
            as="article"
            className="h-100 p-4 shadow-sm animate-rise align-items-start"
            style={{ animationDelay: '210ms' }}
          >
            <header className="mb-3 d-flex align-items-center gap-3">
              <span
                className="d-flex align-items-center justify-content-center rounded-3 bg-primary-subtle text-primary-emphasis"
                style={{ width: '2.25rem', height: '2.25rem' }}
                aria-hidden="true"
              >
                <CornerDownRight size={18} />
              </span>
              <h2 className="fs-5 fw-bold mb-0">Declarative redirect</h2>
            </header>
            <pre
              className="mb-3 overflow-x-auto rounded-3 px-3 py-2 small font-monospace text-brand"
              style={{ background: 'var(--board)' }}
            >
              {'<Navigate to="/swag" replace />'}
            </pre>
            <p className="mb-3 small text-body-secondary">
              The old <code>/shop</code> URL renders a <code>&lt;Navigate&gt;</code> during render,
              so it is never kept in history.
            </p>
            <Stack entries={['…', 'navigation', '~/shop', '/swag']} note="Back → navigation" />
            <Link to="/shop" className={buttonClass({ variant: 'primary' })}>
              Visit legacy /shop
            </Link>
          </BsCard>
        </Col>
      </Row>
    </div>
  );
}
