'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Pip from '@/components/Pip';
import { describeError } from '@/lib/error-view';
import { reportClientError } from '@/lib/report-client';
import { useOnline } from '@/lib/use-online';

/**
 * The one error UI every boundary uses, in three sizes:
 *   screen   the whole screen (app/error.tsx: public pages, sign-in), branded like the not-found page
 *   page     inside the app shell (app/(game)/error.tsx): the navigation above it keeps working
 *   section  one part of a page (SectionBoundary): the rest of the page stays
 *
 * It says what happened and what to do (src/lib/error-view.ts), offers ONE main action (Try again, or Reload after a
 * new deploy), a way out, and a reference to quote. Client-side errors are reported to our log; server errors were
 * already logged with the same digest. A page or screen error moves focus to its heading, so keyboard and screen
 * reader users land on the explanation, and asks search engines not to index the error.
 */
export interface ErrorPanelProps {
  error: unknown;
  retry: () => void;
  variant: 'screen' | 'page' | 'section';
  /** "This page", "The guild board", …: used in the title */
  what?: string;
  exit?: { href: string; label: string };
}

export default function ErrorPanel({ error, retry, variant, what, exit }: ErrorPanelProps) {
  const online = useOnline();
  const view = describeError(error, online, what);
  const heading = useRef<HTMLHeadingElement>(null);
  const isWhole = variant !== 'section';

  useEffect(() => {
    if (view.report) reportClientError(error, 'boundary');
  }, [error, view.report]);
  useEffect(() => {
    if (isWhole) heading.current?.focus();
  }, [isWhole]);

  const act = () => (view.action === 'reload' ? window.location.reload() : retry());
  const button = (
    <button type="button" className="big-button" onClick={act}>
      {view.action === 'reload' ? 'Reload' : 'Try again'}
    </button>
  );
  const reference = view.reference ? <p className="error-ref">Reference: <code>{view.reference}</code></p> : null;

  if (variant === 'section') {
    return (
      <div className="card error-section">
        <p className="error-title">{view.title}</p>
        <p>{view.text}</p>
        <div className="error-actions">{button}</div>
        {reference}
      </div>
    );
  }

  const body = (
    <>
      <meta name="robots" content="noindex" />
      <h1 ref={heading} tabIndex={-1} className="error-heading">{view.title}</h1>
      <p className="error-text">{view.text}</p>
      <div className="error-actions">
        {button}
        {exit && <Link href={exit.href} className="ghost-button">{exit.label}</Link>}
      </div>
      {reference}
    </>
  );

  if (variant === 'screen') {
    return (
      <main className="auth-screen not-found error-screen">
        <section className="auth-hero">
          <p className="wordmark">Intern Quest</p>
          {body}
        </section>
        <div className="nf-pip" aria-hidden="true"><Pip stage="sprout" mood="worried" hop={0} /></div>
      </main>
    );
  }
  return (
    <section className="card error-page">
      <div className="error-pip" aria-hidden="true"><Pip stage="sprout" mood="worried" hop={0} /></div>
      <div>{body}</div>
    </section>
  );
}
