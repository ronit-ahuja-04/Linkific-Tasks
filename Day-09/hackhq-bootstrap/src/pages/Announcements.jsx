import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, ButtonGroup, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { Megaphone, Plus, Search } from 'lucide-react';
import { Button } from '../components/ui.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ContentModal from '../components/ContentModal.jsx';
import AnnouncementForm from '../components/announcements/AnnouncementForm.jsx';
import { FeaturedPost, PostCard } from '../components/announcements/PostCard.jsx';
import {
  CATEGORIES,
  FORM_ID,
  countUnread,
  filterAnnouncements,
  getFeatured,
  sortAnnouncements,
} from '../lib/announcements.js';

/**
 * CONCEPT: Role-based UI - everyone reads the feed, only the organizer flag from App shows the
 * compose, edit, pin and delete controls. The real check would live on a server.
 * `composing` holds "what the modal is for" (null, 'new', or the id of the post being edited), so one
 * Modal serves create and edit.
 */
export default function Announcements({
  announcements,
  seenAt,
  isOrganizer,
  onMarkSeen,
  onAdd,
  onEdit,
  onRemove,
  onNotify,
}) {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Remember what was unread when this visit started, so "New" badges survive marking the feed as seen
  const [seenAtVisit] = useState(seenAt);
  const unreadAtVisit = countUnread(announcements, seenAtVisit);

  useEffect(() => {
    onMarkSeen();
  }, [onMarkSeen]);

  const visible = filterAnnouncements(announcements, { category, query });
  const featured = getFeatured(visible);
  const rest = sortAnnouncements(visible).filter((post) => post.id !== featured?.id);
  const isNew = (post) => seenAtVisit != null && post.createdAt > seenAtVisit;

  const editingPost =
    composing && composing !== 'new' ? announcements.find((post) => post.id === composing) : null;

  const handleSubmit = (draft) => {
    if (editingPost) {
      onEdit(editingPost.id, draft);
      onNotify('Announcement updated', null, 'success');
    } else {
      onAdd(draft);
      onMarkSeen();
      onNotify('Announcement published', null, 'success');
    }
    setComposing(null);
  };

  const handleTogglePin = (post) => {
    onEdit(post.id, { pinned: !post.pinned });
    onNotify(post.pinned ? 'Post unpinned' : 'Post pinned to the top', null, 'info');
  };

  const handleConfirmDelete = () => {
    onRemove(deleting.id);
    onNotify('Announcement deleted', null, 'info');
    setDeleting(null);
  };

  const controls = {
    isOrganizer,
    onTogglePin: handleTogglePin,
    onEdit: (post) => setComposing(post.id),
    onDelete: setDeleting,
  };

  return (
    <>
      <PageHeader
        breadcrumb="Announcements"
        title="Announcements"
        pill={unreadAtVisit > 0 ? `${unreadAtVisit} new` : 'Up to date'}
      >
        Updates from the organizers, with the latest pinned post up top.
      </PageHeader>

      <Row className="g-3 align-items-center mb-4">
        <Col xs={12} lg="auto" className="order-lg-1">
          {isOrganizer ? (
            <Button variant="primary" onClick={() => setComposing('new')} className="w-100">
              <Plus size={16} aria-hidden="true" />
              New announcement
            </Button>
          ) : null}
        </Col>
        <Col xs={12} lg className="order-lg-0 overflow-x-auto">
          <ButtonGroup aria-label="Filter by category" className="text-nowrap">
            {['all', ...CATEGORIES].map((name) => (
              <Button
                key={name}
                variant={category === name ? 'dark' : 'secondary'}
                size="sm"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name === 'all' ? 'All' : name}
              </Button>
            ))}
          </ButtonGroup>
        </Col>
        <Col xs={12} lg={4} className="order-lg-2">
          <InputGroup>
            <InputGroup.Text>
              <Search size={16} aria-hidden="true" />
            </InputGroup.Text>
            <Form.Control
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search announcements"
              aria-label="Search announcements"
            />
          </InputGroup>
        </Col>
      </Row>

      {!isOrganizer && (
        <Alert variant="secondary" className="small py-2 d-flex align-items-center gap-2">
          <Megaphone size={16} aria-hidden="true" />
          <span>
            Only organizers can post. <Link to="/login">Log in as an organizer</Link> to compose.
          </span>
        </Alert>
      )}

      {visible.length === 0 ? (
        <Alert variant="secondary" className="text-center py-4">
          <p className="mb-2 fw-medium">No announcements match.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCategory('all');
              setQuery('');
            }}
          >
            Reset filters
          </Button>
        </Alert>
      ) : (
        <>
          {featured && (
            <div className="mb-4">
              <FeaturedPost post={featured} isNew={isNew(featured)} {...controls} />
            </div>
          )}
          {/* CONCEPT: row-cols - one class sets how many cards sit in each row at each breakpoint */}
          <Row xs={1} md={2} xl={3} className="g-3">
            {rest.map((post) => (
              <Col key={post.id}>
                <PostCard post={post} isNew={isNew(post)} {...controls} />
              </Col>
            ))}
          </Row>
        </>
      )}

      <ContentModal
        show={composing !== null}
        onHide={() => setComposing(null)}
        title={editingPost ? 'Edit announcement' : 'New announcement'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setComposing(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form={FORM_ID}>
              {editingPost ? 'Save changes' : 'Publish'}
            </Button>
          </>
        }
      >
        <AnnouncementForm post={editingPost} onSubmit={handleSubmit} />
      </ContentModal>

      <ContentModal
        show={deleting !== null}
        onHide={() => setDeleting(null)}
        title="Delete announcement?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="mb-0">
          <strong>{deleting?.title}</strong> will be removed from the feed.
        </p>
      </ContentModal>
    </>
  );
}
