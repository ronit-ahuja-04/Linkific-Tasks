// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { DEFAULT_DURATION, MAX_VISIBLE_TOASTS, ToastProvider, toastReducer, useToast, useToasts } from '../../src/context/ToastContext.jsx';
import { LanguageProvider } from '../../src/context/LanguageContext.jsx';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const wrapper = ({ children }) => (
  <LanguageProvider>
    <ToastProvider>{children}</ToastProvider>
  </LanguageProvider>
);
const setup = () => renderHook(() => ({ toast: useToast(), toasts: useToasts() }), { wrapper });

describe('toastReducer (pure)', () => {
  const t = (id) => ({ id, type: 'info', message: id, duration: 1000 });

  it('adds newest last, dismisses by id, clears, ignores unknown actions', () => {
    let state = toastReducer([], { type: 'add', toast: t('a') });
    state = toastReducer(state, { type: 'add', toast: t('b') });
    expect(state.map((x) => x.id)).toEqual(['a', 'b']);
    expect(toastReducer(state, { type: 'dismiss', id: 'a' }).map((x) => x.id)).toEqual(['b']);
    expect(toastReducer(state, { type: 'dismiss', id: 'zzz' })).toHaveLength(2);
    expect(toastReducer(state, { type: 'clear' })).toEqual([]);
    expect(toastReducer(state, { type: 'nope' })).toBe(state);
  });

  it(`keeps at most ${MAX_VISIBLE_TOASTS}, dropping the oldest`, () => {
    let state = [];
    for (let i = 1; i <= MAX_VISIBLE_TOASTS + 2; i++) state = toastReducer(state, { type: 'add', toast: t(`t${i}`) });
    expect(state).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(state[0].id).toBe('t3');
    expect(state.at(-1).id).toBe(`t${MAX_VISIBLE_TOASTS + 2}`);
  });
});

describe('hooks', () => {
  it('fail with a clear message outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used inside a <ToastProvider>.');
    expect(() => renderHook(() => useToasts())).toThrow('useToasts must be used inside a <ToastProvider>.');
    spy.mockRestore();
  });

  it('useToast returns the same actions object for the whole life of the provider (no re-renders for callers)', () => {
    const { result } = setup();
    const first = result.current.toast;
    act(() => { result.current.toast.success('one'); });
    act(() => { result.current.toast.error('two'); });
    expect(result.current.toast).toBe(first);
    expect(result.current.toasts).toHaveLength(2);
  });

  it('a component that only calls useToast does NOT re-render when toasts come and go', () => {
    let renders = 0;
    let api;
    function Caller() {
      api = useToast();
      renders += 1;
      return <button>go</button>;
    }
    render(<LanguageProvider><ToastProvider><Caller /></ToastProvider></LanguageProvider>);
    const before = renders;
    act(() => { api.info('a'); });
    act(() => { api.info('b'); });
    act(() => { api.clear(); });
    expect(renders).toBe(before);
  });
});

describe('actions', () => {
  it('success, error and info set the type and sensible default durations; show returns an id', () => {
    const { result } = setup();
    let ids;
    act(() => { ids = [result.current.toast.success('s'), result.current.toast.error('e'), result.current.toast.info('i')]; });
    expect(new Set(ids).size).toBe(3);
    expect(result.current.toasts.map((x) => [x.type, x.duration])).toEqual([
      ['success', DEFAULT_DURATION.success], ['error', DEFAULT_DURATION.error], ['info', DEFAULT_DURATION.info],
    ]);
  });

  it('a custom duration wins, and dismiss removes one toast', () => {
    const { result } = setup();
    let id;
    act(() => { id = result.current.toast.error('slow', { duration: 9999 }); result.current.toast.info('other'); });
    expect(result.current.toasts[0].duration).toBe(9999);
    act(() => result.current.toast.dismiss(id));
    expect(result.current.toasts.map((x) => x.message)).toEqual(['other']);
  });
});

