import { formatFlapDigits } from '../../lib/counter.js';

/**
 * SplitFlapBoard (CI-6, CI-7)
 * Renders physical split-flap departure-board blades with CSS flip animation on remount.
 */
export default function SplitFlapBoard({ count, capacity }) {
  const digits = formatFlapDigits(count);

  return (
    <div className="flex flex-wrap items-center gap-5" aria-hidden="true">
      <div className="inline-flex items-center gap-2 sm:gap-2.5 animate-settle">
        {digits.map((digit, index) => (
          <div
            key={`digit-slot-${index}`}
            className="h-[88px] w-16 [perspective:600px] sm:h-[110px] sm:w-[82px]"
          >
            {/* The blade remounts with key={digit} to re-trigger the CSS keyframe animation */}
            <div
              key={`blade-${digit}`}
              className="relative flex size-full animate-flap items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-board shadow-pop"
            >
              <span className="font-display text-[3.75rem] leading-none font-bold text-brand tabular-nums select-none sm:text-[4.85rem]">
                {digit}
              </span>
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-black shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
              <div className="absolute top-1/2 left-0 -mt-[5px] h-2.5 w-1 rounded-[1px] bg-black" />
              <div className="absolute top-1/2 right-0 -mt-[5px] h-2.5 w-1 rounded-[1px] bg-black" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-baseline gap-2 font-display">
        <span className="text-xl font-semibold text-muted">of</span>
        <span className="text-4xl leading-none font-bold tabular-nums">{capacity}</span>
      </div>
    </div>
  );
}
