import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import styled, { css } from 'styled-components';
import { Badge, Button, Card, Grid } from '../components/ui.jsx';
import { animateRise } from '../styles/animations.js';

const TIERS = [
  {
    id: 'community',
    name: 'Community',
    price: 500,
    blurb: 'Show up, support builders, get your logo on the wall.',
    perks: {
      logo: true,
      booth: false,
      mentors: 0,
      challenge: false,
      recruiting: false,
    },
  },
  {
    id: 'builder',
    name: 'Builder',
    price: 2500,
    blurb: 'A booth, two mentors and a challenge track of your own.',
    featured: true,
    perks: {
      logo: true,
      booth: true,
      mentors: 2,
      challenge: true,
      recruiting: false,
    },
  },
  {
    id: 'title',
    name: 'Title',
    price: 7500,
    blurb: 'Your name on the event, the stage and every shirt.',
    perks: {
      logo: true,
      booth: true,
      mentors: 5,
      challenge: true,
      recruiting: true,
    },
  },
];

const FEATURES = [
  { key: 'logo', label: 'Logo on banners and site' },
  { key: 'booth', label: 'Sponsor booth' },
  { key: 'mentors', label: 'Mentors on the floor' },
  { key: 'challenge', label: 'Dedicated challenge track' },
  { key: 'recruiting', label: 'Recruiting session + résumé book' },
];

const money = (value) => `$${value.toLocaleString('en-US')}`;

const Check_ = styled(Check)`
  color: ${({ theme }) => theme.colors.good};
`;
const Dash = styled(Minus)`
  color: ${({ theme }) => theme.colors.muted};
  opacity: 0.6;
`;
const Count = styled.span`
  font-weight: 600;
`;

function Perk({ value }) {
  if (typeof value === 'number') {
    return value > 0 ? <Count>{value}</Count> : <Dash size={16} aria-label="Not included" />;
  }
  return value ? (
    <Check_ size={18} aria-label="Included" strokeWidth={3} />
  ) : (
    <Dash size={16} aria-label="Not included" />
  );
}

const TierList = styled(Grid).attrs({ as: 'ul', $cols: { base: 1, md: 3 }, $gap: 4 })`
  list-style: none;
  margin: 0;
  padding: 0.5rem 0 0;
`;
const TierItem = styled.li`
  ${animateRise}
  animation-delay: ${({ $i }) => $i * 70}ms;
  min-width: 0;
`;
const featuredCard = css`
  background: ${({ theme }) => theme.colors.board};
  color: ${({ theme }) => theme.colors.onBoard};
  border-color: transparent;
`;
const TierCard = styled(Card).attrs({ as: 'article', $padded: false })`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space(4)};
  position: relative;
  ${({ $featured }) => $featured && featuredCard}
`;
const PopularBadge = styled(Badge)`
  position: absolute;
  left: 0;
  margin-left: ${({ theme }) => theme.space(4)};
  top: -0.75rem;
`;
const TierName = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
`;
const Soft = styled.span`
  ${({ $featured, theme }) => ($featured ? 'opacity: .75;' : `color: ${theme.colors.muted};`)}
`;
const Blurb = styled.p`
  margin: 0;
  font-size: 0.875rem;
  ${({ $featured, theme }) => ($featured ? 'opacity: .75;' : `color: ${theme.colors.muted};`)}
`;
const Price = styled.p`
  margin: ${({ theme }) => theme.space(4)} 0 0;
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(1)};
`;
const PriceValue = styled.span`
  font-size: calc(1.425rem + 2.1vw);
  ${({ theme }) => theme.media.up('xl')} {
    font-size: 3rem;
  }
  font-weight: 700;
  line-height: 1.2;
`;
const Perks = styled.ul`
  list-style: none;
  margin: ${({ theme }) => theme.space(4)} 0 0;
  padding: 0;
  flex-grow: 1;
  font-size: 0.875rem;
  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    padding: 0.5rem 0;
    border-top: 1px solid
      ${({ theme, $featured }) => ($featured ? 'rgba(255,255,255,.2)' : theme.colors.line)};
  }
  li:first-child {
    border-top: 0;
  }
  svg {
    flex-shrink: 0;
  }
`;
const ChooseButton = styled(Button).attrs({ as: Link, $block: true })`
  margin-top: ${({ theme }) => theme.space(4)};
`;

const Compare = styled.section`
  margin-top: ${({ theme }) => theme.space(12)};
  padding-top: ${({ theme }) => theme.space(3)};
`;
const CompareTitle = styled.h2`
  font-size: calc(1.3rem + 0.6vw);
  ${({ theme }) => theme.media.up('xl')} {
    font-size: 1.75rem;
  }
  font-weight: 700;
  margin: 0 0 ${({ theme }) => theme.space(3)};
`;
const TableScroll = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow};
  background: ${({ theme }) => theme.colors.surface};
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  vertical-align: middle;
  th,
  td {
    padding: 1rem 1.5rem;
    vertical-align: middle;
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
  thead th {
    border-top: 0;
  }
  tbody tr:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
  th {
    font-weight: 500;
    text-align: left;
  }
  thead th[scope='col']:not(:first-child) {
    text-align: center;
    font-weight: 700;
  }
  thead th:first-child {
    color: ${({ theme }) => theme.colors.muted};
  }
`;
const Caption = styled.caption`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;
const Centered = styled.span`
  display: flex;
  justify-content: center;
`;

export default function Sponsors() {
  return (
    <div>
      <PageHeader breadcrumb="Sponsors" title="Sponsor the build" pill="Applications open">
        Three tiers, no hidden fees. Every dollar funds food, prizes and venue for the people
        building.
      </PageHeader>

      {/* Tier cards */}
      <TierList>
        {TIERS.map((tier, index) => (
          <TierItem key={tier.id} $i={index}>
            <TierCard $featured={tier.featured}>
              {tier.featured && <PopularBadge $tone="brand">Most popular</PopularBadge>}
              <TierName>{tier.name}</TierName>
              <Blurb $featured={tier.featured}>{tier.blurb}</Blurb>
              <Price>
                <PriceValue>{money(tier.price)}</PriceValue>
                <Soft $featured={tier.featured}>/ event</Soft>
              </Price>

              <Perks $featured={tier.featured}>
                {FEATURES.filter((f) => tier.perks[f.key]).map((feature) => (
                  <li key={feature.key}>
                    <Check_ size={16} strokeWidth={3} aria-hidden="true" />
                    <span>
                      {typeof tier.perks[feature.key] === 'number' && `${tier.perks[feature.key]} `}
                      {feature.label}
                    </span>
                  </li>
                ))}
              </Perks>

              <ChooseButton to="/contact" $variant={tier.featured ? 'primary' : 'dark'}>
                Choose {tier.name}
              </ChooseButton>
            </TierCard>
          </TierItem>
        ))}
      </TierList>

      {/* Comparison table */}
      <Compare aria-labelledby="compare-title">
        <CompareTitle id="compare-title">Compare every perk</CompareTitle>
        {/* Horizontal scroller wraps the table on small screens */}
        <TableScroll>
          <Table>
            <Caption>Sponsorship tiers and what each includes</Caption>
            <thead>
              <tr>
                <th scope="col">Perk</th>
                {TIERS.map((tier) => (
                  <th key={tier.id} scope="col">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr key={feature.key}>
                  <th scope="row">{feature.label}</th>
                  {TIERS.map((tier) => (
                    <td key={tier.id}>
                      <Centered>
                        <Perk value={tier.perks[feature.key]} />
                      </Centered>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </Compare>
    </div>
  );
}
