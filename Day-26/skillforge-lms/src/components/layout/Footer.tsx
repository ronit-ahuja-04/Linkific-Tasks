import { GraduationCap, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui';

export function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-line bg-surface/90">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-on-brand">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>SkillForge LMS</span>
            </Link>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
              Gamified Learning Management System with interactive Quest Maps, Boss Battles,
              evolving Pip companions, and Postgres Row Level Security.
            </p>
            <div className="mt-3">
              <Badge tone="brand" size="sm" icon={<Layers className="h-3 w-3" />}>
                Days 25–30 Capstone
              </Badge>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted">
              Explore Realms
            </h2>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li>
                <Link to="/courses" className="text-ink hover:text-brand">
                  Course Realms Catalog
                </Link>
              </li>
              <li>
                <Link to="/guild" className="text-ink hover:text-brand">
                  The Guild Hall
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-ink hover:text-brand">
                  Student Command Center
                </Link>
              </li>
              <li>
                <Link to="/components" className="text-ink hover:text-brand">
                  UI Component Library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted">
              Adventurer Account
            </h2>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li>
                <Link to="/login" className="text-ink hover:text-brand">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-ink hover:text-brand">
                  Forge Adventurer
                </Link>
              </li>
              <li>
                <Link to="/character" className="text-ink hover:text-brand">
                  Character &amp; Pip Studio
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
          <p>
            React 19 · TypeScript · Redux Toolkit · React Router v7 · Tailwind CSS v4 · Supabase
          </p>
          <p className="font-mono">© 2026 SkillForge LMS · Linkific Month 1</p>
        </div>
      </div>
    </footer>
  );
}
