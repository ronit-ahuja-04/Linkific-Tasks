import { Link } from 'react-router-dom';
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
    <div className="space-y-12">
      <section
        aria-labelledby="home-hero-title"
        className="relative animate-rise overflow-hidden rounded-[2rem] bg-board px-6 py-12 text-on-board sm:px-12 sm:py-20"
      >
        {/* Decorative grid + glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 size-96 animate-float rounded-full bg-brand/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/3 size-80 rounded-full bg-accent/30 blur-3xl"
        />

        <div className="relative max-w-3xl">
          <Badge tone="brand" className="mb-6">
            <Radio size={12} aria-hidden="true" />
            Day 8 · Tailwind redesign
          </Badge>
          <h1
            id="home-hero-title"
            className="text-5xl leading-[0.95] font-bold tracking-tighter sm:text-7xl"
          >
            Run the whole hackathon from <span className="text-brand">one control room.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-on-board/70">
            Check-ins, teams, swag, a stopwatch for demo day. Every station has its own address, now
            wrapped in a faster, sharper interface.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/directory" className={buttonClass({ size: 'lg' })}>
              Open the directory
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              to="/sponsors"
              className={buttonClass({
                variant: 'ghost',
                size: 'lg',
                className:
                  'border border-white/20 text-on-board hover:bg-white/10 hover:text-on-board',
              })}
            >
              Become a sponsor
            </Link>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl font-bold tabular-nums sm:text-4xl">
                  {stat.value}
                </dd>
                <dt className="mt-1 text-xs text-on-board/60">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="stations-title">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 font-mono text-xs tracking-[0.18em] text-muted uppercase">
              Every station
            </p>
            <h2 id="stations-title" className="text-2xl font-bold sm:text-3xl">
              Pick a station
            </h2>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {DESTINATIONS.map((station, index) => {
            const Icon = station.icon;
            return (
              <li
                key={station.id}
                className="animate-rise"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <Link
                  to={station.path}
                  className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:border-ink"
                >
                  <div className="mb-5 flex items-start justify-between">
                    <span
                      className="grid size-11 place-items-center rounded-xl bg-surface-2 transition group-hover:bg-brand group-hover:text-on-brand"
                      aria-hidden="true"
                    >
                      <Icon size={20} />
                    </span>
                    <Badge>{station.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-bold">{station.name}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-muted">{station.description}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <code className="font-mono text-xs text-muted">{station.path}</code>
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
