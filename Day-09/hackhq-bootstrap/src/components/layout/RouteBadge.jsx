import { useParams } from 'react-router-dom';
import { Route as RouteIcon } from 'lucide-react';

/**
 * W3: Live route badge. Shows the pattern this page was matched by and the
 * raw params React Router extracted from the URL. Values print with quotes
 * on purpose: params are always strings.
 */
export default function RouteBadge({ pattern }) {
  const params = useParams();
  const entries = Object.entries(params);

  return (
    <div
      className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-xl bg-board px-3 py-2 font-mono text-xs text-on-board"
      aria-label={`Matched route ${pattern}`}
    >
      <RouteIcon size={14} aria-hidden="true" className="text-brand" />
      <code className="text-brand">{pattern}</code>
      <span className="opacity-50" aria-hidden="true">
        →
      </span>
      <code className="break-all opacity-90">
        {entries.length === 0
          ? '{ }'
          : `{ ${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')} }`}
      </code>
    </div>
  );
}
