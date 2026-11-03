import { Link } from 'react-router-dom';
import { Col, ListGroup, Row } from 'react-bootstrap';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Card, buttonClass, cx } from '../components/ui.jsx';

const TIMELINE = [
  {
    day: 'Day 5',
    title: 'State & events',
    text: 'Five stations built with useState and handlers.',
  },
  {
    day: 'Day 6',
    title: 'Effects & hooks',
    text: 'Live API, timers, persistence, five custom hooks.',
  },
  { day: 'Day 7', title: 'Routing', text: 'Real URLs, nested layouts, params and guards.' },
];

const compareCol = (tone) =>
  cx(
    'h-100 d-flex flex-column align-items-start gap-3 rounded-4 border p-4',
    tone === 'good'
      ? 'bg-success-subtle border-success-subtle'
      : 'bg-danger-subtle border-danger-subtle'
  );

export default function About() {
  return (
    <div className="mx-auto" style={{ maxWidth: '56rem' }}>
      <PageHeader breadcrumb="ABOUT" title="About HackHQ" pill="Static route" />

      <Card as="section" className="p-4 p-sm-5">
        <h2 className="fs-4 fw-bold mb-3">The event</h2>
        <p className="mb-0 text-body-secondary" style={{ maxWidth: '42rem' }}>
          HackHQ is the day-of control room for a 24-hour hackathon: who has checked in, which teams
          are registered, what swag is left, and how long until demos.
        </p>
      </Card>

      {/* CONCEPT: ListGroup as="ol" numbered - a list-group is just styled list markup */}
      <Row as="ol" className="list-unstyled row-cols-1 row-cols-sm-3 g-3 my-3 p-0">
        {TIMELINE.map((step) => (
          <Col as="li" key={step.day}>
            <ListGroup.Item
              as="div"
              className="h-100 d-flex flex-column gap-1 rounded-3 border p-4 shadow-sm"
            >
              <span className="small font-monospace fw-medium text-uppercase ls-wider text-primary">
                {step.day}
              </span>
              <strong className="fs-5">{step.title}</strong>
              <span className="small text-body-secondary">{step.text}</span>
            </ListGroup.Item>
          </Col>
        ))}
      </Row>

      {/* CONCEPT: Link vs anchor - same destination, very different cost */}
      <Card as="section" className="p-4 p-sm-5" aria-labelledby="link-vs-a">
        <h2 id="link-vs-a" className="fs-4 fw-bold mb-3">
          {'<Link>'} vs {'<a>'}
        </h2>
        <p className="mb-0 text-body-secondary" style={{ maxWidth: '42rem' }}>
          Both go to Mission control. Open DevTools → Network, toggle State X-ray on, then try each
          one.
        </p>
        <Row className="g-3 mt-2">
          <Col md={6}>
            <div className={compareCol('good')}>
              <Link to="/" className={buttonClass({ variant: 'primary' })}>
                {'<Link to="/">'}
              </Link>
              <p className="mb-0 small text-body-secondary">
                Calls <code>history.pushState</code>. No document request; X-ray and toasts survive.
              </p>
            </div>
          </Col>
          <Col md={6}>
            <div className={compareCol('bad')}>
              {/* Deliberate full reload for the demo; every other internal link uses <Link> */}
              <a href="/" className={buttonClass({ variant: 'secondary' })}>
                {'<a href="/">'}
              </a>
              <p className="mb-0 small text-body-secondary">
                Browser requests a new document. The whole app reboots; only localStorage (theme,
                laps) survives.
              </p>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
