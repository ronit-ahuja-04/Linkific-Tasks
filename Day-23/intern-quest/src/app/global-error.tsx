'use client';

import { useEffect } from 'react';
import { describeError } from '@/lib/error-view';
import { reportClientError } from '@/lib/report-client';

/**
 * The last line of defence: an error in the ROOT LAYOUT itself, where app/error.tsx can not help (it lives inside
 * that layout). It replaces the whole document, so it brings its own <html> and <body>, and its own small styles:
 * the app's CSS and fonts may be exactly what failed. Kept deliberately plain.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const view = describeError(error, typeof navigator === 'undefined' ? true : navigator.onLine, 'Intern Quest');
  useEffect(() => {
    if (view.report) reportClientError(error, 'boundary');
  }, [error, view.report]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#6C4DF5', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <title>Intern Quest hit a problem</title>
        <meta name="robots" content="noindex" />
        <main style={{ maxWidth: 520 }}>
          <p style={{ fontWeight: 800, margin: '0 0 16px' }}>Intern Quest</p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.1, margin: 0 }}>{view.title}</h1>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.5 }}>{view.text}</p>
          <p style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => (view.action === 'reload' ? window.location.reload() : retry())}
              style={{ font: 'inherit', fontWeight: 800, padding: '12px 18px', borderRadius: 14, border: 0, background: '#2A1E3B', color: '#fff', cursor: 'pointer' }}>
              {view.action === 'reload' ? 'Reload' : 'Try again'}
            </button>
            {/* a full page load on purpose: the app's client code may be what is broken */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: '#fff', fontWeight: 800, padding: '12px 4px' }}>Home</a>
          </p>
          {view.reference && <p style={{ opacity: 0.85 }}>Reference: <code>{view.reference}</code></p>}
        </main>
      </body>
    </html>
  );
}
