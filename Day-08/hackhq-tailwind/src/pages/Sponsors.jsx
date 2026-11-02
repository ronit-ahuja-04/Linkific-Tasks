import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Badge, buttonClass, cx } from '../components/ui.jsx';

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
      <span className="font-semibold tabular-nums">{value}</span>
    ) : (
      <Minus size={16} aria-label="Not included" className="text-muted/60" />
    );
  }
  return value ? (
    <Check size={18} aria-label="Included" className="text-good" strokeWidth={3} />
  ) : (
    <Minus size={16} aria-label="Not included" className="text-muted/60" />
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
      <ul className="grid gap-5 md:grid-cols-3">
        {TIERS.map((tier, index) => (
          <li key={tier.id} className="animate-rise" style={{ animationDelay: `${index * 70}ms` }}>
            <article
              className={cx(
                'relative flex h-full flex-col rounded-card border p-6 shadow-card',
                tier.featured
                  ? 'border-transparent bg-board text-on-board md:-translate-y-3'
                  : 'border-line bg-surface'
              )}
            >
              {tier.featured && (
                <Badge tone="brand" className="absolute -top-3 left-6">
                  Most popular
                </Badge>
              )}
              <h2 className="text-xl font-bold">{tier.name}</h2>
              <p className={cx('mt-1 text-sm', tier.featured ? 'text-on-board/70' : 'text-muted')}>
                {tier.blurb}
              </p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold tracking-tight tabular-nums">
                  {money(tier.price)}
                </span>
                <span className={tier.featured ? 'text-on-board/60' : 'text-muted'}>/ event</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {FEATURES.filter((f) => tier.perks[f.key]).map((feature) => (
                  <li key={feature.key} className="flex items-center gap-2.5">
                    <Check
                      size={16}
                      className="shrink-0 text-good"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    <span>
                      {typeof tier.perks[feature.key] === 'number' && `${tier.perks[feature.key]} `}
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className={buttonClass({
                  variant: tier.featured ? 'primary' : 'dark',
                  className: 'mt-8 w-full',
                })}
              >
                Choose {tier.name}
              </Link>
            </article>
          </li>
        ))}
      </ul>

      {/* Comparison table */}
      <section className="mt-14" aria-labelledby="compare-title">
        <h2 id="compare-title" className="mb-4 text-xl font-bold sm:text-2xl">
          Compare every perk
        </h2>
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Sponsorship tiers and what each includes</caption>
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                <th scope="col" className="px-5 py-3.5 font-medium text-muted">
                  Perk
                </th>
                {TIERS.map((tier) => (
                  <th key={tier.id} scope="col" className="px-5 py-3.5 text-center font-bold">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FEATURES.map((feature) => (
                <tr key={feature.key} className="hover:bg-surface-2/40">
                  <th scope="row" className="px-5 py-3.5 font-medium">
                    {feature.label}
                  </th>
                  {TIERS.map((tier) => (
                    <td key={tier.id} className="px-5 py-3.5">
                      <span className="flex justify-center">
                        <Perk value={tier.perks[feature.key]} />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
