import { readingMinutes, splitFrontMatter } from './markdown';
import type { Post } from './types';

/** Thrown when a Markdown file is missing something the site needs: the message names the file and the field */
export class PostFormatError extends Error {
  constructor(slug: string, problem: string) {
    super(`content/posts/${slug}.md: ${problem}`);
    this.name = 'PostFormatError';
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Front matter values are `string | string[]`; this narrows one to a non-empty string or throws a readable error */
function requireText(slug: string, field: string, value: string | string[] | undefined): string {
  if (typeof value !== 'string' || value.trim() === '') throw new PostFormatError(slug, `"${field}" is missing`);
  return value.trim();
}

/** Turn one Markdown file into a `Post`, checking every field. A bad file fails the build, not a visitor's page. */
export function parsePost(slug: string, source: string): Post {
  const { data, body } = splitFrontMatter(source);
  const date = requireText(slug, 'date', data.date);
  if (!ISO_DATE.test(date)) throw new PostFormatError(slug, `"date" must look like 2026-11-20, got "${date}"`);
  const tags = data.tags;
  if (!Array.isArray(tags) || tags.length === 0) throw new PostFormatError(slug, '"tags" must be a list like [a, b]');
  return {
    slug,
    title: requireText(slug, 'title', data.title),
    date,
    tags,
    author: requireText(slug, 'author', data.author),
    excerpt: requireText(slug, 'excerpt', data.excerpt),
    cover: { src: requireText(slug, 'cover', data.cover), alt: requireText(slug, 'coverAlt', data.coverAlt) },
    body: body.trim(),
    readingMinutes: readingMinutes(body),
  };
}

/** `2026-11-20` -> `20 November 2026`. Done by hand from the string: no Date, so it is the same on every server and browser. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const name = MONTHS[Number(month) - 1];
  if (!year || !day || !name) return iso;
  return `${Number(day)} ${name} ${year}`;
}
