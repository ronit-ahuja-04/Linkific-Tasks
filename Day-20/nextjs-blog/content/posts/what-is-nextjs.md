---
title: What Next.js is, and why use it
date: 2026-11-02
tags: [basics, react]
author: Ronit Ahuja
excerpt: React gives you components. Next.js adds routing, server rendering, data fetching and an optimised build around them.
cover: /covers/what-is-nextjs.png
coverAlt: Abstract blue and violet gradient with overlapping circles
---
React is a library for building user interfaces. It does not decide how pages are routed, where data is fetched, or whether HTML is built on a server. Next.js is the framework that makes those decisions for you.

## What you get on top of React

- **File-based routing**: a folder with a `page.tsx` file is a URL.
- **Server rendering**: pages are turned into HTML before they reach the browser, so they appear fast and search engines can read them.
- **Data fetching on the server**: components can be `async` and read data directly.
- **Built-in optimisation**: images, fonts, code splitting and prefetching.
- **Full stack**: route handlers let the same project answer API requests.

## Next.js versus Create React App

A Create React App project ships an empty HTML page and a large bundle of JavaScript; the browser builds the page. Next.js renders on the server first, then the browser takes over. Create React App is also no longer maintained, so new projects start from a framework.

```tsx
export default function Page() {
  return <h1>Hello from the server</h1>
}
```
