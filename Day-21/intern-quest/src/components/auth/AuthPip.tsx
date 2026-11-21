'use client';

import { useState } from 'react';
import Pip from '@/components/Pip';

/** Pip as an egg on the sign-in screens: click it and it hops */
export default function AuthPip() {
  const [hop, setHop] = useState(0);
  return (
    <button type="button" className="auth-pip" onClick={() => setHop((n) => n + 1)} aria-label="Pip, waiting to hatch. Click to make it hop.">
      <Pip stage="egg" mood="happy" hop={hop} />
    </button>
  );
}
