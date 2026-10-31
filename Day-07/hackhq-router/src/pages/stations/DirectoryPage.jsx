import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import RouteBadge from '../../components/layout/RouteBadge.jsx';
import BackButton from '../../components/layout/BackButton.jsx';
import { Directory } from '../../components/directory/Directory.jsx';
import { UserPosts } from '../../components/directory/UserPosts.jsx';
import { parseUserId, userPath } from '../../lib/routes.js';

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
    <div className="station-view station-directory">
      <PageHeader breadcrumb="DIRECTORY" title="Attendee Directory" pill="Live API">
        <div className="page-header-actions">
          {rawUserId !== undefined && <BackButton fallback="/directory" />}
          <RouteBadge pattern="/directory/:userId?" />
        </div>
      </PageHeader>

      <div className="station-live-grid">
        <Directory selectedUserId={userId} onSelectUser={(id) => navigate(userPath(id))} />

        {isInvalidId ? (
          <div className="live-card">
            <div className="live-empty-box" role="alert">
              <UserX size={32} aria-hidden="true" />
              <div className="live-empty-title">Unknown participant</div>
              <div className="live-empty-desc">
                <code>{rawUserId}</code> is not a valid participant id.
              </div>
              <Link to="/directory" className="btn btn-secondary">
                Back to directory
              </Link>
            </div>
          </div>
        ) : (
          <UserPosts userId={userId} onClose={() => navigate('/directory')} />
        )}
      </div>
    </div>
  );
}
