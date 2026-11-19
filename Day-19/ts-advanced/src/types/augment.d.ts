// Augmenting THIRD-PARTY types: re-open an installed package's interface and add to it (interfaces merge).
export {};

declare module 'react' {
  /** React's CSSProperties does not know custom properties. A template-literal index signature allows every `--*` key. */
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }
}

declare module 'vitest' {
  /** Vitest's own documented extension point: values passed from the config to tests through `provide` / `inject` */
  interface ProvidedContext {
    apiUrl: string;
  }
}
