'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** The coloured frame of the signed-in pages. The guild hall is sky blue, everything else violet. */
export default function ShellFrame({ children }: { children: ReactNode }) {
  const tone = usePathname().startsWith('/guild') ? 'sky' : 'violet';
  return <div className={`shell tone-${tone}`}>{children}</div>;
}
