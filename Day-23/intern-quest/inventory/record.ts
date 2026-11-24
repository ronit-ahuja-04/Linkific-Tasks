import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Browser, BrowserContext, Page } from '@playwright/test';

/** Shared by the inventory scenarios, its setup and its report */
export const LABEL = process.env.INVENTORY_LABEL ?? 'before';
export const ROOT = process.cwd(); // Playwright runs from the project root
export const STATE_DIR = path.join(ROOT, 'inventory', '.state');
export const RESULTS = path.join(STATE_DIR, `results-${LABEL}.jsonl`);
export const SHOTS_DIR = path.join(ROOT, 'docs', 'errors', LABEL);
export const FAULT_URL = 'http://127.0.0.1:55499/__fault';

export interface Fixture {
  handle: string;
  questId: string;
  internState: string;
  mentorState: string;
}
export const fixture = (): Fixture => JSON.parse(readFileSync(path.join(STATE_DIR, 'fixture.json'), 'utf8')) as Fixture;

export type Mode = 'pass' | 'slow' | 'unavailable' | 'down';
export async function dbFault(mode: Mode, ms = 0): Promise<void> {
  await fetch(`${FAULT_URL}?mode=${mode}&ms=${ms}`, { method: 'POST' });
}

export interface Observation {
  id: string;
  area: string;
  operation: string;
  fault: string;
  /** HTTP status of the page or API answer, when there is one */
  status?: number | null;
  contentType?: string | null;
  /** the main heading, the visible messages, or (with neither) the start of the page text */
  sees: string;
  /** the action's button is still disabled (or still says "Saving…") when we stop waiting */
  stuck?: boolean;
  /** how long we waited before observing, or how long the page took */
  ms?: number;
  console: string[];
  pageErrors: string[];
  /** console errors from the /_vercel/* scripts, which only exist on Vercel */
  noise?: number;
  screenshot?: string;
  note?: string;
}

/**
 * Console errors and uncaught exceptions (including unhandled promise rejections) of a page.
 * Vercel Analytics and Speed Insights load /_vercel/* scripts, which exist only on Vercel: locally each page logs two
 * errors for them. They are counted apart (`noise`), so the real errors stand out.
 */
export function watch(page: Page): { console: string[]; pageErrors: string[]; noise: number } {
  const seen = { console: [] as string[], pageErrors: [] as string[], noise: 0 };
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (m.location().url.includes('/_vercel/') || m.text().includes('/_vercel/')) seen.noise += 1;
    else seen.console.push(m.text().slice(0, 160));
  });
  page.on('pageerror', (e) => seen.pageErrors.push(`${e.name}: ${e.message}`.slice(0, 160)));
  return seen;
}

/** What a person looking at the screen would read: the heading and any visible message */
export async function describeScreen(page: Page): Promise<string> {
  const h1 = (await page.locator('h1').filter({ visible: true }).allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  const messages = (await page.locator('[role=alert], .form-error, .auth-error, .notice, .field-error').filter({ visible: true }).allInnerTexts())
    .map((t) => t.trim()).filter(Boolean);
  const parts = [...h1.map((t) => `h1 "${t}"`), ...messages.map((t) => `message "${t}"`)];
  if (parts.length > 0) return parts.join('; ');
  const text = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  return text ? `page text "${text.slice(0, 140)}${text.length > 140 ? '…' : ''}"` : 'a blank page';
}

export async function shot(page: Page, id: string): Promise<string> {
  mkdirSync(SHOTS_DIR, { recursive: true });
  const file = path.join(SHOTS_DIR, `${id}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 70 });
  return `${LABEL}/${id}.jpg`;
}

export function record(observation: Observation): void {
  mkdirSync(STATE_DIR, { recursive: true });
  appendFileSync(RESULTS, `${JSON.stringify(observation)}\n`);
}

export async function contextFor(browser: Browser, who: 'intern' | 'mentor' | 'guest', baseURL: string): Promise<BrowserContext> {
  const f = fixture();
  const storageState = who === 'intern' ? f.internState : who === 'mentor' ? f.mentorState : undefined;
  return browser.newContext({ baseURL, storageState, viewport: { width: 1100, height: 760 } });
}
