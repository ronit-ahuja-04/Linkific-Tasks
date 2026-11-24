/**
 * TOASTS: short messages about something that happened ELSEWHERE or in the BACKGROUND, e.g. a mentor's note that was
 * sent (or not) while they moved on, or an error no part of the page could show. A failure tied to a place, like a
 * form field or a Save button, is shown IN that place instead (see the README's error-handling rules).
 *
 * A tiny store, not a React context, so code outside React (the global error listener) can raise one too.
 * Rendered by <Toaster /> in the root layout.
 */
export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

type Listener = (toasts: readonly Toast[]) => void;

/** Errors stay until dismissed (a person must have time to read them: WCAG 2.2.1); the rest leave after 6 s */
export const TOAST_MS: Record<ToastTone, number | null> = { success: 6000, info: 6000, error: null };
const MAX_VISIBLE = 4;

let toasts: readonly Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((listener) => listener(toasts));

export function toast(text: string, tone: ToastTone = 'info'): number {
  const id = nextId++;
  // the same message twice in a row (e.g. a retry that failed the same way) replaces the old one
  toasts = [...toasts.filter((t) => t.text !== text), { id, tone, text }].slice(-MAX_VISIBLE);
  emit();
  const ms = TOAST_MS[tone];
  if (ms !== null && typeof window !== 'undefined') window.setTimeout(() => dismissToast(id), ms);
  return id;
}

export function dismissToast(id: number): void {
  const before = toasts.length;
  toasts = toasts.filter((t) => t.id !== id);
  if (toasts.length !== before) emit();
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const currentToasts = (): readonly Toast[] => toasts;
const NONE: readonly Toast[] = [];
export const serverToasts = (): readonly Toast[] => NONE;
