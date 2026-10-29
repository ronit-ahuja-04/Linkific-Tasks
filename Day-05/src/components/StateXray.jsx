import { Terminal, X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const str = match[0];
      let cls = 'xray-val-default';

      if (/^"/.test(str)) {
        if (/:$/.test(str)) {
          cls = 'xray-token-key';
        } else {
          cls = 'xray-token-string';
        }
      } else if (/true|false/.test(str)) {
        cls = 'xray-token-bool';
      } else if (/null/.test(str)) {
        cls = 'xray-token-null';
      } else {
        cls = 'xray-token-number';
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
      <div key={lineIdx} className="xray-code-line">
        <span className="xray-line-num" aria-hidden="true">{lineIdx + 1}</span>
        <span className="xray-line-content">{parts}</span>
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
      className="hackhq-state-xray"
      role="complementary"
      aria-label={`Live State X-ray telemetry for ${stationTitle}`}
    >
      <div className="xray-header">
        <div className="xray-title-wrap">
          <Terminal size={16} className="xray-badge-icon" aria-hidden="true" />
          <h2 className="xray-title">State X-ray: {stationTitle}</h2>
        </div>
        <div className="xray-controls">
          <button
            type="button"
            className="xray-btn"
            onClick={handleCopy}
            title="Copy state JSON"
            aria-label="Copy state JSON"
          >
            {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />}
            <span className="xray-btn-text">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className="xray-btn xray-close-btn"
            onClick={onClose}
            title="Close X-ray panel"
            aria-label="Close State X-ray"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <p className="xray-description">
        Live telemetry inspector reflecting current local <code>useState</code> snapshot.
      </p>

      <div className="xray-viewport">
        <pre className="xray-pre" tabIndex={0} aria-label="Live JSON state view">
          <code>{highlightJSON(jsonOutput)}</code>
        </pre>
      </div>
    </aside>
  );
}

