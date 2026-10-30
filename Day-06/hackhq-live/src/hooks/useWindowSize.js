import { useState, useEffect } from 'react';

/**
 * Custom hook tracking browser viewport dimensions.
 * Breakpoint calculations (mobile, tablet, desktop) are derived during render.
 *
 * @returns {{ width: number, height: number }}
 */
export function useWindowSize() {
  // CONCEPT: useWindowSize - global window resize subscription with removeEventListener cleanup
  const [size, setSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    // Stable function reference ensures exact listener removal in cleanup
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

