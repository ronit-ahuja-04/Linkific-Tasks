import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import NavLink from '@/components/NavLink';
import { SITE } from '@/lib/site';
import './globals.css';

/**
 * next/font downloads each font at BUILD time and serves it from this site (no request to Google when a visitor
 * arrives, and no layout shift). Each font becomes a CSS variable, used in globals.css.
 */
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const heading = Fraunces({ subsets: ['latin'], variable: '--font-heading', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

/** Default metadata for every page. A page's own `metadata` or `generateMetadata` overrides these fields. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: notes on Next.js`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['Next.js', 'React', 'App Router', 'Server Components', 'caching'],
  authors: [{ name: 'Ronit Ahuja' }],
  openGraph: { type: 'website', siteName: SITE.name, title: SITE.name, description: SITE.description, locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/rendering', label: 'Rendering' },
  { href: '/about', label: 'About' },
] as const;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand">{SITE.name}</Link>
            <nav className="site-nav" aria-label="Main">
              {NAV.map((item) => <NavLink key={item.href} href={item.href}>{item.label}</NavLink>)}
            </nav>
          </div>
        </header>
        <main id="main" className="container" tabIndex={-1}>{children}</main>
        <footer className="site-footer">
          <div className="container">Dispatch is a Next.js learning project. Content is original; covers are generated.</div>
        </footer>
      </body>
    </html>
  );
}