describe('ToastViewport', () => {
  function Trigger({ children = 'x', options }) {
    const toast = useToast();
    return <button onClick={() => toast.info(children, options)}>show</button>;
  }
  const open = (options, message = 'Saved') => {
    render(<LanguageProvider><ToastProvider><Trigger options={options}>{message}</Trigger></ToastProvider></LanguageProvider>);
    fireEvent.click(screen.getByText('show'));
  };

  it('renders an accessible region; errors are alerts, others are polite status messages', () => {
    render(
      <LanguageProvider>
        <ToastProvider>
          <Trigger>info text</Trigger>
        </ToastProvider>
      </LanguageProvider>
    );
    expect(screen.getByRole('region', { name: 'Alerts' })).toBeTruthy();
    fireEvent.click(screen.getByText('show'));
    expect(screen.getByRole('status').textContent).toContain('info text');
  });

  it('error toasts use role="alert"', () => {
    function ErrorTrigger() {
      const toast = useToast();
      return <button onClick={() => toast.error('Boom')}>boom</button>;
    }
    render(<LanguageProvider><ToastProvider><ErrorTrigger /></ToastProvider></LanguageProvider>);
    fireEvent.click(screen.getByText('boom'));
    expect(screen.getByRole('alert').textContent).toContain('Boom');
  });

  it('dismisses itself after its duration (with the exit animation time)', () => {
    open({ duration: 1000 });
    expect(screen.getByText('Saved')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(999); });
    expect(screen.getByText('Saved')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1); }); // starts leaving
    expect(screen.getByRole('status').className).toContain('snack--leaving');
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('pauses while hovered and resumes with the time that was left', () => {
    open({ duration: 1000 });
    const toastEl = screen.getByRole('status');
    act(() => { vi.advanceTimersByTime(600); });
    fireEvent.mouseEnter(toastEl);
    act(() => { vi.advanceTimersByTime(5000); }); // paused: nothing happens, however long
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(toastEl.className).not.toContain('leaving');
    fireEvent.mouseLeave(toastEl);
    act(() => { vi.advanceTimersByTime(399); });
    expect(toastEl.className).not.toContain('leaving'); // 600 + 399 < 1000
    act(() => { vi.advanceTimersByTime(2); });
    expect(toastEl.className).toContain('leaving');
  });

  it('pauses while a button inside has keyboard focus', () => {
    open({ duration: 500 });
    const toastEl = screen.getByRole('status');
    fireEvent.focus(toastEl);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(toastEl.className).not.toContain('leaving');
    fireEvent.blur(toastEl);
    act(() => { vi.advanceTimersByTime(501); });
    expect(toastEl.className).toContain('leaving');
  });

  it('the close button dismisses at once and is named in the current language', () => {
    open({ duration: 0 }); // duration 0: never auto-dismisses
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByText('Saved')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('a toast with duration 0 has no countdown bar', () => {
    open({ duration: 0 });
    expect(document.querySelector('.snack-bar')).toBeNull();
  });

  it('shows the countdown bar with the right duration', () => {
    open({ duration: 2500 });
    expect(document.querySelector('.snack-bar').style.animationDuration).toBe('2500ms');
  });
});

describe('ToastViewport publishes its height for the older notification toasts', () => {
  let observe;
  let heightNow;
  beforeEach(() => {
    heightNow = 0;
    observe = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback) { this.callback = callback; observe.callback = callback; }
      observe() { observe(); }
      disconnect() {}
    });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return { height: this.classList?.contains('snack-viewport') ? heightNow : 0, width: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0 };
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty('--snack-offset');
  });

  it('is 0 with no toasts, then height plus a gap when there are, and is removed on unmount', () => {
    const { unmount } = render(<LanguageProvider><ToastProvider><span /></ToastProvider></LanguageProvider>);
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--snack-offset')).toBe('0px');
    heightNow = 120.4;
    act(() => observe.callback());
    expect(root.style.getPropertyValue('--snack-offset')).toBe('133px'); // ceil(120.4) + 12
    heightNow = 0;
    act(() => observe.callback());
    expect(root.style.getPropertyValue('--snack-offset')).toBe('0px');
    unmount();
    expect(root.style.getPropertyValue('--snack-offset')).toBe('');
  });
});
