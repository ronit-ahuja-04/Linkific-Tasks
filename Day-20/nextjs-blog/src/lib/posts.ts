'use cache';

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheLife, cacheTag } from 'next/cache';
import { parsePost } from './parse-post';
import type { Post, PostSummary } from './types';

/**
 * THE POST STORE: server-side data fetching, here from Markdown files on disk.
 *
 * `'use cache'` at the top of the file makes every exported function a cached one (so each must be async).
 * Reading files is async I/O, which would normally make a page wait for the request; cached, the result is
 * computed once at build time, becomes part of the static shell, and is rebuilt in the background after the lifetime
 * below. `cacheLife('days')` suits posts that change when I edit them; `cacheTag('posts')` lets `revalidateTag('posts')`
 * refresh them on demand.
 */
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

async function readAll(): Promise<Post[]> {
  const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.md'));
  const posts = await Promise.all(files.map(async (name) => parsePost(name.replace(/\.md$/, ''), await readFile(path.join(POSTS_DIR, name), 'utf8'))));
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

/** A post without its body. Fields are listed out (not `delete`d or rest-spread) so adding a field to `PostSummary` is a compile error here. */
const summarise = (post: Post): PostSummary => ({
  slug: post.slug,
  title: post.title,
  date: post.date,
  tags: post.tags,
  author: post.author,
  excerpt: post.excerpt,
  cover: post.cover,
  readingMinutes: post.readingMinutes,
});

/** Every post, newest first, without bodies */
export async function getAllPosts(): Promise<PostSummary[]> {
  cacheLife('days');
  cacheTag('posts');
  return (await readAll()).map(summarise);
}

/** One post with its body, or null when there is no such slug */
export async function getPost(slug: string): Promise<Post | null> {
  cacheLife('days');
  cacheTag('posts', `post:${slug}`);
  return (await readAll()).find((post) => post.slug === slug) ?? null;
}

/** For `generateStaticParams`: the slugs to build at build time */
export async function getPostSlugs(): Promise<string[]> {
  cacheLife('days');
  cacheTag('posts');
  return (await readAll()).map((post) => post.slug);
}

/** Every tag with how many posts use it, most used first */
export async function getTags(): Promise<{ tag: string; count: number }[]> {
  cacheLife('days');
  cacheTag('posts');
  const counts = new Map<string, number>();
  for (const post of await readAll()) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
