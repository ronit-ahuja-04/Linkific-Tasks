import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'react-bootstrap';

const XRAY_BTN = 'd-inline-flex align-items-center gap-1 text-light';

/**
 * Format and highlight JSON tokens using design spec color tokens:
 * - Keys: lanyard
 * - Strings: mint
 * - Numbers: tape
 * - Booleans / Null: signal
 */
function highlightJSON(jsonString) {
  if (!jsonString) return null;

  // Split lines and token regex
  return jsonString.split('\n').map((line, lineIdx) => {
    // Match JSON components: keys, strings, numbers, booleans, null
    const parts = [];
    const regex =
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const str = match[0];
      let cls = '';

      if (/^"/.test(str)) {
        if (/:$/.test(str)) {
          cls = 'fw-medium text-info';
        } else {
          cls = 'text-success';
        }
      } else if (/true|false/.test(str)) {
        cls = 'fw-semibold text-danger';
      } else if (/null/.test(str)) {
        cls = 'fst-italic text-danger';
      } else {
        cls = 'text-warning';
      }

      parts.push(
        <span key={`${lineIdx}-${match.index}`} className={cls}>
          {str}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <div key={lineIdx}>
        <span style={{ whiteSpace: 'pre' }}>{parts}</span>
      </div>
    );
  });
}

export default function StateXray({
  stationName,
  activeStation,
  stationNames,
  statePayload,
  isOpen,
  onClose,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stationTitle =
    stationName ||
    (stationNames && activeStation ? stationNames[activeStation] : null) ||
    activeStation ||
    'Active Station';
  const jsonOutput = JSON.stringify(statePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      className="position-fixed bottom-0 end-0 m-3 p-3 rounded-4 border border-secondary shadow-lg font-monospace animate-pop overflow-hidden"
      style={{
        width: 'min(360px, calc(100vw - 1.5rem))',
        zIndex: 1040,
        background: 'var(--board)',
        color: 'var(--on-board)',
      }}
      role="complementary"
      aria-label={`Live State X-ray telemetry for ${stationTitle}`}
    >
      <div className="d-flex align-items-start justify-content-between gap-3">
        <div style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2">
            <h2 className="fs-6 fw-semibold mb-0">State X-ray</h2>
            <span
              className="d-inline-block rounded-circle bg-brand"
              style={{ width: 8, height: 8 }}
              aria-hidden="true"
            />
          </div>
          <span className="mt-1 d-block text-truncate small text-uppercase ls-wide opacity-75">
            Live state for {stationTitle.toLowerCase()}
          </span>
        </div>
        <div className="d-flex flex-shrink-0 align-items-center gap-1">
          <Button
            variant="outline-light"
            size="sm"
            className={XRAY_BTN}
            onClick={handleCopy}
            title="Copy state JSON"
            aria-label="Copy state JSON"
          >
            {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
            <span className="small">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className={XRAY_BTN}
            onClick={onClose}
            title="Close X-ray panel"
            aria-label="Close State X-ray"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      <hr className="my-3 border-secondary opacity-50" />

      <div
        className="overflow-auto rounded-3 p-3"
        style={{ maxHeight: '50vh', background: 'rgba(0,0,0,.3)' }}
      >
        <pre
          className="m-0 small"
          style={{ color: 'inherit' }}
          tabIndex={0}
          aria-label="Live JSON state view"
        >
          <code>{highlightJSON(jsonOutput)}</code>
        </pre>
      </div>
    </aside>
  );
}
