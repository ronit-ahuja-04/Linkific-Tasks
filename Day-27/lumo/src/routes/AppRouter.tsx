import { lazy, Suspense, type ComponentType } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Wisp } from '../components/characters';
import { LearnerShell } from '../components/layout/LearnerShell';
import { StaffShell } from '../components/layout/StaffShell';
import { buttonClasses } from '../components/ui';
import { Loading } from '../components/ui';
import { LoginPage, RegisterPage } from '../features/auth/AuthPages';
import { MapPage } from '../features/map/MapPage';
import { WelcomePage } from '../features/welcome/WelcomePage';
import { RequireRole } from './RequireRole';

// The first screens (welcome, sign-in, map) load at once; everything else is split into its own chunk.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const ExplorePage = named(() => import('../features/explore/ExplorePage'), 'ExplorePage');
const MePage = named(() => import('../features/me/MePage'), 'MePage');
const StudioPage = named(() => import('../features/studio/StudioPage'), 'StudioPage');
const NewCoursePage = named(() => import('../features/studio/NewCoursePage'), 'NewCoursePage');
const CourseEditorPage = named(
  () => import('../features/studio/CourseEditorPage'),
  'CourseEditorPage',
);
const LessonEditorPage = named(
  () => import('../features/studio/LessonEditorPage'),
  'LessonEditorPage',
);
const LessonPlayer = named(() => import('../features/learn/LessonPlayer'), 'LessonPlayer');
const ReviewPage = named(() => import('../features/review/ReviewPage'), 'ReviewPage');
const SetupPage = named(() => import('../features/onboarding/SetupPage'), 'SetupPage');
const AdminPage = named(() => import('../features/admin/AdminPage'), 'AdminPage');

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
    <Suspense fallback={<Loading label="Loading…" />}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Full-screen learner flows (no tab bar). */}
        <Route
          path="/setup"
          element={
            <RequireRole>
              <SetupPage />
            </RequireRole>
          }
        />
        <Route
          path="/learn/:lessonId"
          element={
            <RequireRole>
              <LessonPlayer />
            </RequireRole>
          }
        />
        <Route
          path="/review"
          element={
            <RequireRole>
              <ReviewPage />
            </RequireRole>
          }
        />
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
          <Route path="/studio/new" element={<NewCoursePage />} />
          <Route path="/studio/:courseId" element={<CourseEditorPage />} />
          <Route path="/studio/:courseId/lessons/:lessonId" element={<LessonEditorPage />} />
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
    </Suspense>
  );
}
