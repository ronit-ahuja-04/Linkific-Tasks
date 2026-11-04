import { Link } from 'react-router-dom';
import styled from 'styled-components';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Button, Card, Grid, toneColors } from '../components/ui.jsx';

const TIMELINE = [
  {
    day: 'Day 5',
    title: 'State & events',
    text: 'Five stations built with useState and handlers.',
  },
  {
    day: 'Day 6',
    title: 'Effects & hooks',
    text: 'Live API, timers, persistence, five custom hooks.',
  },
  { day: 'Day 7', title: 'Routing', text: 'Real URLs, nested layouts, params and guards.' },
];

const Wrap = styled.div`
  max-width: 56rem;
  margin: 0 auto;
`;
const Section = styled(Card).attrs({ as: 'section' })`
  padding: 1.5rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 3rem;
  }
  h2 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    font-weight: 700;
  }
  > p {
    margin: 0;
    max-width: 42rem;
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const Steps = styled(Grid).attrs({ as: 'ol' })`
  list-style: none;
  margin: 1rem 0;
  padding: 0;
`;
const Step = styled.li`
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
`;
const Day = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.accent};
`;
const StepTitle = styled.strong`
  font-size: 1.25rem;
`;
const StepText = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Compare = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme, $tone }) => toneColors(theme, $tone).bg};
  border: 1px solid ${({ theme, $tone }) => toneColors(theme, $tone).fg}40;
  p {
    margin: 0;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
`;

export default function About() {
  return (
    <Wrap>
      <PageHeader breadcrumb="ABOUT" title="About HackHQ" pill="Static route" />

      <Section>
        <h2>The event</h2>
        <p>
          HackHQ is the day-of control room for a 24-hour hackathon: who has checked in, which teams
          are registered, what swag is left, and how long until demos.
        </p>
      </Section>

      <Steps $cols={{ base: 1, sm: 3 }} $gap={3}>
        {TIMELINE.map((step) => (
          <Step key={step.day}>
            <Day>{step.day}</Day>
            <StepTitle>{step.title}</StepTitle>
            <StepText>{step.text}</StepText>
          </Step>
        ))}
      </Steps>

      {/* CONCEPT: Link vs anchor - same destination, very different cost */}
      <Section aria-labelledby="link-vs-a">
        <h2 id="link-vs-a">
          {'<Link>'} vs {'<a>'}
        </h2>
        <p>
          Both go to Mission control. Open DevTools → Network, toggle State X-ray on, then try each
          one.
        </p>
        <Grid $cols={{ base: 1, md: 2 }} $gap={3} style={{ marginTop: '0.5rem' }}>
          <Compare $tone="good">
            <Button as={Link} to="/" $variant="primary">
              {'<Link to="/">'}
            </Button>
            <p>
              Calls <code>history.pushState</code>. No document request; X-ray and toasts survive.
            </p>
          </Compare>
          <Compare $tone="bad">
            {/* Deliberate full reload for the demo; every other internal link uses <Link> */}
            <Button as="a" href="/" $variant="secondary">
              {'<a href="/">'}
            </Button>
            <p>
              Browser requests a new document. The whole app reboots; only localStorage (theme,
              laps) survives.
            </p>
          </Compare>
        </Grid>
      </Section>
    </Wrap>
  );
}
