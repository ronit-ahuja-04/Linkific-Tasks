'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { currentToasts, dismissToast, serverToasts, subscribeToasts, type Toast } from '@/lib/toast';

/**
 * Shows the toasts (src/lib/toast.ts), bottom right, newest last.
 *
 * Screen readers: the visible toasts are aria-hidden, and each message is also written into one of two live regions
 * that are ALWAYS in the page: polite for success and info, assertive for errors. A region that appears together with
 * its message is often not announced; a region that exists first and then changes text is (a Day 22 finding).
 */
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, currentToasts, serverToasts);
  const [announced, setAnnounced] = useState<{ polite: string; assertive: string }>({ polite: '', assertive: '' });

  // announce each new toast once, from the store's change (an external event), not from rendering
  useEffect(() => {
    let seen = new Set(currentToasts().map((t) => t.id));
    return subscribeToasts((list) => {
      const fresh = list.filter((t) => !seen.has(t.id));
      seen = new Set(list.map((t) => t.id));
      const last = fresh.at(-1);
      if (last) setAnnounced((a) => (last.tone === 'error' ? { ...a, assertive: last.text } : { ...a, polite: last.text }));
    });
  }, []);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" data-testid="toast-polite">{announced.polite}</div>
      <div className="sr-only" role="alert" aria-live="assertive" data-testid="toast-assertive">{announced.assertive}</div>
      <ol className="toasts" aria-hidden={toasts.length === 0 ? true : undefined}>
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </ol>
    </>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  return (
    <li className={`toast toast-${toast.tone}`}>
      {/* the text was announced through the live regions above; here it is for the eyes */}
      <span aria-hidden="true">{toast.text}</span>
      <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label={`Dismiss: ${toast.text}`}>✕</button>
    </li>
  );
}
