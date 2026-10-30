import { formatFlapDigits } from '../../lib/counter.js';

/**
 * SplitFlapBoard (CI-6, CI-7)
 * Renders physical split-flap departure-board blades with CSS flip animation on remount.
 */
export default function SplitFlapBoard({ count, capacity }) {
  const digits = formatFlapDigits(count);

  return (
    <div className="split-flap-container" aria-hidden="true">
      <div className="split-flap-board animate-settle">
        {digits.map((digit, index) => (
          <div key={`digit-slot-${index}`} className="split-flap-slot">
            {/* The blade remounts with key={digit} to re-trigger the CSS keyframe animation */}
            <div key={`blade-${digit}`} className="split-flap-blade animate-flap">
              <span className="split-flap-char tabular-nums">{digit}</span>
              <div className="split-flap-seam" />
              <div className="split-flap-hinge left" />
              <div className="split-flap-hinge right" />
            </div>
          </div>
        ))}
      </div>
      <div className="split-flap-capacity-text">
        <span className="capacity-of-label">of</span>
        <span className="capacity-number tabular-nums">{capacity}</span>
      </div>
    </div>
  );
}

