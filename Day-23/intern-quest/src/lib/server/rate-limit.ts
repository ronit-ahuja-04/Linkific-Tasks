import 'server-only';

/**
 * A small sliding-window rate limiter, kept in memory.
 *
 * Limit: on Vercel each function instance has its own memory, and instances come and go, so this is a brake against a
 * runaway browser tab (an error thrown in a loop), not a guarantee against someone determined. A shared store (e.g.
 * a Redis/KV counter) would be the next step if that ever mattered.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records a hit for `key`; returns how many seconds to wait, or 0 when the hit is allowed */
  hit(key: string): number {
    const now = this.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return Math.max(1, Math.ceil((recent[0] + this.windowMs - now) / 1000));
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 1000) this.prune(now);
    return 0;
  }

  private prune(now: number): void {
    for (const [key, times] of this.hits) if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key);
  }
}
