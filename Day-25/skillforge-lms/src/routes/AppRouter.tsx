import { Flame } from 'lucide-react';
import { Link, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Badge, Card, buttonClasses } from '../components/ui';
import { CharacterPage } from '../features/auth/CharacterPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CharacterSheetPage } from '../features/guild/CharacterSheetPage';
import { GuildPage } from '../features/guild/GuildPage';
import { HomePage } from '../features/home/HomePage';
import { RealmQuestPage } from '../features/quest/RealmQuestPage';
import { ComponentLibraryPage } from '../features/ui/ComponentLibraryPage';
import { NotFoundPage } from '../features/ui/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';

function PhasePlaceholder({
  title,
  phase,
  summary,
}: {
  title: string;
  phase: string;
  summary: string;
}) {
  return (
    <Card as="section" padding="lg" className="mx-auto max-w-2xl">
      <Badge tone="brand" size="sm" icon={<Flame className="h-3.5 w-3.5" />} className="font-mono">
        {phase}
      </Badge>
      <h1 className="mt-3 text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted">{summary}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/courses" className={buttonClasses({ variant: 'primary', size: 'md' })}>
          Browse Realms
        </Link>
        <Link to="/guild" className={buttonClasses({ variant: 'outline', size: 'md' })}>
          Visit Guild Hall
        </Link>
      </div>
    </Card>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CatalogPage />} />
        <Route path="/courses/:slug" element={<RealmQuestPage />} />
        <Route path="/guild" element={<GuildPage />} />
        <Route path="/c/:handle" element={<CharacterSheetPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/components" element={<ComponentLibraryPage />} />
        <Route
          path="/character"
          element={
            <ProtectedRoute>
              <CharacterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <PhasePlaceholder
                title="Instructor Guild Studio"
                phase="Phase 4 — Day 29"
                summary="Course Realm creation, module/lesson/quiz authoring, Storage uploads, and Recharts analytics land in Phase 4."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PhasePlaceholder
                title="Admin Grandmaster Deck"
                phase="Phase 4 — Day 29"
                summary="User role management, course moderation, and certificate audits land in Phase 4."
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
