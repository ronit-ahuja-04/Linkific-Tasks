import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const LINKS = [
  { to: '/directory', label: 'Directory' },
  { to: '/swag', label: 'Swag shop' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/contact', label: 'Contact' },
  { to: '/about', label: 'About' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="grid size-8 place-items-center rounded-lg bg-brand text-on-brand"
            aria-hidden="true"
          >
            <Zap size={16} strokeWidth={2.5} />
          </span>
          <p className="text-sm text-muted">
            <span className="font-display font-bold text-ink">HackHQ</span> · built with React
            Router and Tailwind CSS
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
