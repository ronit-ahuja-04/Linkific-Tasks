import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import ErrorListeners from '@/components/ErrorListeners';
import MotionProvider from '@/components/MotionProvider';
import OfflineBanner from '@/components/OfflineBanner';
import { SITE } from '@/lib/site';
import './globals.css';

/** Rounded, friendly type: Fredoka for headings and numbers, Nunito for text. Self-hosted by next/font. */
const display = Fredoka({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'], display: 'swap' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

/** Defaults for every page; a page's own metadata overrides these fields */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. job-application helpers) add attributes to <html> before
    // React loads. This ignores attribute differences on this one element only; children are still checked.
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <MotionProvider>{children}</MotionProvider>
        <ErrorListeners />
        <OfflineBanner />
        {/* Vercel Analytics (page views) and Speed Insights (Core Web Vitals from real visitors). They load scripts from
            /_vercel/*, which only exist on Vercel: anywhere else each page logged two console errors (116 in the
            Day 23 inventory), noise that hid real errors. So they are rendered only when built on Vercel. */}
        {process.env.VERCEL && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
