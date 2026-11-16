// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

vi.mock('firebase/firestore', async () => (await import('./mocks/firestore.js')).firestoreMock);
vi.mock('../src/lib/firebase', () => ({ db: {}, isFirebaseConfigured: true }));

import { firestoreMock as fs, resetFirestoreMock } from './mocks/firestore.js';
import { useLatestMessages } from '../src/lib/useLatestMessages.js';

let emit;
let unsub;
beforeEach(() => {
  resetFirestoreMock();
  unsub = vi.fn();
  fs.onSnapshot.mockImplementation((_q, next) => { emit = next; return unsub; });
});
const snap = (...ids) => ({ docs: ids.map((id) => ({ id, data: () => ({ text: id, createdAt: null }) })) });

describe('useLatestMessages', () => {
  it('asks for the newest messages only: ordered newest first and limited', () => {
    renderHook(() => useLatestMessages('p1', 5));
    expect(fs.collection).toHaveBeenCalledWith({}, 'projects', 'p1', 'messages');
    expect(fs.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(fs.limit).toHaveBeenCalledWith(5);
  });

  it('is not ready until the first snapshot, then follows every new one', () => {
    const { result } = renderHook(() => useLatestMessages('p1'));
    expect(result.current).toEqual({ messages: [], ready: false });
    act(() => emit(snap('b', 'a')));
    expect(result.current.ready).toBe(true);
    expect(result.current.messages.map((m) => m.id)).toEqual(['b', 'a']);
    act(() => emit(snap('c', 'b', 'a')));
    expect(result.current.messages.map((m) => m.id)).toEqual(['c', 'b', 'a']);
  });

  it('stops listening when the tab closes, and shows nothing of the old project while the new one loads', () => {
    const { result, rerender, unmount } = renderHook(({ id }) => useLatestMessages(id), { initialProps: { id: 'p1' } });
    act(() => emit(snap('a')));
    rerender({ id: 'p2' });
    expect(unsub).toHaveBeenCalledOnce();
    expect(result.current).toEqual({ messages: [], ready: false });
    unmount();
    expect(unsub).toHaveBeenCalledTimes(2);
  });

  it('does not listen without a project', () => {
    renderHook(() => useLatestMessages(null));
    expect(fs.onSnapshot).not.toHaveBeenCalled();
  });
});
