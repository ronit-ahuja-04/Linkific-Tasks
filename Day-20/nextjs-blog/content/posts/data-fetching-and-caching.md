---
title: Fetching data and caching it
date: 2026-11-12
tags: [data, caching]
author: Ronit Ahuja
excerpt: Async components read data where it is used. The use cache directive decides how long a result may be reused.
cover: /covers/data-fetching-and-caching.png
coverAlt: Abstract gold and red gradient with concentric rings
---
Because Server Components can be `async`, data fetching is just `await` inside the component. There is no separate data-loading layer.

## Cache a result with a lifetime

In this version of Next.js you mark a function or component with the `use cache` directive and give it a lifetime with `cacheLife`.

```ts
import { cacheLife, cacheTag } from 'next/cache'

export async function getPosts() {
  'use cache'
  cacheLife('days')
  cacheTag('posts')
  return readPostsFromDisk()
}
```

## Fresh data streams in

Data that must be fresh on every request is not cached. Wrap the component that reads it in `Suspense`: the page's static shell is sent at once, and the dynamic part streams in when it is ready.

## Errors

A thrown error is caught by the nearest `error.tsx`. A missing record should call `notFound()` instead, which shows the nearest `not-found.tsx`.
