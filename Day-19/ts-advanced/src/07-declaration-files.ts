// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="./types/ambient.d.ts" />
// ^ triple-slash directive: "this file depends on that declaration file". With `include: ["src"]` it is redundant,
//   but it is how libraries and older projects state a dependency explicitly.
import type { CSSProperties } from 'react';
import logoUrl from './assets/logo.svg';
import greet, { Counter, formatPrice, parseQuery } from './legacy/legacy';

/**
 * 07. Declaration files. Everything imported here is typed by a `.d.ts` in src/types/ or src/legacy/.
 * See README: "Declaration files".
 */

export { logoUrl, greet, Counter, formatPrice, parseQuery };

/** window.appConfig exists because types/globals.d.ts augmented `Window` */
export function readApiUrl(win: Window): string {
  return win.appConfig.apiUrl;
}

/** The CSS custom property `--accent` is accepted because types/augment.d.ts augmented React's CSSProperties */
export function bannerStyle(accent: string): CSSProperties {
  return { color: 'white', '--accent': accent, '--gap': 8 };
}

/** The global namespace comes from types/ambient.d.ts */
export function describeEvent(event: Analytics.Event): string {
  return `${event.name}@${event.at}`;
}
export type AnalyticsEventName = Analytics.EventName;

export const query = (qs: string): number => Object.keys(parseQuery(qs)).length;
