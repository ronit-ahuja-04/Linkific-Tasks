import styled, { css } from 'styled-components';
import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import { Badge, Board, Card, Mono } from '../ui.jsx';
import { animateRise } from '../../styles/animations.js';
import { CATEGORY_TONES, formatPostDate } from '../../lib/announcements.js';

const Group = styled.div`
  display: inline-flex;
  & > button {
    padding: 0.25rem 0.5rem;
    border-radius: 0;
    background: transparent;
    border: 1px solid
      ${({ theme, $inverted }) => ($inverted ? 'rgba(255,255,255,.6)' : theme.colors.line)};
    color: ${({ theme, $inverted }) => ($inverted ? '#fff' : theme.colors.muted)};
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
  }
  & > button + button {
    margin-left: -1px;
  }
  & > button:first-child {
    border-radius: ${({ theme }) => theme.radii.sm} 0 0 ${({ theme }) => theme.radii.sm};
  }
  & > button:last-child {
    border-radius: 0 ${({ theme }) => theme.radii.sm} ${({ theme }) => theme.radii.sm} 0;
  }
  & > button:hover,
  & > button[aria-pressed='true'] {
    background: ${({ theme, $inverted }) => ($inverted ? 'rgba(255,255,255,.18)' : theme.colors.surface2)};
    color: ${({ theme, $inverted }) => ($inverted ? '#fff' : theme.colors.ink)};
  }
  & > button:last-child:hover {
    ${({ theme, $inverted }) =>
      !$inverted &&
      css`
        background: ${theme.colors.bad};
        color: #fff;
      `}
  }
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;

const DateText = styled(Mono)`
  font-size: 0.875rem;
  color: ${({ theme, $inverted }) => ($inverted ? 'inherit' : theme.colors.muted)};
  ${({ $inverted }) => $inverted && 'opacity: .75;'}
`;

const Featured = styled(Board).attrs({ as: 'article' })`
  padding: ${({ theme }) => theme.space(4)};
  ${({ theme }) => theme.media.up('lg')} {
    padding: ${({ theme }) => theme.space(12)};
  }
  ${animateRise}
`;

const FeaturedTitle = styled.h2`
  font-size: calc(1.375rem + 1.5vw);
  ${({ theme }) => theme.media.up('xl')} {
    font-size: 2.5rem;
  }
  font-weight: 700;
  margin: ${({ theme }) => theme.space(3)} 0;
`;

const FeaturedBody = styled.p`
  font-size: 1.25rem;
  margin: 0 0 ${({ theme }) => theme.space(4)};
  opacity: 0.75;
  max-width: 44rem;
`;

const PostArticle = styled(Card).attrs({ as: 'article', $padded: false })`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PostBody = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
`;

const PostTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
`;

const PostText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const PostFooter = styled(Footer)`
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`;

function OrganizerControls({ post, onTogglePin, onEdit, onDelete, inverted }) {
  return (
    <Group role="group" $inverted={inverted} aria-label={`Manage "${post.title}"`}>
      <button
        type="button"
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
      </button>
      <button
        type="button"
        onClick={() => onEdit(post)}
        aria-label={`Edit "${post.title}"`}
        title="Edit"
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(post)}
        aria-label={`Delete "${post.title}"`}
        title="Delete"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </Group>
  );
}

function PostMeta({ post, isNew }) {
  return (
    <Meta>
      <Badge $tone={CATEGORY_TONES[post.category]}>{post.category}</Badge>
      {post.pinned && (
        <Badge $tone="warn">
          <Pin size={11} aria-hidden="true" />
          Pinned
        </Badge>
      )}
      {isNew && <Badge $tone="brand">New</Badge>}
    </Meta>
  );
}

/**
 * CONCEPT: Featured card - the latest pinned post gets a full-width dark panel above the grid.
 */
export function FeaturedPost({ post, isNew, isOrganizer, ...controls }) {
  return (
    <Featured aria-labelledby={`post-${post.id}`}>
      <PostMeta post={post} isNew={isNew} />
      <FeaturedTitle id={`post-${post.id}`}>{post.title}</FeaturedTitle>
      <FeaturedBody>{post.body}</FeaturedBody>
      <Footer>
        <DateText $inverted>{formatPostDate(post.createdAt)}</DateText>
        {isOrganizer && <OrganizerControls post={post} inverted {...controls} />}
      </Footer>
    </Featured>
  );
}

export function PostCard({ post, isNew, isOrganizer, ...controls }) {
  return (
    <PostArticle aria-labelledby={`post-${post.id}`}>
      <PostBody>
        <PostMeta post={post} isNew={isNew} />
        <PostTitle id={`post-${post.id}`}>{post.title}</PostTitle>
        <PostText>{post.body}</PostText>
      </PostBody>
      <PostFooter>
        <DateText>{formatPostDate(post.createdAt)}</DateText>
        {isOrganizer && <OrganizerControls post={post} {...controls} />}
      </PostFooter>
    </PostArticle>
  );
}
