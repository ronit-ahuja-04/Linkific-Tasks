import { vi } from 'vitest';

/** Counts how many times a component renders: used to prove what does and does not re-render */
export function makeCounter() {
  const counter = { renders: 0 };
  counter.tick = () => {
    counter.renders += 1;
  };
  return counter;
}

export const firebaseState = vi.hoisted(() => ({ configured: true }));
