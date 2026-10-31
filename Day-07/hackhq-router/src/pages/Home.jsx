import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { STATIONS } from '../data/stations.js';

const DESTINATIONS = STATIONS.filter((station) => station.path !== '/');

// CONCEPT: Index route - what the layout shows at its own URL ("/")
export default function Home() {
  return (
    <div className="station-view home-view">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-glow" aria-hidden="true" />
        <span className="home-hero-eyebrow">Day 7 · React Router</span>
        <h1 id="home-hero-title" className="home-hero-title">
          Every station now has <span className="home-hero-accent">an address.</span>
        </h1>
        <p className="home-hero-copy">
          Refresh, bookmark, share a link, hit Back. The control room finally behaves like the web.
        </p>
        <dl className="home-hero-stats">
          <div>
            <dt>Routes</dt>
            <dd className="tabular-nums">{STATIONS.length}</dd>
          </div>
          <div>
            <dt>Router</dt>
            <dd>Browser</dd>
          </div>
          <div>
            <dt>Reloads</dt>
            <dd className="tabular-nums">0</dd>
          </div>
        </dl>
      </section>

      <ul className="home-grid">
        {DESTINATIONS.map((station, index) => {
          const Icon = station.icon;
          return (
            <li key={station.id} style={{ '--i': index }}>
              <Link to={station.path} className="home-card">
                <span className="home-card-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="home-card-badge">{station.badge}</span>
                <span className="home-card-name">{station.name}</span>
                <span className="home-card-desc">{station.description}</span>
                <span className="home-card-path">
                  <code>{station.path}</code>
                  <ArrowRight size={16} aria-hidden="true" className="home-card-arrow" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
