// Copied from Day 20 (Dispatch): a tiny Markdown reader that returns data, so no HTML string is ever built.
/**
 * A deliberately small Markdown reader: front matter, headings, paragraphs, bullet lists, fenced code,
 * and inline `code` / **bold**. It turns text into plain data (blocks), and a component turns the data
 * into elements, so no HTML string is ever built (nothing to sanitise, nothing to inject).
 */
export type Inline = { kind: 'text'; text: string } | { kind: 'code'; text: string } | { kind: 'bold'; text: string };

export type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; content: Inline[] }
  | { kind: 'list'; items: Inline[][] }
  | { kind: 'code'; language: string; text: string };

export interface FrontMatter {
  [key: string]: string | string[];
}

/** Split `---\nkey: value\n---\nbody` into its two parts. Values like `[a, b]` become arrays. */
export function splitFrontMatter(source: string): { data: FrontMatter; body: string } {
  const text = source.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) return { data: {}, body: text };
  const [, header = '', body = ''] = match;
  const data: FrontMatter = {};
  for (const line of header.split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    data[key] = value.startsWith('[') && value.endsWith(']') ? value.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean) : value;
  }
  return { data, body };
}

/** `Use \`cache\` and **stream**` -> text, code, text, bold */
export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ kind: 'text', text: text.slice(last, match.index) });
    if (match[1] !== undefined) parts.push({ kind: 'code', text: match[1] });
    else if (match[2] !== undefined) parts.push({ kind: 'bold', text: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}

export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = (): void => {
    if (paragraph.length > 0) blocks.push({ kind: 'paragraph', content: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? '')) {
        code.push(lines[i] ?? '');
        i += 1;
      }
      blocks.push({ kind: 'code', language: fence[1] || 'text', text: code.join('\n') });
      continue;
    }
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1]?.length === 3 ? 3 : 2, text: heading[2] ?? '' });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      const items: Inline[][] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? '')) {
        items.push(parseInline((lines[i] ?? '').replace(/^[-*]\s+/, '')));
        i += 1;
      }
      i -= 1;
      blocks.push({ kind: 'list', items });
      continue;
    }
    if (line.trim() === '') flush();
    else paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

/** About 200 words a minute, never less than one minute */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
