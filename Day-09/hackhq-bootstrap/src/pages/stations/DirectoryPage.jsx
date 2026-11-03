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
        <div className="flex flex-wrap items-center gap-2">
          {rawUserId !== undefined && <BackButton fallback="/directory" />}
          <RouteBadge pattern="/directory/:userId?" />
        </div>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Directory selectedUserId={userId} onSelectUser={(id) => navigate(userPath(id))} />

        {isInvalidId ? (
          <Card className="p-5 sm:p-6">
            <div
              className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2 p-8 text-center"
              role="alert"
            >
              <UserX size={32} aria-hidden="true" className="text-bad" />
              <div className="font-display text-base font-semibold">Unknown participant</div>
              <div className="text-sm text-muted">
                <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">
                  {rawUserId}
                </code>{' '}
                is not a valid participant id.
              </div>
              <Link
                to="/directory"
                className={buttonClass({ variant: 'secondary', className: 'mt-3' })}
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
