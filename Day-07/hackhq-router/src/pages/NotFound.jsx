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
    <div className="station-view notfound-view">
      <section className="notfound-screen" aria-labelledby="notfound-title">
        <div className="notfound-static" aria-hidden="true" />
        <div className="notfound-scanline" aria-hidden="true" />

        <div className="notfound-content">
          <RadioTower size={36} className="notfound-icon" aria-hidden="true" />
          <p className="notfound-code" aria-hidden="true" data-text="404">
            404
          </p>
          <h1 id="notfound-title" className="notfound-title">
            Signal lost
          </h1>
          <p className="notfound-copy">
            No station is broadcasting on <code>/{missingPath}</code>.
          </p>

          <nav aria-label="Suggested stations" className="notfound-links">
            {SUGGESTIONS.map((item) => (
              <Link key={item.path} to={item.path} className="notfound-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </div>
  );
}
