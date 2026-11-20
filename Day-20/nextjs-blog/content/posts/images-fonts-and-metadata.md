---
title: Images, fonts, metadata and SEO
date: 2026-11-18
tags: [seo, performance]
author: Ronit Ahuja
excerpt: next/image, next/font and the Metadata API cover most of what makes a page fast and findable.
cover: /covers/images-fonts-and-metadata.png
coverAlt: Abstract teal and navy gradient with horizontal waves
---
Three built-in features do most of the work for performance and search.

## next/image

The `Image` component resizes, converts to modern formats such as WebP, lazy-loads, and reserves space so the page does not jump while the image loads. Mark the main image of a page with `priority`.

## next/font

`next/font` downloads a font at build time and serves it from your own domain, with no layout shift. Nothing is requested from Google when a visitor opens the page.

## Metadata

Export a `metadata` object, or an async `generateMetadata` function for dynamic routes, to set the title, description, Open Graph and Twitter cards. A `sitemap.ts` and a `robots.ts` file complete the basics.

```ts
export const metadata = {
  title: 'My page',
  description: 'What the page is about',
}
```
