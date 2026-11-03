import { Link, useParams } from 'react-router-dom';
import { RadioTower } from 'lucide-react';

const SUGGESTIONS = [
  { path: '/', label: 'Mission control' },
  { path: '/directory', label: 'Directory' },
  { path: '/swag', label: 'Swag shop' },
  { path: '/clock', label: 'Hack Clock' },
];

// CONCEPT: Catch-all route - path="*" matches anything no other route claimed
export default function NotFound() {
  // The splat param holds the unmatched part of the URL
  const { '*': missingPath } = useParams();

  return (
    <div className="mx-auto max-w-3xl">
      <section
        className="relative overflow-hidden rounded-card bg-board px-6 py-14 text-center text-on-board shadow-pop sm:py-20"
        aria-labelledby="notfound-title"
      >
        <div
          className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,currentColor_0_1px,transparent_1px_4px)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-brand/10 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center">
          <RadioTower size={36} className="mb-4 animate-float text-brand" aria-hidden="true" />
          <p
            className="font-display text-8xl font-bold leading-none tracking-tighter text-brand sm:text-9xl"
            aria-hidden="true"
            data-text="404"
          >
            404
          </p>
          <h1 id="notfound-title" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Signal lost
          </h1>
          <p className="mt-3 max-w-md break-all text-on-board/70 [&_code]:font-mono [&_code]:text-brand">
            No station is broadcasting on <code>/{missingPath}</code>.
          </p>

          <nav aria-label="Suggested stations" className="mt-8 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-full border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-wider transition hover:border-brand hover:bg-brand hover:text-on-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
