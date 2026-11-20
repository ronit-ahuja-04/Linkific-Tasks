import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'What Dispatch is and how it is built.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="prose">
      <h1>About Dispatch</h1>
      <p>Dispatch is a small blog built to learn Next.js: the App Router, server and client components, caching and the four ways to render a page.</p>
      <h2>How it is built</h2>
      <ul>
        <li>Posts are Markdown files read on the server and cached with <code>use cache</code>.</li>
        <li>Every route, layout, loading state and error boundary is a file in <code>src/app</code>.</li>
        <li>Images go through <code>next/image</code> and fonts through <code>next/font</code>.</li>
        <li>Each page sets its own metadata for search and social previews.</li>
      </ul>
    </div>
  );
}
