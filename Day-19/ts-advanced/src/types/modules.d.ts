// A "script" .d.ts (no top-level import/export): `declare module` here DECLARES a module that has no types of its own.

/**
 * Wildcard module: any import ending in .svg is a string (a bundler turns an image into its URL).
 * Without this, `import logo from './logo.svg'` is error TS2307: cannot find module.
 */
declare module '*.svg' {
  const url: string;
  export default url;
}

/**
 * Types for an UNTYPED third-party JavaScript package (this one is imaginary: it is only used with `import type`).
 * For a real package with no types, first try `npm i -D @types/<name>`; write this by hand only if that does not exist.
 */
declare module 'tiny-slugify' {
  export interface SlugOptions {
    separator?: '-' | '_';
    lower?: boolean;
  }
  /** overloads: the second argument is either a separator or an options object */
  function slugify(text: string): string;
  function slugify(text: string, separator: '-' | '_'): string;
  function slugify(text: string, options: SlugOptions): string;
  export default slugify;
}
