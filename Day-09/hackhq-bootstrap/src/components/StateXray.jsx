import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const XRAY_BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-on-board/80 transition hover:bg-white/10 hover:text-on-board';

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
          cls = 'font-medium text-violet-300';
        } else {
          cls = 'text-emerald-400';
        }
      } else if (/true|false/.test(str)) {
        cls = 'font-semibold text-rose-400';
      } else if (/null/.test(str)) {
        cls = 'italic text-rose-400';
      } else {
        cls = 'text-amber-300';
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
      <div key={lineIdx} className="block">
        <span className="whitespace-pre">{parts}</span>
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
      className="w-full shrink-0 overflow-hidden rounded-card border border-white/10 bg-board p-5 font-mono text-on-board shadow-pop animate-pop lg:w-[360px]"
      role="complementary"
      aria-label={`Live State X-ray telemetry for ${stationTitle}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold tracking-tight text-on-board">
              State X-ray
            </h2>
            <span className="size-2 animate-ping-slow rounded-full bg-brand" aria-hidden="true" />
          </div>
          <span className="mt-1 block truncate text-[0.68rem] tracking-wider text-on-board/60 uppercase">
            Live state for {stationTitle.toLowerCase()}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className={XRAY_BTN}
            onClick={handleCopy}
            title="Copy state JSON"
            aria-label="Copy state JSON"
          >
            {copied ? <Check size={13} className="text-brand" /> : <Copy size={13} />}
            <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className={XRAY_BTN}
            onClick={onClose}
            title="Close X-ray panel"
            aria-label="Close State X-ray"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="my-4 h-px bg-white/10" />

      <div className="max-h-80 overflow-auto rounded-xl bg-black/30 p-3 lg:max-h-[60vh]">
        <pre
          className="m-0 text-[0.8rem] leading-relaxed text-on-board/90 focus-visible:outline-2 focus-visible:outline-brand"
          tabIndex={0}
          aria-label="Live JSON state view"
        >
          <code>{highlightJSON(jsonOutput)}</code>
        </pre>
      </div>
    </aside>
  );
}
