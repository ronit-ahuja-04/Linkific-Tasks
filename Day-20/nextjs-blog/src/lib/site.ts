/** Site-wide constants: one place for the name, the description and the public URL (used by metadata, the sitemap and robots) */
export const SITE = {
  name: 'Dispatch',
  description: 'Short, practical notes on Next.js: routing, server and client components, data fetching, caching and rendering.',
  /** set NEXT_PUBLIC_SITE_URL in production; the fallback is the local dev server */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;
