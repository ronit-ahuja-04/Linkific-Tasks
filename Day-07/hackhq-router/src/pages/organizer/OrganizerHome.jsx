import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Code2, LogOut, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';

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
    <div className="station-view organizer-view">
      <PageHeader breadcrumb="ORGANIZER" title="Organizer area" pill="Guarded">
        <button type="button" className="btn btn-secondary back-button" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </PageHeader>

      <p className="organizer-intro">
        You got here through <code>&lt;ProtectedRoute isAllowed={'{isOrganizer}'} /&gt;</code>, a
        pathless layout route wrapping every <code>/organizer/*</code> page. Log out and try opening{' '}
        <code>/organizer/lab</code> directly: you will land on <code>/login</code>.
      </p>

      <ul className="home-grid">
        {ORGANIZER_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <li key={tool.path} style={{ '--i': index }}>
              <Link to={tool.path} className="home-card">
                <span className="home-card-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="home-card-badge">Guarded</span>
                <span className="home-card-name">{tool.name}</span>
                <span className="home-card-desc">{tool.description}</span>
                <span className="home-card-path">
                  <code>{tool.path}</code>
                  <ArrowRight size={16} aria-hidden="true" className="home-card-arrow" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
