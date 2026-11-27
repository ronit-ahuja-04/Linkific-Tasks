import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = '0px';
    readonly thresholds: readonly number[] = [0];
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    disconnect(): void {}

    observe(target: Element): void {
      const rect = target.getBoundingClientRect();
      this.callback(
        [
          {
            boundingClientRect: rect,
            intersectionRatio: 1,
            intersectionRect: rect,
            isIntersecting: true,
            rootBounds: rect,
            target,
            time: Date.now(),
          },
        ],
        this,
      );
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    unobserve(): void {}
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
}

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
