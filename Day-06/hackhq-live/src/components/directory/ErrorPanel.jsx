/**
 * Accessible error alert panel with a Retry trigger.
 * Complies with requirement PD-3.
 */
export function ErrorPanel({ message, onRetry }) {
  return (
    <div role="alert" className="live-error-box">
      <div className="live-error-title-row">
        <span aria-hidden="true">⚠️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Failed to load data</div>
          <div className="live-error-msg">{message}</div>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="live-error-retry-btn">
          Retry Request
        </button>
      )}
    </div>
  );
}
