import styled from 'styled-components';
import { Badge, Eyebrow, PulseDot } from '../ui.jsx';
import { animateRise } from '../../styles/animations.js';

const Root = styled.header`
  margin-bottom: 1.5rem;
  ${animateRise}
  ${({ theme }) => theme.media.up('lg')} {
    margin-bottom: 3rem;
  }
`;
const Crumb = styled(Eyebrow)`
  margin-bottom: 1rem;
`;
const Sep = styled.span`
  opacity: 0.5;
`;
const Cur = styled.span`
  color: ${({ theme }) => theme.colors.ink};
`;
const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
  }
  ${({ theme }) => theme.media.up('lg')} {
    h1 {
      font-size: 2.5rem;
    }
  }
`;
const Lead = styled.div`
  margin-top: 1rem;
  max-width: 42rem;
  color: ${({ theme }) => theme.colors.muted};
`;

/**
 * Shared breadcrumb + title + status pill used by every page.
 * `children` renders under the title (descriptions, actions).
 */
export default function PageHeader({ breadcrumb, title, pill, children }) {
  return (
    <Root>
      <Crumb>
        Control room <Sep>/</Sep> <Cur>{breadcrumb}</Cur>
      </Crumb>
      <TitleRow>
        <h1>{title}</h1>
        {pill && (
          <Badge $tone="good">
            <PulseDot />
            {pill}
          </Badge>
        )}
      </TitleRow>
      {children && <Lead>{children}</Lead>}
    </Root>
  );
}
