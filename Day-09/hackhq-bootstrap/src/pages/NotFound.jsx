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
    <div className="mx-auto" style={{ maxWidth: '48rem' }}>
      <section
        className="position-relative overflow-hidden rounded-4 px-4 py-5 text-center shadow panel-board"

        aria-labelledby="notfound-title"
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            opacity: 0.07,
            backgroundImage:
              'repeating-linear-gradient(0deg, currentColor 0 1px, transparent 1px 4px)',
          }}
          aria-hidden="true"
        />
        <div
          className="position-absolute top-0 start-0 w-100 animate-scan"
          style={{
            height: '6rem',
            background:
              'linear-gradient(to bottom, transparent, rgba(190, 242, 100, 0.1), transparent)',
          }}
          aria-hidden="true"
        />

        <div className="position-relative d-flex flex-column align-items-center py-sm-4">
          <RadioTower size={36} className="mb-3 animate-float text-brand" aria-hidden="true" />
          <p
            className="mb-0 fw-bold text-brand"
            style={{ fontSize: 'clamp(5rem, 22vw, 8rem)', lineHeight: 1, letterSpacing: '-0.05em' }}
            aria-hidden="true"
            data-text="404"
          >
            404
          </p>
          <h1 id="notfound-title" className="mt-3 display-6 fw-bold">
            Signal lost
          </h1>
          <p className="mt-2 mb-0 opacity-75 text-break" style={{ maxWidth: '28rem' }}>
            No station is broadcasting on <code className="text-brand">/{missingPath}</code>.
          </p>

          <nav
            aria-label="Suggested stations"
            className="mt-4 d-flex flex-wrap justify-content-center gap-2"
          >
            {SUGGESTIONS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="btn btn-sm btn-outline-light rounded-pill px-3 font-monospace text-uppercase"
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
