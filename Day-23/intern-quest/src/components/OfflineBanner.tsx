'use client';

import { useEffect, useState } from 'react';
import { useOnline } from '@/lib/use-online';

/**
 * OFFLINE BANNER, on every page (root layout).
 *   - offline: a banner says so, and that what you are writing is safe (forms keep their content; saving says
 *     "nothing was sent" instead of failing silently);
 *   - back online: "Back online" for a few seconds;
 *   - while offline, links inside the app are stopped with a message. Otherwise Next.js tries to load the page,
 *     fails, falls back to a full page load, and the tab ends on the browser's own offline page, with the app and any
 *     unsaved writing gone (inventory row C10, finding E-11).
 *
 * The live region is always in the page and only its TEXT changes, so screen readers announce it reliably
 * (a region that appears together with its message is often missed: a Day 22 lesson).
 */
const OFFLINE = 'You are offline. Keep writing if you like: saving and opening pages will work again when you reconnect.';

export default function OfflineBanner() {
  const online = useOnline();
  // a passing message: "Back online.", or why a link did not open. State is set only from browser events.
  const [flash, setFlash] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onOnline = () => {
      setFlash('Back online.');
      clearTimeout(timer);
      timer = setTimeout(() => setFlash(''), 4000);
    };
    const onOffline = () => {
      clearTimeout(timer);
      setFlash('');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (online) return;
    // capture phase on window: runs before Next's <Link> handler, so the navigation never starts
    const stopLinks = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopPropagation();
      setFlash('You are offline, so that page can not open yet. Reconnect, then try again.');
    };
    window.addEventListener('click', stopLinks, true);
    return () => window.removeEventListener('click', stopLinks, true);
  }, [online]);

  const text = online ? flash : flash || OFFLINE;
  return (
    <div className="offline-banner" role="status" data-show={text ? 'true' : 'false'} data-state={online ? 'online' : 'offline'}>
      {text}
    </div>
  );
}
