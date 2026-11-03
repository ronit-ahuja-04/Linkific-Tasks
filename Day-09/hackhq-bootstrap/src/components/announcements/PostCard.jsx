import { Button, ButtonGroup, Card } from 'react-bootstrap';
import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Badge } from '../ui.jsx';
import { CATEGORY_TONES, formatPostDate } from '../../lib/announcements.js';

function OrganizerControls({ post, onTogglePin, onEdit, onDelete, inverted }) {
  return (
    <ButtonGroup size="sm" aria-label={`Manage "${post.title}"`}>
      <Button
        variant={inverted ? 'outline-light' : 'outline-secondary'}
        onClick={() => onTogglePin(post)}
        aria-pressed={post.pinned}
        aria-label={`${post.pinned ? 'Unpin' : 'Pin'} "${post.title}"`}
        title={post.pinned ? 'Unpin' : 'Pin to top'}
      >
        {post.pinned ? (
          <PinOff size={14} aria-hidden="true" />
        ) : (
          <Pin size={14} aria-hidden="true" />
        )}
      </Button>
      <Button
        variant={inverted ? 'outline-light' : 'outline-secondary'}
        onClick={() => onEdit(post)}
        aria-label={`Edit "${post.title}"`}
        title="Edit"
      >
        <Pencil size={14} aria-hidden="true" />
      </Button>
      <Button
        variant={inverted ? 'outline-light' : 'outline-danger'}
        onClick={() => onDelete(post)}
        aria-label={`Delete "${post.title}"`}
        title="Delete"
      >
        <Trash2 size={14} aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}

function PostMeta({ post, isNew }) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <Badge tone={CATEGORY_TONES[post.category]}>{post.category}</Badge>
      {post.pinned && (
        <Badge tone="warn">
          <Pin size={11} aria-hidden="true" />
          Pinned
        </Badge>
      )}
      {isNew && <Badge tone="brand">New</Badge>}
    </div>
  );
}

/**
 * CONCEPT: Featured card - the latest pinned post gets a full-width dark panel above the grid.
 */
export function FeaturedPost({ post, isNew, isOrganizer, ...controls }) {
  return (
    <Card
      as="article"
      className="border-0 p-4 p-lg-5 text-bg-dark animate-rise panel-board"

      aria-labelledby={`post-${post.id}`}
    >
      <PostMeta post={post} isNew={isNew} />
      <h2 id={`post-${post.id}`} className="display-6 fw-bold mt-3 mb-3">
        {post.title}
      </h2>
      <p className="fs-5 mb-4 opacity-75" style={{ maxWidth: '44rem' }}>
        {post.body}
      </p>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <span className="font-monospace small opacity-75">{formatPostDate(post.createdAt)}</span>
        {isOrganizer && <OrganizerControls post={post} inverted {...controls} />}
      </div>
    </Card>
  );
}

export function PostCard({ post, isNew, isOrganizer, ...controls }) {
  return (
    <Card as="article" className="h-100 shadow-sm" aria-labelledby={`post-${post.id}`}>
      <Card.Body className="d-flex flex-column gap-3">
        <PostMeta post={post} isNew={isNew} />
        <h3 id={`post-${post.id}`} className="fs-5 fw-bold mb-0">
          {post.title}
        </h3>
        <p className="text-body-secondary mb-0">{post.body}</p>
      </Card.Body>
      <Card.Footer className="d-flex flex-wrap align-items-center justify-content-between gap-2 bg-transparent">
        <span className="font-monospace small text-body-secondary">
          {formatPostDate(post.createdAt)}
        </span>
        {isOrganizer && <OrganizerControls post={post} {...controls} />}
      </Card.Footer>
    </Card>
  );
}
