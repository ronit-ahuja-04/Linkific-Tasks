import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { RadioTower } from 'lucide-react';
import { Board } from '../components/ui.jsx';
import { animateFloat, animateScan } from '../styles/animations.js';

const SUGGESTIONS = [
  { path: '/', label: 'Mission control' },
  { path: '/directory', label: 'Directory' },
  { path: '/swag', label: 'Swag shop' },
  { path: '/clock', label: 'Hack Clock' },
];

const Wrap = styled.div`
  max-width: 48rem;
  margin: 0 auto;
`;
const Panel = styled(Board)`
  position: relative;
  overflow: hidden;
  padding: 3rem 1.5rem;
  text-align: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow};
`;
const Lines = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.07;
  background-image: repeating-linear-gradient(0deg, currentColor 0 1px, transparent 1px 4px);
`;
const Scan = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6rem;
  ${animateScan}
  background: linear-gradient(to bottom, transparent, rgba(190, 242, 100, 0.1), transparent);
`;
const Inner = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  ${({ theme }) => theme.media.up('sm')} {
    padding: 1.5rem 0;
  }
`;
const Icon = styled(RadioTower)`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.brand};
  ${animateFloat}
`;
const Code404 = styled.p`
  margin: 0;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.brand};
  font-size: clamp(5rem, 22vw, 8rem);
  line-height: 1;
  letter-spacing: -0.05em;
`;
const Heading = styled.h1`
  margin: 0.75rem 0 0;
  font-size: 2rem;
  font-weight: 700;
  ${({ theme }) => theme.media.up('lg')} {
    font-size: 2.5rem;
  }
`;
const Msg = styled.p`
  margin: 0.5rem 0 0;
  max-width: 28rem;
  opacity: 0.75;
  word-break: break-word;
  code {
    color: ${({ theme }) => theme.colors.brand};
  }
`;
const Suggest = styled.nav`
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
`;
const Chip = styled(Link)`
  padding: 0.25rem 1rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  text-decoration: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: #f8f9fa;
  border: 1px solid #f8f9fa;
  border-radius: ${({ theme }) => theme.radii.pill};
  transition:
    background-color 0.15s,
    color 0.15s;
  &:hover {
    background: #f8f9fa;
    color: #000;
  }
`;

// CONCEPT: Catch-all route - path="*" matches anything no other route claimed
export default function NotFound() {
  // The splat param holds the unmatched part of the URL
  const { '*': missingPath } = useParams();

  return (
    <Wrap>
      <Panel as="section" aria-labelledby="notfound-title">
        <Lines aria-hidden="true" />
        <Scan aria-hidden="true" />

        <Inner>
          <Icon size={36} aria-hidden="true" />
          <Code404 aria-hidden="true" data-text="404">
            404
          </Code404>
          <Heading id="notfound-title">Signal lost</Heading>
          <Msg>
            No station is broadcasting on <code>/{missingPath}</code>.
          </Msg>

          <Suggest aria-label="Suggested stations">
            {SUGGESTIONS.map((item) => (
              <Chip key={item.path} to={item.path}>
                {item.label}
              </Chip>
            ))}
          </Suggest>
        </Inner>
      </Panel>
    </Wrap>
  );
}
