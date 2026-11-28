import { Link, Route, Routes } from 'react-router-dom';
import { Wisp } from '../components/characters';
import { LearnerShell } from '../components/layout/LearnerShell';
import { StaffShell } from '../components/layout/StaffShell';
import { buttonClasses } from '../components/ui';
import { AdminPage } from '../features/admin/AdminPage';
import { LoginPage, RegisterPage } from '../features/auth/AuthPages';
import { ExplorePage } from '../features/explore/ExplorePage';
import { MapPage } from '../features/map/MapPage';
import { MePage } from '../features/me/MePage';
import { StudioPage } from '../features/studio/StudioPage';
import { WelcomePage } from '../features/welcome/WelcomePage';
import { RequireRole } from './RequireRole';

function NotFoundPage() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Wisp size={120} mood="think" />
      <h1 className="m-0 text-3xl font-bold">This island isn't on the map</h1>
      <p className="m-0 text-dusk">The page you were looking for doesn't exist.</p>
      <Link to="/" className={buttonClasses({ variant: 'glow' })}>
        Back to the isles
      </Link>
    </main>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <RequireRole>
            <LearnerShell />
          </RequireRole>
        }
      >
        <Route path="/map" element={<MapPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/me" element={<MePage />} />
      </Route>
      <Route
        element={
          <RequireRole roles={['instructor', 'admin']}>
            <StaffShell />
          </RequireRole>
        }
      >
        <Route path="/studio" element={<StudioPage />} />
      </Route>
      <Route
        element={
          <RequireRole roles={['admin']}>
            <StaffShell />
          </RequireRole>
        }
      >
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
