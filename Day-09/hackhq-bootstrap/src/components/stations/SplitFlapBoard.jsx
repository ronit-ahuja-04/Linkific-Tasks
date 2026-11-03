import { formatFlapDigits } from '../../lib/counter.js';

/**
 * SplitFlapBoard (CI-6, CI-7)
 * Renders physical split-flap departure-board blades with CSS flip animation on remount.
 */
export default function SplitFlapBoard({ count, capacity }) {
  const digits = formatFlapDigits(count);

  return (
    <div className="d-flex flex-wrap align-items-center gap-4" aria-hidden="true">
      <div className="d-inline-flex align-items-center gap-2 animate-settle">
        {digits.map((digit, index) => (
          <div
            key={`digit-slot-${index}`}
            style={{
              height: 'clamp(88px, 16vw, 110px)',
              width: 'clamp(60px, 11vw, 82px)',
              perspective: 600,
            }}
          >
            {/* The blade remounts with key={digit} to re-trigger the CSS keyframe animation */}
            <div
              key={`blade-${digit}`}
              className="position-relative d-flex w-100 h-100 animate-flap align-items-center justify-content-center overflow-hidden rounded-3 border border-secondary shadow"
              style={{ background: 'var(--board)' }}
            >
              <span
                className="fw-bold text-brand user-select-none"
                style={{
                  fontSize: 'clamp(3.5rem, 9vw, 4.85rem)',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {digit}
              </span>
              <div
                className="position-absolute start-0 end-0 bg-black"
                style={{ top: '50%', height: 2 }}
              />
              <div
                className="position-absolute start-0 bg-black"
                style={{ top: 'calc(50% - 5px)', height: 10, width: 4 }}
              />
              <div
                className="position-absolute end-0 bg-black"
                style={{ top: 'calc(50% - 5px)', height: 10, width: 4 }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="d-flex align-items-baseline gap-2">
        <span className="fs-4 fw-semibold text-body-secondary">of</span>
        <span className="display-5 fw-bold lh-1">{capacity}</span>
      </div>
    </div>
  );
}
