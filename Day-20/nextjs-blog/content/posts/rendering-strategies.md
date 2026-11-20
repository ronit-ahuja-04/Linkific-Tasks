---
title: SSG, SSR, ISR and CSR, and when to use each
date: 2026-11-15
tags: [rendering, caching]
author: Ronit Ahuja
excerpt: Four ways to produce a page, and how they map onto the component-level model Next.js uses today.
cover: /covers/rendering-strategies.png
coverAlt: Abstract purple and indigo gradient with a grid of dots
---
Next.js can produce a page in four ways. They are no longer four route-level modes: in the current model each part of a page chooses.

## The four strategies

- **Static generation (SSG)**: built once at build time. Best for content that changes only when you deploy.
- **Incremental regeneration (ISR)**: built ahead of time, then rebuilt in the background after a lifetime you choose. Best for content that changes now and then.
- **Server rendering (SSR)**: built on every request. Best for data that is personal or must be fresh.
- **Client rendering (CSR)**: the browser fetches the data after load. Best for interactive widgets behind a log-in.

## How they look in code

Cached with a long lifetime is SSG. Cached with a short `cacheLife` is ISR. An uncached component inside `Suspense` is SSR. A Client Component that calls `fetch` in an effect is CSR. The `/rendering` page on this site shows all four side by side.
