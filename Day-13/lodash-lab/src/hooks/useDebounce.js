import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

/**
 * DEBOUNCED VALUE: `debounced` follows `value`, but only after it has stopped changing for `wait`
 * ms. Typing "react" fires five changes; the expensive work downstream runs once.
 */
export function useDebouncedValue(value, wait = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const update = debounce(setDebounced, wait);
    update(value);
    return () => update.cancel(); // a newer value, or unmount, cancels the pending update
  }, [value, wait]);
  return debounced;
}

/**
 * Shared by the two callback hooks. Creating `debounce(fn)` in a component body would make a fresh
 * timer every render and lose the pending call, so the Lodash function is created once per option
 * set. It calls `latest.fn`, a holder that an effect keeps pointing at the newest callback, so it
 * never runs a stale closure. It is cancelled when the options change or the component unmounts.
 */
function useLodashCallback(make, callback, deps) {
  const [latest] = useState(() => ({ fn: callback }));
  useEffect(() => {
    latest.fn = callback;
  }, [latest, callback]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wrapped = useMemo(() => make((...args) => latest.fn?.(...args)), [latest, ...deps]);
  useEffect(() => () => wrapped.cancel(), [wrapped]);
  return wrapped;
}

/** DEBOUNCED CALLBACK: stable debounced function (with .cancel() and .flush()) that calls the latest `callback`. */
export function useDebouncedCallback(callback, wait = 300, options) {
  const { leading, trailing, maxWait } = options ?? {};
  return useLodashCallback((fn) => debounce(fn, wait, { leading, trailing, maxWait }), callback, [wait, leading, trailing, maxWait]);
}

/** THROTTLED CALLBACK: runs at most once per `wait` ms, always with the latest `callback`. */
export function useThrottledCallback(callback, wait = 200, options) {
  const { leading, trailing } = options ?? {};
  return useLodashCallback((fn) => throttle(fn, wait, { leading, trailing }), callback, [wait, leading, trailing]);
}
