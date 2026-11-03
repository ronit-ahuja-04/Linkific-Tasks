import { Link } from 'react-router-dom';
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
    'flex flex-col items-start gap-3 rounded-2xl border p-5 [&_code]:rounded [&_code]:bg-surface [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs',
    tone === 'good' ? 'border-good/30 bg-good-soft' : 'border-bad/30 bg-bad-soft'
  );

export default function About() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader breadcrumb="ABOUT" title="About HackHQ" pill="Static route" />

      <Card as="section" className="p-6 sm:p-8">
        <h2 className="mb-3 text-xl font-bold tracking-tight">The event</h2>
        <p className="max-w-2xl text-muted">
          HackHQ is the day-of control room for a 24-hour hackathon: who has checked in, which teams
          are registered, what swag is left, and how long until demos.
        </p>
      </Card>

      <ol className="my-6 grid gap-4 sm:grid-cols-3">
        {TIMELINE.map((step) => (
          <li
            key={step.day}
            className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-5 shadow-card"
          >
            <span className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
              {step.day}
            </span>
            <strong className="font-display text-lg tracking-tight">{step.title}</strong>
            <span className="text-sm text-muted">{step.text}</span>
          </li>
        ))}
      </ol>

      {/* CONCEPT: Link vs anchor - same destination, very different cost */}
      <Card as="section" className="p-6 sm:p-8" aria-labelledby="link-vs-a">
        <h2 id="link-vs-a" className="mb-3 text-xl font-bold tracking-tight">
          {'<Link>'} vs {'<a>'}
        </h2>
        <p className="max-w-2xl text-muted">
          Both go to Mission control. Open DevTools → Network, toggle State X-ray on, then try each
          one.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className={compareCol('good')}>
            <Link to="/" className={buttonClass({ variant: 'primary' })}>
              {'<Link to="/">'}
            </Link>
            <p className="text-sm text-muted">
              Calls <code>history.pushState</code>. No document request; X-ray and toasts survive.
            </p>
          </div>
          <div className={compareCol('bad')}>
            {/* Deliberate full reload for the demo; every other internal link uses <Link> */}
            <a href="/" className={buttonClass({ variant: 'secondary' })}>
              {'<a href="/">'}
            </a>
            <p className="text-sm text-muted">
              Browser requests a new document. The whole app reboots; only localStorage (theme,
              laps) survives.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
