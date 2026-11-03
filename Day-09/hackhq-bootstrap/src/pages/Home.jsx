import { Link } from 'react-router-dom';
import { Card as BsCard, Col, Row } from 'react-bootstrap';
import { ArrowRight, ArrowUpRight, Radio } from 'lucide-react';
import { STATIONS } from '../data/stations.js';
import { Badge, buttonClass } from '../components/ui.jsx';

const DESTINATIONS = STATIONS.filter((station) => station.path !== '/');

const STATS = [
  { label: 'Stations', value: STATIONS.length },
  { label: 'Hours on the clock', value: 24 },
  { label: 'Page reloads', value: 0 },
];

// CONCEPT: Index route - what the layout shows at its own URL ("/")
export default function Home() {
  return (
    <div className="d-flex flex-column gap-5">
      <section
        aria-labelledby="home-hero-title"
        className="position-relative animate-rise overflow-hidden rounded-5 px-4 px-sm-5 py-5 panel-board"
      >
        {/* Decorative grid + glow */}
        <div
          aria-hidden="true"
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            opacity: 0.07,
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden="true"
          className="position-absolute animate-float rounded-circle"
          style={{
            top: '-6rem',
            right: '-6rem',
            width: '24rem',
            height: '24rem',
            background: 'var(--brand)',
            opacity: 0.25,
            filter: 'blur(64px)',
          }}
        />
        <div
          aria-hidden="true"
          className="position-absolute rounded-circle"
          style={{
            bottom: '-8rem',
            left: '33%',
            width: '20rem',
            height: '20rem',
            background: 'var(--accent)',
            opacity: 0.3,
            filter: 'blur(64px)',
          }}
        />

        <div className="position-relative py-sm-4" style={{ maxWidth: '48rem' }}>
          <Badge tone="brand" className="mb-4">
            <Radio size={12} aria-hidden="true" />
            Day 9 · Bootstrap redesign
          </Badge>
          <h1
            id="home-hero-title"
            className="display-3 fw-bold mb-0"
            style={{ lineHeight: 0.98, letterSpacing: '-0.04em' }}
          >
            Run the whole hackathon from <span className="text-brand">one control room.</span>
          </h1>
          <p className="mt-4 mb-0 fs-5 opacity-75" style={{ maxWidth: '36rem' }}>
            Check-ins, teams, swag, a stopwatch for demo day. Every station has its own address, now
            wrapped in a faster, sharper interface.
          </p>
          <div className="mt-4 d-flex flex-wrap gap-3">
            <Link to="/directory" className={buttonClass({ size: 'lg' })}>
              Open the directory
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              to="/sponsors"
              className={buttonClass({
                variant: 'ghost',
                size: 'lg',
                className: 'border border-light border-opacity-25 text-white',
              })}
            >
              Become a sponsor
            </Link>
          </div>

          {/* CONCEPT: row-cols-3 - three equal stat columns at every width */}
          <dl
            className="row row-cols-3 g-4 mt-4 mb-0 pt-4 border-top border-light border-opacity-10"
            style={{ maxWidth: '32rem' }}
          >
            {STATS.map((stat) => (
              <Col key={stat.label}>
                <dd className="fw-bold mb-0 fs-2 font-monospace">{stat.value}</dd>
                <dt className="mt-1 fw-normal small opacity-75">{stat.label}</dt>
              </Col>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="stations-title">
        <div className="mb-4 d-flex align-items-end justify-content-between gap-3">
          <div>
            <p className="mb-1 small font-monospace text-uppercase ls-wider text-body-secondary">
              Every station
            </p>
            <h2 id="stations-title" className="fs-2 fw-bold mb-0">
              Pick a station
            </h2>
          </div>
        </div>

        <Row as="ul" className="list-unstyled row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-0">
          {DESTINATIONS.map((station, index) => {
            const Icon = station.icon;
            return (
              <Col
                as="li"
                key={station.id}
                className="animate-rise"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <BsCard
                  as={Link}
                  to={station.path}
                  className="h-100 p-4 shadow-sm text-body text-decoration-none"
                >
                  <div className="mb-4 d-flex align-items-start justify-content-between">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-3 bg-body-secondary"
                      style={{ width: '2.75rem', height: '2.75rem' }}
                      aria-hidden="true"
                    >
                      <Icon size={20} />
                    </span>
                    <Badge>{station.badge}</Badge>
                  </div>
                  <h3 className="fs-5 fw-bold">{station.name}</h3>
                  <p className="mb-0 flex-grow-1 small text-body-secondary">
                    {station.description}
                  </p>
                  <div className="mt-4 d-flex align-items-center justify-content-between border-top pt-3">
                    <code className="small text-body-secondary">{station.path}</code>
                    <ArrowUpRight size={16} aria-hidden="true" className="text-body-secondary" />
                  </div>
                </BsCard>
              </Col>
            );
          })}
        </Row>
      </section>
    </div>
  );
}
