import { Link, useNavigate } from 'react-router-dom';
import { Card, Col, Row } from 'react-bootstrap';
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

      <p className="mb-4 text-body-secondary" style={{ maxWidth: '42rem' }}>
        You got here through <code>&lt;ProtectedRoute isAllowed={'{isOrganizer}'} /&gt;</code>, a
        pathless layout route wrapping every <code>/organizer/*</code> page. Log out and try opening{' '}
        <code>/organizer/lab</code> directly: you will land on <code>/login</code>.
      </p>

      <Row as="ul" className="list-unstyled g-3 p-0" xs={1} md={2}>
        {ORGANIZER_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Col
              as="li"
              key={tool.path}
              className="animate-rise"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <Card
                as={Link}
                to={tool.path}
                className="h-100 p-4 shadow-sm text-body text-decoration-none position-relative"
              >
                <span
                  className="mb-3 d-flex align-items-center justify-content-center rounded-3 bg-brand"
                  style={{ width: 44, height: 44 }}
                  aria-hidden="true"
                >
                  <Icon size={20} />
                </span>
                <Badge tone="accent" className="position-absolute top-0 end-0 m-3">
                  Guarded
                </Badge>
                <span className="fs-5 fw-bold">{tool.name}</span>
                <span className="small text-body-secondary mt-1">{tool.description}</span>
                <span className="mt-3 d-flex align-items-center justify-content-between small font-monospace text-body-secondary">
                  <code>{tool.path}</code>
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
