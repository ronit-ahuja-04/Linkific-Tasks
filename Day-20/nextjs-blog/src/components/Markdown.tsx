import { Fragment } from 'react';
import { parseBlocks, type Block, type Inline } from '@/lib/markdown';

function Inlines({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        switch (node.kind) {
          case 'code':
            return <code key={i}>{node.text}</code>;
          case 'bold':
            return <strong key={i}>{node.text}</strong>;
          case 'text':
            return <Fragment key={i}>{node.text}</Fragment>;
        }
      })}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'heading':
      return block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>;
    case 'paragraph':
      return <p><Inlines nodes={block.content} /></p>;
    case 'list':
      return <ul>{block.items.map((item, i) => <li key={i}><Inlines nodes={item} /></li>)}</ul>;
    case 'code':
      return <pre data-language={block.language}><code>{block.text}</code></pre>;
  }
}

/** A Server Component: the Markdown is parsed on the server and only the resulting elements are sent. */
export default function Markdown({ source }: { source: string }) {
  return <div className="prose">{parseBlocks(source).map((block, i) => <BlockView key={i} block={block} />)}</div>;
}
