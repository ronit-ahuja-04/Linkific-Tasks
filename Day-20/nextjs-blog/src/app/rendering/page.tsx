import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { connection } from 'next/server';
import { Suspense } from 'react';
import ClientClock from '@/components/ClientClock';

export const metadata: Metadata = {
  title: 'Rendering strategies, live',
  description: 'SSG, ISR, SSR and CSR side by side, each stamped with the moment it was produced.',
  alternates: { canonical: '/rendering' },
};

/**
 * Four panels, four strategies, each printing the time it was produced. Reload the page and watch which stamps move.
 *
 *   SSG  `use cache` with a very long life: made at build time and kept       -> never moves
 *   ISR  `use cache` with a 15 second `revalidate`: re-made in the background -> moves, at most every 15 s
 *   SSR  no cache, inside Suspense, after `connection()`: made per request    -> moves on every reload
 *   CSR  a Client Component that fetches /api/time after the page loads      -> moves on every reload
 */
async function StaticStamp() {
  'use cache';
  cacheLife('max'); // 30 day revalidate: effectively "built once"
  return <code className="stamp" data-testid="ssg-stamp">{new Date().toISOString()}</code>;
}

async function RegeneratedStamp() {
  'use cache';
  // stale >= 30s and expire >= 5 min keep this inside the build-time prerender; revalidate 15 is the ISR interval
  cacheLife({ stale: 60, revalidate: 15, expire: 3600 });
  return <code className="stamp" data-testid="isr-stamp">{new Date().toISOString()}</code>;
}

async function RequestStamp() {
  await connection(); // "wait for a real request": nothing after this line runs at build time
  await new Promise((resolve) => setTimeout(resolve, 800)); // pretend the data is slow, so the fallback is visible
  return <code className="stamp" data-testid="ssr-stamp">{new Date().toISOString()}</code>;
}

function Panel({ id, title, badge, children, note }: { id: string; title: string; badge: string; children: React.ReactNode; note: string }) {
  return (
    <section className="panel" aria-labelledby={`${id}-title`}>
      <span className="badge">{badge}</span>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
      <p>{note}</p>
    </section>
  );
}

export default function RenderingPage() {
  return (
    <>
      <h1>Rendering strategies, live</h1>
      <p>Each box shows the time its content was produced. Reload the page a few times and see which ones change.</p>
      <div className="panels">
        <Panel id="ssg" title="Static (SSG)" badge="built once" note="Produced at build time. Same value for every visitor until the next deploy.">
          <StaticStamp />
        </Panel>
        <Panel id="isr" title="Incremental (ISR)" badge="rebuilt in the background" note="Produced at build time, then rebuilt after 15 seconds when a visitor asks. The visitor who triggers it still sees the old value.">
          <RegeneratedStamp />
        </Panel>
        <Panel id="ssr" title="Server (SSR)" badge="every request" note="Produced on the server for each request. Streams in after the page shell, so a fallback shows first.">
          <Suspense fallback={<code className="stamp" data-testid="ssr-fallback">Rendering on the server…</code>}>
            <RequestStamp />
          </Suspense>
        </Panel>
        <Panel id="csr" title="Client (CSR)" badge="in the browser" note="The server sends an empty box; the browser fetches /api/time itself. Not in the HTML, so not seen by crawlers that skip JavaScript.">
          <ClientClock />
        </Panel>
      </div>

      <h2>Which to use</h2>
      <table className="info">
        <thead><tr><th scope="col">Strategy</th><th scope="col">Use it for</th><th scope="col">In this version</th><th scope="col">Before Cache Components</th></tr></thead>
        <tbody>
          <tr><th scope="row">SSG</th><td>Content that changes when you deploy: docs, marketing pages, these posts</td><td><code>use cache</code> + long <code>cacheLife</code>, <code>generateStaticParams</code></td><td>default for pages with no dynamic data</td></tr>
          <tr><th scope="row">ISR</th><td>Content that changes now and then: a product list, a news index</td><td><code>use cache</code> + <code>cacheLife({'{'} revalidate {'}'})</code>, <code>revalidateTag</code></td><td><code>export const revalidate = 15</code></td></tr>
          <tr><th scope="row">SSR</th><td>Personal or always-fresh data: a dashboard, a cart</td><td>uncached component in <code>Suspense</code>, after <code>connection()</code> or <code>cookies()</code></td><td><code>export const dynamic = &apos;force-dynamic&apos;</code></td></tr>
          <tr><th scope="row">CSR</th><td>Interactive widgets, data behind a log-in that crawlers do not need</td><td>Client Component with <code>useEffect</code> + <code>fetch</code></td><td>the same</td></tr>
        </tbody>
      </table>
      <p>Want to see an error boundary? <Link href="/broken">Open a page that throws</Link>.</p>
    </>
  );
}
