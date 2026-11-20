'use client';

import { useEffect, useState } from 'react';

type State = { status: 'loading' } | { status: 'ready'; now: string } | { status: 'error' };

/**
 * CLIENT-SIDE RENDERING (CSR): the server sends only this placeholder. The browser runs this code and asks
 * /api/time itself, so the text below does not exist in the page's HTML. Compare "view source" with the screen.
 */
export default function ClientClock() {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/time', { signal: controller.signal })
      .then((response) => response.json() as Promise<{ now: string }>)
      .then((body) => setState({ status: 'ready', now: body.now }))
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, []);
  return (
    <code className="stamp" data-testid="csr-stamp" aria-live="polite">
      {state.status === 'loading' ? 'Loading in the browser…' : state.status === 'error' ? 'Could not load' : state.now}
    </code>
  );
}
