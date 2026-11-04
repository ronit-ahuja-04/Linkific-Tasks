import styled, { css } from 'styled-components';
import { useFetch } from '../../hooks/useFetch.js';
import { buildUserPostsUrl } from '../../lib/api.js';
import ContentModal from '../ContentModal.jsx';
import { Badge, Button, Skeleton } from '../ui.jsx';
import { ErrorPanel } from './ErrorPanel.jsx';

const hidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const TitleWrap = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
`;
const FooterMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
`;
const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  border: 2px dashed ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: 1rem;
  padding: 1.5rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 3rem;
  }
  .title {
    font-weight: 600;
  }
  .desc {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  .icon {
    font-size: 2rem;
  }
`;
const Col = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
const SkeletonCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
`;
const Hidden = styled.span`
  ${hidden}
`;
const Post = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.bg};
  .title {
    font-weight: 600;
    text-transform: capitalize;
  }
  .body {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  .tags {
    margin-top: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

/**
 * User posts panel demonstrating dependency-driven refetching with useFetch.
 * Meets requirements UP-1, UP-2, and UP-3.
 * Shown in a modal while a participant id is present in the URL.
 */
export function UserPosts({ userId, onClose }) {
  const postsUrl = buildUserPostsUrl(userId);
  const { data, loading, error, refetch } = useFetch(postsUrl);

  const posts = data?.posts || [];

  return (
    <ContentModal
      show={Boolean(userId)}
      onHide={onClose}
      size="lg"
      title={
        <TitleWrap>
          Participant Posts
          {userId && <Badge $tone="accent">User #{userId}</Badge>}
        </TitleWrap>
      }
      footer={
        userId && data && !loading && !error ? (
          <FooterMeta>
            <span>
              {posts.length} post{posts.length === 1 ? '' : 's'} loaded
            </span>
            <span>Endpoint: /users/{userId}/posts</span>
          </FooterMeta>
        ) : (
          <Button $variant="secondary" $size="sm" onClick={onClose} title="Deselect participant">
            Clear selection ✕
          </Button>
        )
      }
    >
      {!userId ? (
        <Empty>
          <span className="icon" aria-hidden="true">
            👤
          </span>
          <div className="title">No participant selected</div>
          <div className="desc">
            Click any participant in the directory to inspect their posts and observe
            dependency-driven refetching.
          </div>
        </Empty>
      ) : error ? (
        <ErrorPanel message={error} onRetry={refetch} />
      ) : loading ? (
        <Col role="status" aria-live="polite" aria-busy="true" aria-label="Loading user posts">
          {[1, 2, 3].map((key) => (
            <SkeletonCard key={key}>
              <Skeleton $w="60%" $h="1rem" />
              <Skeleton $w="90%" $h="0.75rem" />
              <Skeleton $w="75%" $h="0.75rem" />
            </SkeletonCard>
          ))}
          <Hidden>Loading participant posts...</Hidden>
        </Col>
      ) : posts.length === 0 ? (
        <Empty>
          <div className="title">No posts published yet</div>
          <div className="desc">This participant has not submitted any posts.</div>
        </Empty>
      ) : (
        <Col>
          {posts.map((post) => (
            <Post key={post.id}>
              <div className="title">{post.title}</div>
              <div className="body">{post.body}</div>
              {post.tags && post.tags.length > 0 && (
                <div className="tags">
                  {post.tags.map((tag) => (
                    <Badge key={tag} $tone="accent">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Post>
          ))}
        </Col>
      )}
    </ContentModal>
  );
}
