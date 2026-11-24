import { describe, expect, it } from 'vitest';
import { guardAction } from '@/lib/action-guard';
import { describeError, digestOf, isChunkError } from '@/lib/error-view';

const serverError = () => Object.assign(new Error('An error occurred in the Server Components render.'), { digest: '426751613' });
const chunkError = () => Object.assign(new Error('Failed to load chunk /_next/static/chunks/2ldzh.js from module 58048'), { name: 'ChunkLoadError' });

describe('describeError: what a boundary shows', () => {
  it('a server error: our fault, logged, the digest as the reference, retry; not reported again', () => {
    expect(describeError(serverError(), true)).toEqual({
      reason: 'server', action: 'retry', report: false, reference: '426751613',
      title: 'This page could not load',
      text: 'The problem is on our side, and it has been logged. Try again in a moment.',
    });
  });

  it('a chunk that failed to load: a new version is live, so the action is RELOAD (retrying the old chunk can not work)', () => {
    const view = describeError(chunkError(), true);
    expect(view).toMatchObject({ reason: 'updated', action: 'reload', report: true, title: 'Intern Quest was updated' });
    expect(describeError(new TypeError('Failed to fetch dynamically imported module: /x.js'), true).reason).toBe('updated');
  });

  it('a new version wins over being offline: reloading is still the only fix', () => {
    expect(describeError(chunkError(), false).reason).toBe('updated');
  });

  it('offline: say so, retry later, do not report', () => {
    expect(describeError(serverError(), false, 'The guild board')).toMatchObject({ reason: 'offline', action: 'retry', report: false, title: 'You are offline', text: 'The guild board needs a connection. Reconnect, then try again.' });
  });

  it('a client error (no digest): reported, retry', () => {
    expect(describeError(new TypeError("Cannot read properties of undefined (reading 'xp')"), true, 'The guild board'))
      .toMatchObject({ reason: 'client', action: 'retry', report: true, title: 'The guild board broke' });
    expect(describeError('a thrown string', true).reason).toBe('client');
  });

  it('isChunkError and digestOf only look at what they should', () => {
    expect(isChunkError(new Error('Loading chunk 42 failed.'))).toBe(true);
    expect(isChunkError(new Error('Loading quests failed'))).toBe(false);
    expect(isChunkError('ChunkLoadError')).toBe(false);
    expect(digestOf({ digest: '' })).toBeUndefined();
    expect(digestOf(null)).toBeUndefined();
  });
});

describe('guardAction: a server action that can not reach the server keeps its form', () => {
  type State = { error?: string; ok?: boolean };
  const onUnreachable = (error: { message: string }): State => ({ error: error.message });
  const form = new FormData();

  it('passes results through', async () => {
    await expect(guardAction(async (): Promise<State> => ({ ok: true }), onUnreachable)({}, form)).resolves.toEqual({ ok: true });
  });

  it('fetch failing (network or offline) becomes form state', async () => {
    const guarded = guardAction(async (): Promise<State> => { throw new TypeError('Failed to fetch'); }, onUnreachable);
    const state = await guarded({}, form);
    expect(state.error).toMatch(/offline|reach Intern Quest/);
  });

  it('anything else is re-thrown for the error boundary (and Next\'s redirects pass through)', async () => {
    const redirect = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/;307;' });
    await expect(guardAction(async (): Promise<State> => { throw redirect; }, onUnreachable)({}, form)).rejects.toBe(redirect);
    await expect(guardAction(async (): Promise<State> => { throw new RangeError('bug'); }, onUnreachable)({}, form)).rejects.toThrow('bug');
  });
});
