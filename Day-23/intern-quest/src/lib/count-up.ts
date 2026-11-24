/**
 * Count a number up inside an element, easing out (fast, then settling). A few lines of requestAnimationFrame instead
 * of Motion's `animate()`, which would pull the whole animation engine into the first download.
 * Returns a function that stops the animation. Visitors who prefer reduced motion get the final number at once.
 */
export function countUp(element: HTMLElement, to: number, { from = 0, duration = 1100, format = (n: number) => Math.round(n).toLocaleString('en-US') } = {}): () => void {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = format(to);
    return () => {};
  }
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    element.textContent = format(from + (to - from) * eased);
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
