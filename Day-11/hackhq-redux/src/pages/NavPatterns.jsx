import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CornerDownRight, Repeat, Undo2 } from 'lucide-react';
import styled, { css } from 'styled-components';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Button, Card, Grid, Stack } from '../components/ui.jsx';
import { buttonStyles } from '../components/ui.jsx';
import { animateRise } from '../styles/animations.js';

const StackWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.space(4)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`;
const Entry = styled.span`
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.line};
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(2)}`};
  font-size: 0.875em;
  font-family: ${({ theme }) => theme.fonts.mono};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.muted};
  ${({ $last }) =>
    $last &&
    css`
      border-color: transparent;
      background: ${({ theme }) => theme.colors.brand};
      color: ${({ theme }) => theme.colors.onBrand};
    `}
  ${({ $struck }) =>
    $struck &&
    css`
      text-decoration: line-through;
      opacity: 0.5;
    `}
`;
const Note = styled.span`
  margin-left: ${({ theme }) => theme.space(1)};
  font-family: ${({ theme }) => theme.fonts.mono};
  text-transform: uppercase;
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Intro = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  max-width: 42rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const DemoCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: ${({ theme }) => theme.space(4)};
  ${animateRise}
  animation-delay: ${({ $delay }) => $delay};
`;
const CardHead = styled.header`
  margin-bottom: ${({ theme }) => theme.space(3)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
`;
const IconBox = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accent};
`;
const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
`;
const Snippet = styled.pre`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  overflow-x: auto;
  max-width: 100%;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(3)}`};
  font-size: 0.875em;
  font-family: ${({ theme }) => theme.fonts.mono};
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.brand};
`;
const Desc = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  font-size: 0.875em;
  color: ${({ theme }) => theme.colors.muted};
`;
const LinkButton = styled(Link)`
  ${buttonStyles}
`;

/** Mini history-stack diagram: the last entry is where you end up. */
function HistoryStack({ entries, note }) {
  return (
    <StackWrap aria-label={`History afterwards: ${entries.join(', ')}`}>
      {entries.map((entry, index) => (
        <Entry
          key={`${entry}-${index}`}
          $last={index === entries.length - 1}
          $struck={entry.startsWith('~')}
        >
          {entry.replace('~', '')}
        </Entry>
      ))}
      {note && <Note>{note}</Note>}
    </StackWrap>
  );
}

function Demo({ icon: Icon, title, code, delay, children }) {
  return (
    <DemoCard as="article" $delay={delay}>
      <CardHead>
        <IconBox aria-hidden="true">
          <Icon size={18} />
        </IconBox>
        <CardTitle>{title}</CardTitle>
      </CardHead>
      <Snippet>{code}</Snippet>
      {children}
    </DemoCard>
  );
}

export default function NavPatterns() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader breadcrumb="PATTERNS / NAVIGATION" title="Navigation Patterns" pill="4 demos" />

      <Intro>
        Every button below calls <code>useNavigate()</code> from a click handler. Try each one, then
        press your browser&apos;s Back button and compare it with the diagram.
      </Intro>

      <Grid $cols={{ base: 1, md: 2 }} $gap={3}>
        <Demo icon={ArrowRight} title="Push" code="navigate('/swag')" delay="0ms">
          <Desc>Adds a new history entry. Back returns to this page.</Desc>
          <HistoryStack entries={['…', 'navigation', '/swag']} note="Back → navigation" />
          <Button onClick={() => navigate('/swag')}>Push to /swag</Button>
        </Demo>

        <Demo
          icon={Repeat}
          title="Replace"
          code="navigate('/swag', { replace: true })"
          delay="70ms"
        >
          <Desc>Overwrites the current entry. Back skips this page entirely.</Desc>
          <HistoryStack entries={['…', '~navigation', '/swag']} note="Back → before navigation" />
          <Button onClick={() => navigate('/swag', { replace: true })}>Replace with /swag</Button>
        </Demo>

        <Demo icon={Undo2} title="Back & Forward" code="navigate(-1) · navigate(1)" delay="140ms">
          <Desc>
            Moves through existing entries without creating new ones, like the browser arrows.
          </Desc>
          <HistoryStack entries={['…', 'previous', 'navigation', 'next?']} />
          <Stack $dir="row" $gap={2} $wrap>
            <Button $variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back</span>
            </Button>
            <Button $variant="secondary" onClick={() => navigate(1)}>
              <span>Forward</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </Stack>
        </Demo>

        <Demo
          icon={CornerDownRight}
          title="Declarative redirect"
          code={'<Navigate to="/swag" replace />'}
          delay="210ms"
        >
          <Desc>
            The old <code>/shop</code> URL renders a <code>&lt;Navigate&gt;</code> during render, so
            it is never kept in history.
          </Desc>
          <HistoryStack entries={['…', 'navigation', '~/shop', '/swag']} note="Back → navigation" />
          <LinkButton to="/shop" $variant="primary">
            Visit legacy /shop
          </LinkButton>
        </Demo>
      </Grid>
    </div>
  );
}
