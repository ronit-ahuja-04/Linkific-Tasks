import { Compass, Home, Trophy } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Pip } from '../../components/pip/Pip';
import { Badge, Card, buttonClasses } from '../../components/ui';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <Card as="section" padding="lg" className="mx-auto max-w-2xl text-center">
      <div className="flex justify-center">
        <Badge tone="warn">404 · Uncharted Territory</Badge>
      </div>

      <div className="mt-4 flex justify-center">
        <Pip stage="sprout" mood="worried" tint={1} accessory={4} className="h-auto w-40" />
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Realm Not Found</h1>
      <p className="mt-2 text-sm text-muted">
        Pip searched the entire Guild map, but{' '}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink">
          {location.pathname}
        </code>{' '}
        does not exist in SkillForge.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses({ variant: 'primary', size: 'md' })}>
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>Return Home</span>
        </Link>
        <Link to="/courses" className={buttonClasses({ variant: 'gold', size: 'md' })}>
          <Compass className="h-4 w-4" aria-hidden="true" />
          <span>Browse Realms</span>
        </Link>
        <Link to="/guild" className={buttonClasses({ variant: 'outline', size: 'md' })}>
          <Trophy className="h-4 w-4" aria-hidden="true" />
          <span>Visit Guild Hall</span>
        </Link>
      </div>
    </Card>
  );
}
