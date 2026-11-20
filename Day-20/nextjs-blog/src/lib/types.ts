/** A blog post as the site uses it. Parsed from content/posts/<slug>.md by `parsePost`. */
export interface Post {
  slug: string;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  tags: string[];
  author: string;
  excerpt: string;
  cover: { src: string; alt: string };
  /** the Markdown after the front matter */
  body: string;
  readingMinutes: number;
}

/** What list pages need: everything except the body (so a list never ships article text) */
export type PostSummary = Omit<Post, 'body'>;
