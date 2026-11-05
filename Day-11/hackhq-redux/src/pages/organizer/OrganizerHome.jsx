import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowRight, Code2, LogOut, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { Badge, Button, Card, Grid } from '../../components/ui.jsx';
import { animateRise } from '../../styles/animations.js';

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

const Intro = styled.p`
  margin: 0 0 1.5rem;
  max-width: 42rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Tools = styled(Grid).attrs({ as: 'ul' })`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const Item = styled.li`
  min-width: 0;
  ${animateRise}
`;
const ToolCard = styled(Card).attrs({ as: Link })`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
`;
const IconBox = styled.span`
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
`;
const Corner = styled(Badge)`
  position: absolute;
  top: 0;
  right: 0;
  margin: 1rem;
`;
const ToolName = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
`;
const ToolDesc = styled.span`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const ToolPath = styled.span`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const LogoutBtn = styled(Button)`
  margin-top: 0.25rem;
`;

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
        <LogoutBtn $variant="secondary" $size="sm" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </LogoutBtn>
      </PageHeader>

      <Intro>
        You got here through <code>&lt;ProtectedRoute isAllowed={'{isOrganizer}'} /&gt;</code>, a
        pathless layout route wrapping every <code>/organizer/*</code> page. Log out and try opening{' '}
        <code>/organizer/lab</code> directly: you will land on <code>/login</code>.
      </Intro>

      <Tools $cols={{ base: 1, md: 2 }} $gap={3}>
        {ORGANIZER_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Item key={tool.path} style={{ animationDelay: `${index * 70}ms` }}>
              <ToolCard to={tool.path} $interactive>
                <IconBox aria-hidden="true">
                  <Icon size={20} />
                </IconBox>
                <Corner $tone="accent">Guarded</Corner>
                <ToolName>{tool.name}</ToolName>
                <ToolDesc>{tool.description}</ToolDesc>
                <ToolPath>
                  <code>{tool.path}</code>
                  <ArrowRight size={16} aria-hidden="true" />
                </ToolPath>
              </ToolCard>
            </Item>
          );
        })}
      </Tools>
    </div>
  );
}
