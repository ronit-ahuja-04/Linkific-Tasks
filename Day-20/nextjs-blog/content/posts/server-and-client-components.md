---
title: Server Components and Client Components
date: 2026-11-08
tags: [react, components]
author: Ronit Ahuja
excerpt: Components are server components by default. Add "use client" only where you need state, effects or browser APIs.
cover: /covers/server-and-client-components.png
coverAlt: Abstract orange and pink gradient with stacked squares
---
Every component in the App Router is a **Server Component** unless you say otherwise. It runs on the server, can be `async`, can read a database or the file system, and sends only its output to the browser, not its code.

## When to use which

- Use a Server Component to fetch data, to keep secrets on the server, and to keep JavaScript out of the bundle.
- Use a Client Component (a file that starts with `"use client"`) for `useState`, `useEffect`, event handlers and browser APIs.

## Composition

A Client Component cannot import a Server Component, but it can receive one as `children`. That lets a small interactive shell wrap server-rendered content.

```tsx
'use client'
import { useState, type ReactNode } from 'react'

export function Disclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div>{open && children}</div>
}
```
