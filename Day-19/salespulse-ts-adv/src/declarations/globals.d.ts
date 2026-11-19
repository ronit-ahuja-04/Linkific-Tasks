/**
 * DECLARATION FILE 2: an ambient global.
 *
 * vite.config.ts and vitest.config.ts `define` a constant that Vite replaces by a literal at build time.
 * TypeScript can not see that replacement, so the name is declared here: `declare const` says "this exists at
 * run time; here is its type", and emits no code.
 */
declare const __APP_VERSION__: string;
