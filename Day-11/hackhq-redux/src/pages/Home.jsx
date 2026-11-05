import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowRight, ArrowUpRight, Radio } from 'lucide-react';
import { STATIONS } from '../data/stations.js';
import { Badge, Board, Button, Card, Eyebrow, Grid } from '../components/ui.jsx';
import { animateFloat, animateRise } from '../styles/animations.js';

const DESTINATIONS = STATIONS.filter((station) => station.path !== '/');

const STATS = [
  { label: 'Stations', value: STATIONS.length },
  { label: 'Hours on the clock', value: 24 },
  { label: 'Page reloads', value: 0 },
];

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;
const Hero = styled(Board)`
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  padding: 3rem 1.5rem;
  ${animateRise}
  ${({ theme }) => theme.media.up('sm')} {
    padding-left: 3rem;
    padding-right: 3rem;
  }
`;
const Grid44 = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image:
    linear-gradient(to right, white 1px, transparent 1px),
    linear-gradient(to bottom, white 1px, transparent 1px);
  background-size: 44px 44px;
`;
const GlowBrand = styled.div`
  position: absolute;
  top: -6rem;
  right: -6rem;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.brand};
  opacity: 0.25;
  filter: blur(64px);
  ${animateFloat}
`;
const GlowAccent = styled.div`
  position: absolute;
  bottom: -8rem;
  left: 33%;
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  opacity: 0.3;
  filter: blur(64px);
`;
const HeroInner = styled.div`
  position: relative;
  max-width: 48rem;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 1.5rem 0;
  }
`;
const HeroBadge = styled(Badge)`
  margin-bottom: 1.5rem;
`;
const Title = styled.h1`
  margin: 0;
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: -0.04em;
  font-size: 2.5rem;
  ${({ theme }) => theme.media.up('md')} {
    font-size: 4.5rem;
  }
`;
const Accent = styled.span`
  color: ${({ theme }) => theme.colors.brand};
`;
const Lead = styled.p`
  margin: 1.5rem 0 0;
  max-width: 36rem;
  font-size: 1.25rem;
  opacity: 0.75;
`;
const Cta = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;
const GhostLink = styled(Button)`
  color: #fff;
  border-color: rgb(248 249 250 / 0.25);
`;
const Stats = styled(Grid)`
  margin: 1.5rem 0 0;
  padding-top: 1.5rem;
  max-width: 32rem;
  border-top: 1px solid rgb(248 249 250 / 0.1);
  dd {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    font-family: ${({ theme }) => theme.fonts.mono};
  }
  dt {
    margin-top: 0.25rem;
    font-weight: 400;
    font-size: 0.875rem;
    opacity: 0.75;
  }
`;
const SectionHead = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  ${Eyebrow} {
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    letter-spacing: 0.18em;
  }
  h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }
`;
const Cards = styled(Grid).attrs({ as: 'ul' })`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const Item = styled.li`
  min-width: 0;
  ${animateRise}
`;
const StationCard = styled(Card).attrs({ as: Link })`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
  }
  p {
    margin: 0;
    flex-grow: 1;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const CardTop = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;
const IconBox = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface2};
`;
const CardFoot = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  code {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  svg {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

// CONCEPT: Index route - what the layout shows at its own URL ("/")
export default function Home() {
  return (
    <Page>
      <Hero as="section" aria-labelledby="home-hero-title">
        {/* Decorative grid + glow */}
        <Grid44 aria-hidden="true" />
        <GlowBrand aria-hidden="true" />
        <GlowAccent aria-hidden="true" />

        <HeroInner>
          <HeroBadge $tone="brand">
            <Radio size={12} aria-hidden="true" />
            Day 10 · styled-components
          </HeroBadge>
          <Title id="home-hero-title">
            Run the whole hackathon from <Accent>one control room.</Accent>
          </Title>
          <Lead>
            Check-ins, teams, swag, a stopwatch for demo day. Every station has its own address, now
            wrapped in a faster, sharper interface.
          </Lead>
          <Cta>
            <Button as={Link} to="/directory" $size="lg">
              Open the directory
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <GhostLink as={Link} to="/sponsors" $variant="ghost" $size="lg">
              Become a sponsor
            </GhostLink>
          </Cta>

          {/* CONCEPT: three equal stat columns at every width */}
          <Stats as="dl" $cols={3} $gap={6}>
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd>{stat.value}</dd>
                <dt>{stat.label}</dt>
              </div>
            ))}
          </Stats>
        </HeroInner>
      </Hero>

      <section aria-labelledby="stations-title">
        <SectionHead>
          <div>
            <Eyebrow>Every station</Eyebrow>
            <h2 id="stations-title">Pick a station</h2>
          </div>
        </SectionHead>

        <Cards $cols={{ base: 1, md: 2, xl: 3 }} $gap={3}>
          {DESTINATIONS.map((station, index) => {
            const Icon = station.icon;
            return (
              <Item key={station.id} style={{ animationDelay: `${index * 45}ms` }}>
                <StationCard to={station.path} $interactive>
                  <CardTop>
                    <IconBox aria-hidden="true">
                      <Icon size={20} />
                    </IconBox>
                    <Badge>{station.badge}</Badge>
                  </CardTop>
                  <h3>{station.name}</h3>
                  <p>{station.description}</p>
                  <CardFoot>
                    <code>{station.path}</code>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </CardFoot>
                </StationCard>
              </Item>
            );
          })}
        </Cards>
      </section>
    </Page>
  );
}
