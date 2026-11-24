'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string };

/** The app's main navigation. A Client Component only because it needs the current path to mark the active link. */
export default function NavLinks({ links }: { links: Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Main">
      {links.map(({ href, label }) => {
        const current = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
        return <Link key={href} href={href} aria-current={current ? 'page' : undefined}>{label}</Link>;
      })}
    </nav>
  );
}
