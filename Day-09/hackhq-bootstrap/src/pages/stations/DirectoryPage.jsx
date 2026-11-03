import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import RouteBadge from '../../components/layout/RouteBadge.jsx';
import BackButton from '../../components/layout/BackButton.jsx';
import { Directory } from '../../components/directory/Directory.jsx';
import { UserPosts } from '../../components/directory/UserPosts.jsx';
import { buttonClass, Card } from '../../components/ui.jsx';
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
    <div>
      <PageHeader breadcrumb="DIRECTORY" title="Attendee Directory" pill="Live API">
        <div className="d-flex flex-wrap align-items-center gap-2">
          {rawUserId !== undefined && <BackButton fallback="/directory" />}
          <RouteBadge pattern="/directory/:userId?" />
        </div>
      </PageHeader>

      <div className="d-flex flex-column gap-4">
        <Directory selectedUserId={userId} onSelectUser={(id) => navigate(userPath(id))} />

        {isInvalidId ? (
          <Card>
            <div
              className="d-flex flex-column align-items-center gap-2 rounded-4 border border-dashed bg-body-tertiary p-4 p-sm-5 text-center"
              role="alert"
            >
              <UserX size={32} aria-hidden="true" className="text-danger" />
              <div className="fw-semibold">Unknown participant</div>
              <div className="small text-body-secondary">
                <code className="rounded bg-body px-2 py-1 font-monospace small text-body">
                  {rawUserId}
                </code>{' '}
                is not a valid participant id.
              </div>
              <Link
                to="/directory"
                className={buttonClass({ variant: 'secondary', className: 'mt-2' })}
              >
                Back to directory
              </Link>
            </div>
          </Card>
        ) : (
          <UserPosts userId={userId} onClose={() => navigate('/directory')} />
        )}
      </div>
    </div>
  );
}
