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
    <div className="route-badge" aria-label={`Matched route ${pattern}`}>
      <RouteIcon size={14} aria-hidden="true" className="route-badge-icon" />
      <code className="route-badge-pattern">{pattern}</code>
      <span className="route-badge-arrow" aria-hidden="true">
        →
      </span>
      <code className="route-badge-params">
        {entries.length === 0
          ? '{ }'
          : `{ ${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')} }`}
      </code>
    </div>
  );
}
