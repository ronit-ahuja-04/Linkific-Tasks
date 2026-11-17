import { splitSnippet } from '../../lib/notes';

/** A search snippet with the matched words highlighted. Plain React text + <mark>: no HTML from the database is ever parsed. */
export default function Snippet({ text }) {
  return (
    <span className="notes-snippet">
      {splitSnippet(text).map((part, index) => (part.match ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>))}
    </span>
  );
}
