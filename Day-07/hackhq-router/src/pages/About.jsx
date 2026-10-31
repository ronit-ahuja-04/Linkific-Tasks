import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';

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

export default function About() {
  return (
    <div className="station-view about-view">
      <PageHeader breadcrumb="ABOUT" title="About HackHQ" pill="Static route" />

      <section className="about-card">
        <h2 className="about-heading">The event</h2>
        <p>
          HackHQ is the day-of control room for a 24-hour hackathon: who has checked in, which teams
          are registered, what swag is left, and how long until demos.
        </p>
      </section>

      <ol className="about-timeline">
        {TIMELINE.map((step) => (
          <li key={step.day} className="about-step">
            <span className="about-step-day">{step.day}</span>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>

      {/* CONCEPT: Link vs anchor - same destination, very different cost */}
      <section className="about-card" aria-labelledby="link-vs-a">
        <h2 id="link-vs-a" className="about-heading">
          {'<Link>'} vs {'<a>'}
        </h2>
        <p>
          Both go to Mission control. Open DevTools → Network, toggle State X-ray on, then try each
          one.
        </p>
        <div className="about-compare">
          <div className="about-compare-col good">
            <Link to="/" className="btn btn-primary">
              {'<Link to="/">'}
            </Link>
            <p>
              Calls <code>history.pushState</code>. No document request; X-ray and toasts survive.
            </p>
          </div>
          <div className="about-compare-col bad">
            {/* Deliberate full reload for the demo; every other internal link uses <Link> */}
            <a href="/" className="btn btn-secondary">
              {'<a href="/">'}
            </a>
            <p>
              Browser requests a new document. The whole app reboots; only localStorage (theme,
              laps) survives.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
