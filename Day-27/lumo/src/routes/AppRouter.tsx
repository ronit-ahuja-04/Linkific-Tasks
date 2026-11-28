import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { LearnerShell } from '../components/layout/LearnerShell';
import { StaffShell } from '../components/layout/StaffShell';
import { PageTransition, RouteLoading } from '../components/motion/Motion';
import { LoginPage, RegisterPage } from '../features/auth/AuthPages';
import { ErrorBoundary, NotFoundPage } from '../features/errors/ErrorScreens';
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
const TastePage = named(() => import('../features/taste/TastePage'), 'TastePage');
const VerifyPage = named(() => import('../features/certificate/VerifyPage'), 'VerifyPage');
const AdminPage = named(() => import('../features/admin/AdminPage'), 'AdminPage');
const ForgotPasswordPage = named(
  () => import('../features/auth/PasswordPages'),
  'ForgotPasswordPage',
);
const ResetPasswordPage = named(
  () => import('../features/auth/PasswordPages'),
  'ResetPasswordPage',
);

/** Full-screen pages fade in on arrival (pages inside a shell get this from the shell). */
const page = (element: ReactNode) => <PageTransition>{element}</PageTransition>;

export function AppRouter() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={page(<WelcomePage />)} />
          <Route path="/login" element={page(<LoginPage />)} />
          <Route path="/register" element={page(<RegisterPage />)} />
          <Route path="/forgot-password" element={page(<ForgotPasswordPage />)} />
          <Route path="/reset-password" element={page(<ResetPasswordPage />)} />
          {/* Public: no account needed. */}
          <Route path="/taste" element={page(<TastePage />)} />
          <Route path="/taste/:slug" element={page(<TastePage />)} />
          <Route path="/verify/:code" element={page(<VerifyPage />)} />
          {/* Full-screen learner flows (no tab bar). */}
          <Route path="/setup" element={<RequireRole>{page(<SetupPage />)}</RequireRole>} />
          <Route
            path="/learn/:lessonId"
            element={<RequireRole>{page(<LessonPlayer />)}</RequireRole>}
          />
          <Route path="/review" element={<RequireRole>{page(<ReviewPage />)}</RequireRole>} />
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
          <Route path="*" element={page(<NotFoundPage />)} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
