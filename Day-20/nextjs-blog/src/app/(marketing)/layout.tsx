import NavLink from '@/components/NavLink';

/**
 * ROUTE GROUP: the folder name `(marketing)` is not part of the URL. It exists only to give /about and /contact
 * their own layout (this sidebar) without nesting them under a path segment.
 */
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="marketing">
      <aside>
        <p>About this site</p>
        <nav aria-label="About pages">
          <NavLink href="/about">About</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
