'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether the browser thinks it is online, kept up to date by the `online` / `offline` events.
 * `navigator.onLine === false` is reliable (there is no network at all); `true` only means "some network", which may
 * still not reach us. So `false` is treated as certain, and `true` as "worth trying".
 * During server rendering it is assumed online (the server can not know).
 */
const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
