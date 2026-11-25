import { matchPath } from 'react-router-dom';
import { lazyWithPreload } from './lib/lazyPage';

/**
 * ROUTE-BASED CODE SPLITTING (Day 24). Every page is its own chunk; the first download holds only the app shell
 * (React, the router, supabase-js, the sidebar and the sign-in check). Before Day 24 every visit downloaded all pages:
 * one 638 KB file.
 *
 * Each page can be preloaded (src/lib/lazyPage.js). `preloadPath(path)` finds the page for an address: main.jsx calls
 * it with the current address at start-up, in parallel with the session check, and the navigation links call it on
 * hover and focus, so a click rarely waits.
 */
export const pages = {
  LoginPage: lazyWithPreload(() => import('./pages/auth/LoginPage')),
  RegisterPage: lazyWithPreload(() => import('./pages/auth/RegisterPage')),
  ForgotPasswordPage: lazyWithPreload(() => import('./pages/auth/ForgotPasswordPage')),
  ResetPasswordPage: lazyWithPreload(() => import('./pages/auth/ResetPasswordPage')),
  AuthCallbackPage: lazyWithPreload(() => import('./pages/auth/AuthCallbackPage')),
  DashboardPage: lazyWithPreload(() => import('./pages/DashboardPage')),
  ChatPage: lazyWithPreload(() => import('./pages/ChatPage')),
  NotesPage: lazyWithPreload(() => import('./pages/NotesPage')),
  FilesPage: lazyWithPreload(() => import('./pages/FilesPage')),
  LabPage: lazyWithPreload(() => import('./pages/LabPage')),
  ProfilePage: lazyWithPreload(() => import('./pages/ProfilePage')),
  StyleguidePage: lazyWithPreload(() => import('./pages/StyleguidePage')),
};

const BY_PATH = [
  ['/', pages.DashboardPage],
  ['/chat/:roomId?', pages.ChatPage],
  ['/notes', pages.NotesPage],
  ['/files', pages.FilesPage],
  ['/lab', pages.LabPage],
  ['/profile', pages.ProfilePage],
  ['/login', pages.LoginPage],
  ['/register', pages.RegisterPage],
  ['/forgot-password', pages.ForgotPasswordPage],
  ['/auth/callback', pages.AuthCallbackPage],
  ['/auth/reset', pages.ResetPasswordPage],
  ['/styleguide', pages.StyleguidePage],
];

/** The lazy page for an address, or null */
export function pageFor(path) {
  return BY_PATH.find(([pattern]) => matchPath({ path: pattern, end: true }, path))?.[1] ?? null;
}

/** Start downloading the page for an address (no-op for unknown addresses); returns the import promise */
export function preloadPath(path) {
  const page = pageFor(path);
  return page ? page.preload().catch(() => undefined) : Promise.resolve();
}
