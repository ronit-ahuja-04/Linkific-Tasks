import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Zap } from 'lucide-react';

const LINKS = [
  { to: '/directory', label: 'Directory' },
  { to: '/swag', label: 'Swag shop' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/contact', label: 'Contact' },
  { to: '/about', label: 'About' },
];

const Root = styled.footer`
  margin-top: auto;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`;
const Inner = styled.div`
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;
  padding: 1.5rem 0.75rem;
  display: grid;
  align-items: center;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
  ${({ theme }) => theme.media.up('sm')} {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  ${({ theme }) => theme.media.up('md')} {
    grid-template-columns: 1fr 1fr;
    gap: 1rem 2rem;
  }
`;
const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  order: 2;
  ${({ theme }) => theme.media.up('md')} {
    order: 1;
  }
`;
const Logo = styled.span`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
`;
const Tagline = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  strong {
    color: ${({ theme }) => theme.colors.ink};
  }
`;
const LinkNav = styled.nav`
  order: 1;
  ${({ theme }) => theme.media.up('md')} {
    order: 2;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    font-size: 0.875rem;
  }
  a {
    color: ${({ theme }) => theme.colors.muted};
    text-decoration: none;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

/**
 * CONCEPT: Responsive order - below `md` the links come first and the brand second;
 * from `md` up the brand is first and the links sit beside it.
 */
export default function Footer() {
  return (
    <Root>
      <Inner>
        <Brand>
          <Logo aria-hidden="true">
            <Zap size={16} strokeWidth={2.5} />
          </Logo>
          <Tagline>
            <strong>HackHQ</strong> · built with React Router and styled-components
          </Tagline>
        </Brand>
        <LinkNav aria-label="Footer">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </LinkNav>
      </Inner>
    </Root>
  );
}
