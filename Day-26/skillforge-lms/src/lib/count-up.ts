export interface CountUpOptions {
  from?: number;
  duration?: number;
  format?: (value: number) => string;
}

/**
 * Counts a number up smoothly inside an element using requestAnimationFrame.
 * Respects prefers-reduced-motion by snapping directly to the target value.
 */
export function countUp(
  element: HTMLElement,
  to: number,
  {
    from = 0,
    duration = 950,
    format = (n: number) => Math.round(n).toLocaleString('en-US'),
  }: CountUpOptions = {},
): () => void {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    element.textContent = format(to);
    return () => {};
  }

  const start = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    element.textContent = format(from + (to - from) * eased);
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    }
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
