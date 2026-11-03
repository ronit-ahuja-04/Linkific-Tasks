import { Alert } from 'react-bootstrap';
import { Button } from '../ui.jsx';

/**
 * Accessible error alert panel with a Retry trigger.
 * Complies with requirement PD-3.
 */
export function ErrorPanel({ message, onRetry }) {
  return (
    <Alert
      variant="danger"
      className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-sm-between gap-3 mb-0"
    >
      <div className="d-flex align-items-start gap-3">
        <span aria-hidden="true">⚠️</span>
        <div>
          <div className="fw-semibold">Failed to load data</div>
          <div className="small">{message}</div>
        </div>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry Request
        </Button>
      )}
    </Alert>
  );
}
