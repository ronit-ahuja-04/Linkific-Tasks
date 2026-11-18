import { afterEach } from 'vitest';

// Testing Library's automatic cleanup only runs with globals; do it by hand for DOM tests
afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
