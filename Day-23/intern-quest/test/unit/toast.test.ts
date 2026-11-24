import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentToasts, dismissToast, subscribeToasts, toast } from '@/lib/toast';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis); // the store only schedules dismissals in a browser
  });
  afterEach(() => {
    for (const t of currentToasts()) dismissToast(t.id);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('adds toasts, newest last, and tells subscribers', () => {
    const seen: number[] = [];
    const stop = subscribeToasts((list) => seen.push(list.length));
    toast('One');
    toast('Two', 'success');
    expect(currentToasts().map((t) => t.text)).toEqual(['One', 'Two']);
    expect(seen).toEqual([1, 2]);
    stop();
  });

  it('success and info leave after 6 s; errors stay until dismissed (time to read them)', () => {
    toast('Saved', 'success');
    const error = toast('Not sent', 'error');
    vi.advanceTimersByTime(6000);
    expect(currentToasts().map((t) => t.text)).toEqual(['Not sent']);
    vi.advanceTimersByTime(60_000);
    expect(currentToasts()).toHaveLength(1);
    dismissToast(error);
    expect(currentToasts()).toHaveLength(0);
  });

  it('the same text again replaces the old toast instead of stacking', () => {
    toast('Your note was not sent.', 'error');
    toast('Your note was not sent.', 'error');
    expect(currentToasts()).toHaveLength(1);
  });

  it('shows at most 4 at once, dropping the oldest', () => {
    for (const n of [1, 2, 3, 4, 5]) toast(`Toast ${n}`, 'error');
    expect(currentToasts().map((t) => t.text)).toEqual(['Toast 2', 'Toast 3', 'Toast 4', 'Toast 5']);
  });
});
