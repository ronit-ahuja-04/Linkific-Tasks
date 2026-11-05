import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Megaphone, Plus, Search } from 'lucide-react';
import { Alert, Button, Grid, Input } from '../components/ui.jsx';
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
import {
  markSeen,
  postAdded,
  postEdited,
  postRemoved,
  selectAnnouncements,
  selectSeenAt,
} from '../store/slices/announcementsSlice.js';
import { selectIsOrganizer } from '../store/slices/authSlice.js';
import { notify } from '../store/slices/toastsSlice.js';

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('lg')} {
    flex-direction: row;
    align-items: center;
  }
`;
const ComposeSlot = styled.div`
  ${({ theme }) => theme.media.up('lg')} {
    order: 1;
  }
`;
const FilterSlot = styled.div`
  min-width: 0;
  overflow-x: auto;
  ${({ theme }) => theme.media.up('lg')} {
    order: 0;
    flex: 1 1 0;
  }
`;
const SearchSlot = styled.div`
  ${({ theme }) => theme.media.up('lg')} {
    order: 2;
    flex: 0 0 33.333%;
  }
`;
const Segmented = styled.div`
  display: inline-flex;
  white-space: nowrap;
  & > button {
    border-radius: 0;
  }
  & > button + button {
    margin-left: -1px;
  }
  & > button:first-child {
    border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
  }
  & > button:last-child {
    border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
  }
`;
const SearchGroup = styled.div`
  display: flex;
`;
const SearchIcon = styled.span`
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-right: 0;
  border-radius: ${({ theme }) => theme.radii.md} 0 0 ${({ theme }) => theme.radii.md};
`;
const SearchInput = styled(Input)`
  border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
`;
const Notice = styled(Alert)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.space(4)};
  a {
    color: inherit;
    font-weight: 600;
  }
`;
const EmptyAlert = styled(Alert)`
  text-align: center;
  padding: 1.5rem 1rem;
`;
const EmptyText = styled.p`
  margin: 0 0 0.5rem;
  font-weight: 500;
`;
const FeaturedWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.space(4)};
`;
const NoMargin = styled.p`
  margin: 0;
`;

/**
 * CONCEPT: Role-based UI - everyone reads the feed, only the organizer flag from App shows the
 * compose, edit, pin and delete controls. The real check would live on a server.
 * `composing` holds "what the modal is for" (null, 'new', or the id of the post being edited), so one
 * Modal serves create and edit.
 */
export default function Announcements() {
  // REDUX: useSelector reads slices, useDispatch writes (actions + the notify thunk)
  const dispatch = useDispatch();
  const announcements = useSelector(selectAnnouncements);
  const seenAt = useSelector(selectSeenAt);
  const isOrganizer = useSelector(selectIsOrganizer);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Remember what was unread when this visit started, so "New" badges survive marking the feed as seen
  const [seenAtVisit] = useState(seenAt);
  const unreadAtVisit = countUnread(announcements, seenAtVisit);

  useEffect(() => {
    dispatch(markSeen());
  }, [dispatch]);

  const visible = filterAnnouncements(announcements, { category, query });
  const featured = getFeatured(visible);
  const rest = sortAnnouncements(visible).filter((post) => post.id !== featured?.id);
  const isNew = (post) => seenAtVisit != null && post.createdAt > seenAtVisit;

  const editingPost =
    composing && composing !== 'new' ? announcements.find((post) => post.id === composing) : null;

  const handleSubmit = (draft) => {
    if (editingPost) {
      dispatch(postEdited({ id: editingPost.id, fields: draft }));
      dispatch(notify('Announcement updated', null, 'success'));
    } else {
      dispatch(postAdded(draft));
      dispatch(markSeen());
      dispatch(notify('Announcement published', null, 'success'));
    }
    setComposing(null);
  };

  const handleTogglePin = (post) => {
    dispatch(postEdited({ id: post.id, fields: { pinned: !post.pinned } }));
    dispatch(notify(post.pinned ? 'Post unpinned' : 'Post pinned to the top', null, 'info'));
  };

  const handleConfirmDelete = () => {
    dispatch(postRemoved(deleting.id));
    dispatch(notify('Announcement deleted', null, 'info'));
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

      <Toolbar>
        <ComposeSlot>
          {isOrganizer ? (
            <Button $variant="primary" $block onClick={() => setComposing('new')}>
              <Plus size={16} aria-hidden="true" />
              New announcement
            </Button>
          ) : null}
        </ComposeSlot>
        <FilterSlot>
          <Segmented role="group" aria-label="Filter by category">
            {['all', ...CATEGORIES].map((name) => (
              <Button
                key={name}
                $variant={category === name ? 'dark' : 'secondary'}
                $size="sm"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                {name === 'all' ? 'All' : name}
              </Button>
            ))}
          </Segmented>
        </FilterSlot>
        <SearchSlot>
          <SearchGroup>
            <SearchIcon>
              <Search size={16} aria-hidden="true" />
            </SearchIcon>
            <SearchInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search announcements"
              aria-label="Search announcements"
            />
          </SearchGroup>
        </SearchSlot>
      </Toolbar>

      {!isOrganizer && (
        <Notice $tone="neutral">
          <Megaphone size={16} aria-hidden="true" />
          <span>
            Only organizers can post. <Link to="/login">Log in as an organizer</Link> to compose.
          </span>
        </Notice>
      )}

      {visible.length === 0 ? (
        <EmptyAlert $tone="neutral">
          <EmptyText>No announcements match.</EmptyText>
          <Button
            $variant="secondary"
            $size="sm"
            onClick={() => {
              setCategory('all');
              setQuery('');
            }}
          >
            Reset filters
          </Button>
        </EmptyAlert>
      ) : (
        <>
          {featured && (
            <FeaturedWrap>
              <FeaturedPost post={featured} isNew={isNew(featured)} {...controls} />
            </FeaturedWrap>
          )}
          <Grid $cols={{ base: 1, md: 2, xl: 3 }} $gap={3}>
            {rest.map((post) => (
              <PostCard key={post.id} post={post} isNew={isNew(post)} {...controls} />
            ))}
          </Grid>
        </>
      )}

      <ContentModal
        show={composing !== null}
        onHide={() => setComposing(null)}
        title={editingPost ? 'Edit announcement' : 'New announcement'}
        footer={
          <>
            <Button $variant="secondary" onClick={() => setComposing(null)}>
              Cancel
            </Button>
            <Button $variant="primary" type="submit" form={FORM_ID}>
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
            <Button $variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button $variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <NoMargin>
          <strong>{deleting?.title}</strong> will be removed from the feed.
        </NoMargin>
      </ContentModal>
    </>
  );
}
