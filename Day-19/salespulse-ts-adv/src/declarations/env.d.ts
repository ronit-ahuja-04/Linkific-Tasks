/**
 * DECLARATION FILE 1: augmenting a third-party type.
 *
 * `vite/client` (referenced in vite-env.d.ts) declares `interface ImportMetaEnv`. An interface declared
 * twice MERGES, so adding our own variables here teaches `import.meta.env` about them. Without this file
 * `import.meta.env.VITE_API_DELAY_MS` would be an error (the property does not exist).
 * This file has no import or export, so it is a global script: its declarations apply everywhere.
 */
interface ImportMetaEnv {
  /** milliseconds the pretend API waits before answering (env values are always strings, or absent) */
  readonly VITE_API_DELAY_MS?: string;
}
