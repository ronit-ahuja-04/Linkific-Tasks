import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Card as BsCard, Col, ListGroup, Row, Table } from 'react-bootstrap';
import { Badge, buttonClass } from '../components/ui.jsx';

const TIERS = [
  {
    id: 'community',
    name: 'Community',
    price: 500,
    blurb: 'Show up, support builders, get your logo on the wall.',
    perks: {
      logo: true,
      booth: false,
      mentors: 0,
      challenge: false,
      recruiting: false,
    },
  },
  {
    id: 'builder',
    name: 'Builder',
    price: 2500,
    blurb: 'A booth, two mentors and a challenge track of your own.',
    featured: true,
    perks: {
      logo: true,
      booth: true,
      mentors: 2,
      challenge: true,
      recruiting: false,
    },
  },
  {
    id: 'title',
    name: 'Title',
    price: 7500,
    blurb: 'Your name on the event, the stage and every shirt.',
    perks: {
      logo: true,
      booth: true,
      mentors: 5,
      challenge: true,
      recruiting: true,
    },
  },
];

const FEATURES = [
  { key: 'logo', label: 'Logo on banners and site' },
  { key: 'booth', label: 'Sponsor booth' },
  { key: 'mentors', label: 'Mentors on the floor' },
  { key: 'challenge', label: 'Dedicated challenge track' },
  { key: 'recruiting', label: 'Recruiting session + résumé book' },
];

const money = (value) => `$${value.toLocaleString('en-US')}`;

function Perk({ value }) {
  if (typeof value === 'number') {
    return value > 0 ? (
      <span className="fw-semibold">{value}</span>
    ) : (
      <Minus size={16} aria-label="Not included" className="text-body-tertiary" />
    );
  }
  return value ? (
    <Check size={18} aria-label="Included" className="text-success" strokeWidth={3} />
  ) : (
    <Minus size={16} aria-label="Not included" className="text-body-tertiary" />
  );
}

export default function Sponsors() {
  return (
    <div>
      <PageHeader breadcrumb="Sponsors" title="Sponsor the build" pill="Applications open">
        Three tiers, no hidden fees. Every dollar funds food, prizes and venue for the people
        building.
      </PageHeader>

      {/* Tier cards */}
      <Row as="ul" className="list-unstyled row-cols-1 row-cols-md-3 g-4 mb-0 pt-2">
        {TIERS.map((tier, index) => (
          <Col
            as="li"
            key={tier.id}
            className="animate-rise"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <BsCard
              as="article"
              className={`h-100 p-4 shadow-sm position-relative${tier.featured ? ' text-bg-dark border-0' : ''}`}
              style={
                tier.featured ? { background: 'var(--board)', color: 'var(--on-board)' } : undefined
              }
            >
              {tier.featured && (
                <Badge
                  tone="brand"
                  className="position-absolute start-0 ms-4"
                  style={{ top: '-0.75rem' }}
                >
                  Most popular
                </Badge>
              )}
              <h2 className="fs-4 fw-bold">{tier.name}</h2>
              <p className={`mb-0 small ${tier.featured ? 'opacity-75' : 'text-body-secondary'}`}>
                {tier.blurb}
              </p>
              <p className="mt-4 mb-0 d-flex align-items-baseline gap-1">
                <span className="display-5 fw-bold">{money(tier.price)}</span>
                <span className={tier.featured ? 'opacity-75' : 'text-body-secondary'}>
                  / event
                </span>
              </p>

              <ListGroup variant="flush" className="mt-4 flex-grow-1 small">
                {FEATURES.filter((f) => tier.perks[f.key]).map((feature) => (
                  <ListGroup.Item
                    key={feature.key}
                    className="d-flex align-items-center gap-2 bg-transparent text-reset px-0"
                  >
                    <Check
                      size={16}
                      className="flex-shrink-0 text-success"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    <span>
                      {typeof tier.perks[feature.key] === 'number' && `${tier.perks[feature.key]} `}
                      {feature.label}
                    </span>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <Link
                to="/contact"
                className={buttonClass({
                  variant: tier.featured ? 'primary' : 'dark',
                  className: 'mt-4 w-100',
                })}
              >
                Choose {tier.name}
              </Link>
            </BsCard>
          </Col>
        ))}
      </Row>

      {/* Comparison table */}
      <section className="mt-5 pt-3" aria-labelledby="compare-title">
        <h2 id="compare-title" className="fs-3 fw-bold mb-3">
          Compare every perk
        </h2>
        {/* CONCEPT: Table responsive - wraps the table in a horizontal scroller on small screens */}
        <Table responsive hover className="align-middle mb-0 border rounded-3 shadow-sm bg-body">
          <caption className="visually-hidden">Sponsorship tiers and what each includes</caption>
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3 fw-medium text-body-secondary">
                Perk
              </th>
              {TIERS.map((tier) => (
                <th key={tier.id} scope="col" className="px-4 py-3 text-center fw-bold">
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature) => (
              <tr key={feature.key}>
                <th scope="row" className="px-4 py-3 fw-medium">
                  {feature.label}
                </th>
                {TIERS.map((tier) => (
                  <td key={tier.id} className="px-4 py-3">
                    <span className="d-flex justify-content-center">
                      <Perk value={tier.perks[feature.key]} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
