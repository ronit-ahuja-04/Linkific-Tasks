import styled from 'styled-components';
import { Alert, Button } from '../ui.jsx';

const Panel = styled(Alert).attrs({ role: 'alert' })`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  ${({ theme }) => theme.media.up('sm')} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;
const Info = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;
const Msg = styled.div`
  font-size: 0.875rem;
`;

/**
 * Accessible error alert panel with a Retry trigger.
 * Complies with requirement PD-3.
 */
export function ErrorPanel({ message, onRetry }) {
  return (
    <Panel $tone="bad">
      <Info>
        <span aria-hidden="true">⚠️</span>
        <div>
          <div style={{ fontWeight: 600 }}>Failed to load data</div>
          <Msg>{message}</Msg>
        </div>
      </Info>
      {onRetry && (
        <Button $variant="danger" $size="sm" onClick={onRetry}>
          Retry Request
        </Button>
      )}
    </Panel>
  );
}
