import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import type { UserRole } from '../types/lms';

export interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: readonly UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { userId, profile, status } = useAppSelector((state) => state.auth);

  if (status === 'loading') {
    return (
      <div className="rpg-card p-6 text-sm text-muted" role="status">
        Loading your hero profile...
      </div>
    );
  }

  if (!userId || !profile) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <section className="rpg-card mx-auto max-w-lg p-6 text-center">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-warn">
          Restricted Guild Zone
        </p>
        <h1 className="mt-2 text-2xl font-bold">Access Requires {allowedRoles.join(' / ')}</h1>
        <p className="mt-2 text-sm text-muted">
          You are signed in as <strong>@{profile.handle}</strong> ({profile.role}). Switch to an
          authorized account or return to the catalog.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link to="/courses" className="rpg-btn-primary rounded-xl px-4 py-2 text-sm font-bold">
            Explore Realms
          </Link>
          <Link
            to="/login"
            className="rounded-xl border-2 border-line px-4 py-2 text-sm font-bold hover:bg-surface-2"
          >
            Switch Account
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
