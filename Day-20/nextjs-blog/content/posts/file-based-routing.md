---
title: File-based routing in the App Router
date: 2026-11-05
tags: [routing, basics]
author: Ronit Ahuja
excerpt: Folders become URLs. Special files add layouts, loading states and error handling to each segment.
cover: /covers/file-based-routing.png
coverAlt: Abstract green and teal gradient with diagonal bands
---
In the App Router the folder structure under `app/` is the route structure. There is no routing table to maintain.

## The special files

- `page.tsx` makes a segment public.
- `layout.tsx` wraps a segment and everything under it, and keeps its state while you navigate between children.
- `loading.tsx` is shown while the segment streams in.
- `error.tsx` catches errors in the segment.
- `not-found.tsx` is shown when `notFound()` is called.

## Dynamic segments, groups and nesting

A folder named `[slug]` matches any value, which arrives in the `params` prop. A folder named `(marketing)` groups routes under a shared layout without adding to the URL. Nested folders give nested URLs.

```text
app/
  blog/page.tsx            /blog
  blog/[slug]/page.tsx     /blog/anything
  (marketing)/about/page.tsx   /about
```
