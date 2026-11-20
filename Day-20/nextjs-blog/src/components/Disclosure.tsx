'use client';

import { useState, type ReactNode } from 'react';

/**
 * COMPOSITION: a Client Component cannot import a Server Component, but it can receive one as `children`.
 * The author box below is rendered on the server and passed in; this component only decides whether to show it.
 */
export default function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="disclosure">
      <button type="button" className="btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? '− ' : '+ '}{summary}
      </button>
      {open && <div className="disclosure-body">{children}</div>}
    </div>
  );
}
