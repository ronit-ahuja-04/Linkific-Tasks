import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Code2, LogOut, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { Badge, Button } from '../../components/ui.jsx';

const ORGANIZER_TOOLS = [
  {
    path: '/organizer/checkin',
    name: 'Check-in',
    icon: Users,
    description: 'Split-flap headcount against venue capacity.',
  },
  {
    path: '/organizer/lab',
    name: 'State lab',
    icon: Code2,
    description: 'Mutation and batching experiments with a live state inspector.',
  },
];

// Index route of the guarded /organizer area
export default function OrganizerHome({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/', { replace: true });
  };

  return (
    <div>
      <PageHeader breadcrumb="ORGANIZER" title="Organizer area" pill="Guarded">
        <Button variant="secondary" size="sm" className="mt-1" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </Button>
      </PageHeader>

      <p className="mb-8 max-w-2xl text-muted [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_code]:text-ink">
        You got here through <code>&lt;ProtectedRoute isAllowed={'{isOrganizer}'} /&gt;</code>, a
        pathless layout route wrapping every <code>/organizer/*</code> page. Log out and try opening{' '}
        <code>/organizer/lab</code> directly: you will land on <code>/login</code>.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {ORGANIZER_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <li
              key={tool.path}
              className="animate-rise"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <Link
                to={tool.path}
                className="group relative flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-6 shadow-card transition hover:-translate-y-0.5 hover:border-ink hover:shadow-pop"
              >
                <span
                  className="mb-2 flex size-11 items-center justify-center rounded-xl bg-brand text-on-brand"
                  aria-hidden="true"
                >
                  <Icon size={20} />
                </span>
                <Badge tone="accent" className="absolute right-5 top-5">
                  Guarded
                </Badge>
                <span className="font-display text-xl font-bold tracking-tight">{tool.name}</span>
                <span className="text-sm text-muted">{tool.description}</span>
                <span className="mt-3 flex items-center justify-between font-mono text-xs text-muted">
                  <code>{tool.path}</code>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition group-hover:translate-x-1 group-hover:text-ink"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
