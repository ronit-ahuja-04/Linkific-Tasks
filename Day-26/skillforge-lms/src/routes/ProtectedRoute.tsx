import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { Badge, Card, LoadingState, buttonClasses } from '../components/ui';
import type { UserRole } from '../types/lms';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: readonly UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { userId, profile, status } = useAppSelector((state) => state.auth);

  if (status === 'loading') {
    return <LoadingState label="Loading your hero profile..." />;
  }

  if (!userId || !profile) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <Card as="section" padding="md" className="mx-auto max-w-lg text-center">
        <Badge tone="warn" size="sm" className="font-mono uppercase tracking-wider">
          Restricted Guild Zone
        </Badge>
        <h1 className="mt-3 text-2xl font-bold">Access Requires {allowedRoles.join(' / ')}</h1>
        <p className="mt-2 text-sm text-muted">
          You are signed in as <strong>@{profile.handle}</strong> ({profile.role}). Switch to an
          authorized account or return to the catalog.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/courses" className={buttonClasses({ variant: 'primary', size: 'md' })}>
            Explore Realms
          </Link>
          <Link to="/login" className={buttonClasses({ variant: 'outline', size: 'md' })}>
            Switch Account
          </Link>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
