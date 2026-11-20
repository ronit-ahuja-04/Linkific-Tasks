import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Markdown from '@/components/Markdown';
import { parseBlocks, parseInline, readingMinutes, splitFrontMatter } from '@/lib/markdown';

describe('splitFrontMatter', () => {
  it('reads key: value lines and [a, b] lists, and returns the body', () => {
    const { data, body } = splitFrontMatter('---\ntitle: Hello: world\ntags: [a, b , c]\n---\nText here');
    expect(data).toEqual({ title: 'Hello: world', tags: ['a', 'b', 'c'] });
    expect(body).toBe('Text here');
  });

  it('treats a file with no front matter as all body', () => {
    expect(splitFrontMatter('Just text')).toEqual({ data: {}, body: 'Just text' });
  });

  it('copes with Windows line endings', () => {
    expect(splitFrontMatter('---\r\ntitle: A\r\n---\r\nB').data).toEqual({ title: 'A' });
  });
});

describe('parseInline', () => {
  it('splits text, `code` and **bold**', () => {
    expect(parseInline('Use `cache` and **stream** it')).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'code', text: 'cache' },
      { kind: 'text', text: ' and ' },
      { kind: 'bold', text: 'stream' },
      { kind: 'text', text: ' it' },
    ]);
  });

  it('leaves an unmatched backtick as plain text', () => {
    expect(parseInline('a ` b')).toEqual([{ kind: 'text', text: 'a ` b' }]);
  });
});

describe('parseBlocks', () => {
  it('finds headings, paragraphs (joined across lines), lists and fenced code', () => {
    const blocks = parseBlocks('## Title\n\nfirst line\nsecond line\n\n- one\n- two\n\n```ts\nconst a = 1\n```\n\n### Small');
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'paragraph', 'list', 'code', 'heading']);
    expect(blocks[0]).toEqual({ kind: 'heading', level: 2, text: 'Title' });
    expect(blocks[1]).toMatchObject({ kind: 'paragraph', content: [{ kind: 'text', text: 'first line second line' }] });
    expect(blocks[2]).toMatchObject({ kind: 'list', items: [[{ text: 'one' }], [{ text: 'two' }]] });
    expect(blocks[3]).toEqual({ kind: 'code', language: 'ts', text: 'const a = 1' });
    expect(blocks[4]).toEqual({ kind: 'heading', level: 3, text: 'Small' });
  });

  it('keeps blank lines and # characters inside a code fence as code', () => {
    const [block] = parseBlocks('```text\n# not a heading\n\n- not a list\n```');
    expect(block).toEqual({ kind: 'code', language: 'text', text: '# not a heading\n\n- not a list' });
  });
});

describe('readingMinutes', () => {
  it('is at least one minute and about 200 words a minute', () => {
    expect(readingMinutes('short')).toBe(1);
    expect(readingMinutes(Array(600).fill('word').join(' '))).toBe(3);
  });
});

describe('<Markdown>', () => {
  it('renders elements, and escapes anything that looks like HTML', () => {
    const html = renderToStaticMarkup(<Markdown source={'## Hi\n\nA <script>alert(1)</script> and `x`'} />);
    expect(html).toContain('<h2>Hi</h2>');
    expect(html).toContain('<code>x</code>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
