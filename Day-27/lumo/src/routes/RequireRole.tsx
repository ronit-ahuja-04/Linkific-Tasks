import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { BootScreen } from '../components/motion/Motion';
import type { Role } from '../lib/types';

/**
 * Route guard. The real protection is Row Level Security in the database; this only keeps people out of screens
 * that would be empty or refused for them, and sends them somewhere useful instead.
 */
export function RequireRole({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { status, profile } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (status === 'checking') return <BootScreen label="Finding your lantern…" />;
  if (status === 'signedOut' || !profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(profile.role)) return <Navigate to="/map" replace />;
  return <>{children}</>;
}
