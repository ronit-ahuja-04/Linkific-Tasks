import styled from 'styled-components';
import { formatFlapDigits } from '../../lib/counter.js';
import { animateFlap, animateSettle } from '../../styles/animations.js';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;
const Digits = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  ${animateSettle}
`;
const Slot = styled.div`
  height: clamp(88px, 16vw, 110px);
  width: clamp(60px, 11vw, 82px);
  perspective: 600px;
`;
const Blade = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.muted};
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.15);
  background: ${({ theme }) => theme.colors.board};
  ${animateFlap}
`;
const Digit = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.brand};
  user-select: none;
  font-size: clamp(3.5rem, 9vw, 4.85rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;
const Hinge = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: #000;
`;
const Notch = styled.div`
  position: absolute;
  top: calc(50% - 5px);
  height: 10px;
  width: 4px;
  background: #000;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
`;
const Of = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
`;
const OfText = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
`;
const Cap = styled.span`
  font-size: calc(1.375rem + 1.5vw);
  font-weight: 700;
  line-height: 1;
  ${({ theme }) => theme.media.up('xl')} {
    font-size: 3rem;
  }
`;

/**
 * SplitFlapBoard (CI-6, CI-7)
 * Renders physical split-flap departure-board blades with CSS flip animation on remount.
 */
export default function SplitFlapBoard({ count, capacity }) {
  const digits = formatFlapDigits(count);

  return (
    <Row aria-hidden="true">
      <Digits>
        {digits.map((digit, index) => (
          <Slot key={`digit-slot-${index}`}>
            {/* The blade remounts with key={digit} to re-trigger the CSS keyframe animation */}
            <Blade key={`blade-${digit}`}>
              <Digit>{digit}</Digit>
              <Hinge />
              <Notch $side="left" />
              <Notch $side="right" />
            </Blade>
          </Slot>
        ))}
      </Digits>
      <Of>
        <OfText>of</OfText>
        <Cap>{capacity}</Cap>
      </Of>
    </Row>
  );
}
