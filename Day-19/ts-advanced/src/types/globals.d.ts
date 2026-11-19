// `export {}` turns this file into a MODULE, which is required before `declare global` is allowed.
export {};

declare global {
  /** Declaration merging: this is ADDED to the Window interface that lib.dom.d.ts already declares */
  interface Window {
    appConfig: {
      apiUrl: string;
      features: readonly string[];
    };
  }

  /** `var` (not let/const) is what makes something a property of globalThis */
  var __BUILD_ID__: string | undefined;
}
