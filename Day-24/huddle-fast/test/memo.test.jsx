// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Wrapper, makeFakeClient, message } from './helpers/chat.jsx';

/**
 * Day 24, React.memo: MessageItem renders only when its own props change. Renders are counted through
 * `messageTime`, which MessageItem calls exactly once per render (spied on, the real function still runs).
 */
const format = vi.hoisted(() => ({ calls: 0 }));
vi.mock('../src/lib/format', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, messageTime: (...args) => { format.calls += 1; return real.messageTime(...args); } };
});
const { default: MessageItem } = await import('../src/components/chat/MessageItem');

let api;
/** A stand-in for RoomView: a list in state, handlers either stable (useCallback) or new on every render */
function List({ initial, stableHandlers }) {
  const [messages, setMessages] = useState(initial);
  const [, setTick] = useState(0);
  const stableEdit = useCallback(async () => null, []);
  const stableDelete = useCallback(async () => null, []);
  const onEdit = stableHandlers ? stableEdit : async () => null;
  const onDelete = stableHandlers ? stableDelete : async () => null;
  api = {
    add: (m) => setMessages((list) => [...list, m]),
    replace: (m) => setMessages((list) => list.map((x) => (x.id === m.id ? m : x))),
    rerender: () => setTick((t) => t + 1), // e.g. someone started typing: the room re-renders, the list did not change
  };
  return <ul>{messages.map((m) => <MessageItem key={m.id} message={m} mine={false} onEdit={onEdit} onDelete={onDelete} />)}</ul>;
}

const fifty = () => Array.from({ length: 50 }, (_, i) => message(i + 1));
const mount = (stableHandlers) => render(<Wrapper client={makeFakeClient()}><List initial={fifty()} stableHandlers={stableHandlers} /></Wrapper>);

beforeEach(() => { format.calls = 0; });

describe('React.memo on MessageItem (with useCallback in the parent)', () => {
  it('a new message renders only the new message, not the 50 already there', () => {
    mount(true);
    expect(format.calls).toBe(50);
    format.calls = 0;
    act(() => api.add(message(51)));
    expect(format.calls).toBe(1);
  });

  it('the room re-rendering for something else (typing, presence) renders no message at all', () => {
    mount(true);
    format.calls = 0;
    act(() => api.rerender());
    expect(format.calls).toBe(0);
  });

  it('an edited message re-renders that one only (a new object for it, the same objects for the rest)', () => {
    mount(true);
    format.calls = 0;
    act(() => api.replace(message(7, { body: 'edited text' })));
    expect(format.calls).toBe(1);
  });
});

describe('why useCallback is part of it', () => {
  it('with NEW handler functions on every render, memo compares them as changed: every message renders again', () => {
    mount(false);
    format.calls = 0;
    act(() => api.rerender());
    expect(format.calls).toBe(50); // the Day 22 behaviour, multiplied by every message in a long session
  });
});
