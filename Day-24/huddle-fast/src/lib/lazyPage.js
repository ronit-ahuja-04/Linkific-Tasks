import { lazy } from 'react';

/**
 * React.lazy with a preload() (Day 24, code splitting).
 *
 * React.lazy(() => import('./pages/NotesPage')) puts the page in its own chunk, downloaded the first time it renders.
 * That alone makes navigation WAIT for the download. preload() starts the same download earlier, on a signal that
 * the user is about to go there (a hover or focus on its link, or the current address at start-up), so by the time
 * React renders the page the chunk is usually already in memory. The import runs once; a failed download (offline,
 * or a new deploy replaced the old chunk) is forgotten, so the next attempt tries again instead of failing forever.
 */
export function lazyWithPreload(load) {
  let pending = null;
  let loaded = false;
  const preload = () => {
    pending ??= load().then(
      (module) => {
        loaded = true;
        return module;
      },
      (error) => {
        pending = null;
        throw error;
      },
    );
    return pending;
  };
  const Page = lazy(preload);
  Page.preload = preload;
  /** true once the chunk is in memory: navigating there will not wait */
  Page.isLoaded = () => loaded;
  return Page;
}
