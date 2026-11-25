import { ChevronDown, Code2 } from 'lucide-react';

/**
 * The Day 17 "how this page works" notes, kept (they are what made Huddle a learning project) but collapsed,
 * in the same place and with the same look on every page, so the product leads and the explanation waits.
 * A native <details>: keyboard and screen-reader support (expanded / collapsed) come for free.
 */
export default function UnderTheHood({ title = 'Under the hood', children, className = '' }) {
  return (
    <details className={`uth ${className}`.trim()}>
      <summary>
        <Code2 size={16} aria-hidden="true" />
        <span>{title}</span>
        <ChevronDown className="uth-chevron" size={16} aria-hidden="true" />
      </summary>
      <div className="uth-body">{children}</div>
    </details>
  );
}
