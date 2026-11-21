'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** The app's main navigation. A Client Component only because it needs the current path to mark the active link. */
export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="app-nav" aria-label="Main">
      {links.map((link) => {
        const current = pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}/`));
        return (
          <Link key={link.href} href={link.href} aria-current={current ? 'page' : undefined}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
