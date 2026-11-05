import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import RouteBadge from '../../components/layout/RouteBadge.jsx';
import BackButton from '../../components/layout/BackButton.jsx';
import { Directory } from '../../components/directory/Directory.jsx';
import { UserPosts } from '../../components/directory/UserPosts.jsx';
import styled from 'styled-components';
import { Button, Card, Stack } from '../../components/ui.jsx';
import { parseUserId, userPath } from '../../lib/routes.js';

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
  svg {
    color: ${({ theme }) => theme.colors.bad};
  }
  .title {
    font-weight: 600;
  }
  .desc {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  a {
    margin-top: 0.5rem;
  }
`;
const Code = styled.code`
  border-radius: 0.25rem;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  padding: 0.25rem 0.5rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
`;

/**
 * CONCEPT: Optional param - "/directory" and "/directory/3" match the same route,
 * so Directory stays mounted (search text survives) while the URL picks the user.
 */
export default function DirectoryPage() {
  const { userId: rawUserId } = useParams();
  const navigate = useNavigate();

  // The URL is the single source of truth for the selected participant
  const userId = parseUserId(rawUserId);
  const isInvalidId = rawUserId !== undefined && userId === null;

  return (
    <div>
      <PageHeader breadcrumb="DIRECTORY" title="Attendee Directory" pill="Live API">
        <Stack $dir="row" $wrap $align="center" $gap={2}>
          {rawUserId !== undefined && <BackButton fallback="/directory" />}
          <RouteBadge pattern="/directory/:userId?" />
        </Stack>
      </PageHeader>

      <Stack $gap={4}>
        <Directory selectedUserId={userId} onSelectUser={(id) => navigate(userPath(id))} />

        {isInvalidId ? (
          <Card>
            <Empty role="alert">
              <UserX size={32} aria-hidden="true" />
              <div className="title">Unknown participant</div>
              <div className="desc">
                <Code>{rawUserId}</Code> is not a valid participant id.
              </div>
              <Button as={Link} to="/directory" $variant="secondary">
                Back to directory
              </Button>
            </Empty>
          </Card>
        ) : (
          <UserPosts userId={userId} onClose={() => navigate('/directory')} />
        )}
      </Stack>
    </div>
  );
}
