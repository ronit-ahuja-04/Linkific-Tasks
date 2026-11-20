import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDate, parsePost, PostFormatError } from '@/lib/parse-post';

const valid = (extra = '') => `---\ntitle: A title\ndate: 2026-11-20\ntags: [one, two]\nauthor: Me\nexcerpt: Short.\ncover: /covers/x.png\ncoverAlt: Alt text\n${extra}---\nBody text.`;

describe('parsePost', () => {
  it('turns a Markdown file into a typed Post', () => {
    const post = parsePost('a-title', valid());
    expect(post).toMatchObject({ slug: 'a-title', title: 'A title', date: '2026-11-20', tags: ['one', 'two'], author: 'Me', cover: { src: '/covers/x.png', alt: 'Alt text' }, body: 'Body text.', readingMinutes: 1 });
  });

  it('names the file and the field when something is missing', () => {
    expect(() => parsePost('bad', valid().replace('title: A title\n', ''))).toThrow('content/posts/bad.md: "title" is missing');
    expect(() => parsePost('bad', valid().replace('coverAlt: Alt text\n', ''))).toThrow('"coverAlt" is missing');
  });

  it('rejects a date that is not YYYY-MM-DD, and tags that are not a list', () => {
    expect(() => parsePost('bad', valid().replace('2026-11-20', '20 Nov 2026'))).toThrow(PostFormatError);
    expect(() => parsePost('bad', valid().replace('tags: [one, two]', 'tags: one'))).toThrow('"tags" must be a list');
  });
});

describe('formatDate', () => {
  it('prints 2026-11-05 as 5 November 2026, without using the clock or the time zone', () => {
    expect(formatDate('2026-11-05')).toBe('5 November 2026');
    expect(formatDate('2026-01-31')).toBe('31 January 2026');
  });
  it('returns an unreadable value unchanged instead of crashing', () => {
    expect(formatDate('soon')).toBe('soon');
  });
});

describe('the real content folder', () => {
  const dir = path.join(process.cwd(), 'content', 'posts');
  const files = readdirSync(dir).filter((name) => name.endsWith('.md'));
  const posts = files.map((name) => parsePost(name.replace(/\.md$/, ''), readFileSync(path.join(dir, name), 'utf8')));

  it('has posts, and every one parses', () => {
    expect(posts.length).toBeGreaterThanOrEqual(6);
  });
  it('has unique slugs and dates that are real calendar dates', () => {
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    for (const post of posts) expect(Number.isNaN(Date.parse(post.date))).toBe(false);
  });
  it('points every cover at a file that exists, with alt text', () => {
    for (const post of posts) {
      expect(existsSync(path.join(process.cwd(), 'public', post.cover.src)), post.cover.src).toBe(true);
      expect(post.cover.alt.length).toBeGreaterThan(10);
    }
  });
});
